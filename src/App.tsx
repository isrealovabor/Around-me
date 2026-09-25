import { useEffect, useMemo, useState, type ReactNode } from 'react'
import {
  Bell, Bookmark, BriefcaseBusiness, Building2, CheckCircle2, ChevronDown, CircleHelp,
  Flame, Heart, Home, Image, MapPin, Menu, MessageCircle, MoreHorizontal, Plus,
  Search, Send, ShieldAlert, ShoppingBag, Siren, Sparkles, ThumbsUp, TrafficCone, X,
  AlertTriangle, BadgeCheck, Car, Droplets, FlameKindling, Phone, Users, Wrench, Package, MessageSquare,
  Compass, UserRound, LayoutDashboard, Flag, Eye, Ban, ShieldCheck, BarChart3, FileWarning, Check, Trash2, ChevronRight
} from 'lucide-react'
import { PILOT } from './config/pilot'
import { MapView, type PublicMapMarker } from './maps/MapView'
import { WeatherCard } from './weather/WeatherCard'
import { resolveHomeContext, type CommunityContext, type CurrentUser } from './lib/home-context'
import { displayLgaName, findLocationByName, type LocationOption } from './lib/location-selector'
import { LAGOS_LGAS } from './config/lagos'
import { NIGERIA_GEOGRAPHY, type MapCenter } from './config/geography'
import { mapboxAccessToken } from './maps/config'

type Category = 'General' | 'Question' | 'Safety' | 'Traffic' | 'Emergency' | 'Lost & Found' | 'Marketplace' | 'Services' | 'Events' | 'Jobs' | 'Local Issues'
type Post = { id: string | number; name: string; initials: string; tone: string; time: string; category: Category; text: string; reactions: number; comments: number; image?: string; verified?: boolean; location?: string; saved?: boolean }
type AlertStatus = 'Reported' | 'Community Confirmed' | 'Verified' | 'Resolved'
type Alert = { id: number; category: string; title: string; description: string; location: string; time: string; status: AlertStatus; confirmations: number; confidence: 'Low' | 'Developing' | 'High'; sourceType: 'Community report' | 'Official source' | 'Moderated report'; requiresReview?: boolean }
type Service = { id: number; name: string; category: string; description: string; area: string; phone: string; recommendations: number; verified?: boolean; image: string }
type Listing = { id: number; title: string; description: string; price: string; category: string; location: string; seller: string; initials: string; status: 'Available' | 'Reserved' | 'Sold'; image: string; time: string }
type Notification = { id: number; type: 'Comment' | 'Recommendation' | 'Announcement' | 'Safety alert' | 'Marketplace'; title: string; detail: string; time: string; unread?: boolean }

const categories: { name: Category; icon: typeof Home; color: string }[] = [
  { name: 'General', icon: Home, color: 'blue' }, { name: 'Question', icon: CircleHelp, color: 'violet' }, { name: 'Safety', icon: ShieldAlert, color: 'red' },
  { name: 'Traffic', icon: TrafficCone, color: 'amber' }, { name: 'Emergency', icon: Siren, color: 'red' },
  { name: 'Lost & Found', icon: CircleHelp, color: 'violet' }, { name: 'Marketplace', icon: ShoppingBag, color: 'green' },
  { name: 'Services', icon: Building2, color: 'orange' }, { name: 'Events', icon: Sparkles, color: 'pink' },
  { name: 'Jobs', icon: BriefcaseBusiness, color: 'cyan' }, { name: 'Local Issues', icon: Flame, color: 'yellow' }
]

const starterPosts: Post[] = []
const starterAlerts: Alert[] = []
const services: Service[] = []
const starterListings: Listing[] = []
const notifications: Notification[] = []
const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_API_URL ?? 'http://localhost:3000'
async function authRequest(path: string, init?: RequestInit) {
  const response = await fetch(`${apiBaseUrl}${path}`, { credentials: 'include', headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) }, ...init })
  const payload = await response.json().catch(() => ({})) as { message?: string; error?: { message?: string }; emailVerified?: boolean }
  if (!response.ok) throw new Error(payload.error?.message ?? 'We could not complete that request. Please try again.')
  return payload
}

async function readCurrentSession(): Promise<CurrentUser | null> {
  const response = await fetch(`${apiBaseUrl}/auth/session`, { credentials: 'include' })
  if (!response.ok) return null
  const payload = await response.json().catch(() => ({ authenticated: false })) as { authenticated?: boolean; user?: CurrentUser }
  return payload.authenticated && payload.user ? payload.user : null
}

const apiCategoryLabels: Record<string, Category> = { GENERAL: 'General', QUESTION: 'Question', SAFETY: 'Safety', TRAFFIC: 'Traffic', EMERGENCY: 'Emergency', LOST_FOUND: 'Lost & Found', MARKETPLACE: 'Marketplace', SERVICES: 'Services', EVENTS: 'Events', JOBS: 'Jobs', LOCAL_ISSUES: 'Local Issues' }
const communitySlug = (name: string) => name.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
async function readPublicCommunityPosts(slug: string): Promise<Post[]> {
  const communityResponse = await fetch(`${apiBaseUrl}/communities/${encodeURIComponent(slug)}`)
  if (!communityResponse.ok) return []
  const communityPayload = await communityResponse.json() as { community?: { id?: string } }
  if (!communityPayload.community?.id) return []
  const postsResponse = await fetch(`${apiBaseUrl}/posts?scope=community&communityId=${encodeURIComponent(communityPayload.community.id)}`)
  if (!postsResponse.ok) return []
  const payload = await postsResponse.json() as { posts?: Array<{ id: string; body: string; category: string; createdAt: string; locationLabel?: string | null; author: { name: string; verificationStatus?: string }; _count: { comments: number; reactions: number } }> }
  return (payload.posts ?? []).map((post, index) => ({ id: post.id, name: post.author.name, initials: post.author.name.slice(0, 2).toUpperCase(), tone: ['navy', 'teal', 'purple'][index % 3], time: new Date(post.createdAt).toLocaleDateString('en-NG', { day: 'numeric', month: 'short' }), category: apiCategoryLabels[post.category] ?? 'General', text: post.body, reactions: post._count.reactions, comments: post._count.comments, location: post.locationLabel ?? undefined, verified: post.author.verificationStatus === 'VERIFIED' }))
}

function Avatar({ initials, tone }: { initials: string; tone: string }) { return <div className={`avatar ${tone}`}>{initials}</div> }

export default function App() {
  const [posts, setPosts] = useState(starterPosts)
  const [activeCategory, setActiveCategory] = useState<Category | 'All'>('All')
  const [showComposer, setShowComposer] = useState(false)
  const [showAuth, setShowAuth] = useState(false)
  const [authMode, setAuthMode] = useState<'sign in' | 'join'>('join')
  const [communityOpen, setCommunityOpen] = useState(false)
  const [selectedCommunity, setSelectedCommunity] = useState<CommunityContext | null>(null)
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null)
  const [sessionReady, setSessionReady] = useState(false)
  const [notice, setNotice] = useState('')
  const [view, setView] = useState<'home' | 'explore' | 'alerts' | 'services' | 'marketplace' | 'notifications' | 'admin' | 'profile' | 'community'>('home')
  const [showOnboarding, setShowOnboarding] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [exploreLocation, setExploreLocation] = useState<(typeof LAGOS_LGAS)[number] | null>(null)
  const [authDeepLink, setAuthDeepLink] = useState<{ type: 'verify' | 'reset'; token: string } | undefined>()
  const unreadNotificationCount = notifications.filter(notification => notification.unread).length
  const homeContext = resolveHomeContext(currentUser, selectedCommunity)
  const community = homeContext.community
  const communityName = community?.name
  const authenticated = Boolean(currentUser)

  const refreshSession = async () => {
    const user = await readCurrentSession()
    setCurrentUser(user)
    setSessionReady(true)
    if (user?.primaryCommunity) setSelectedCommunity(null)
    return user
  }

  useEffect(() => {
    // Earlier preview builds never used these values as a source of truth. Remove any stale copies.
    for (const key of ['around-me-auth', 'around-me-profile', 'around-me-community', 'around_me_auth']) {
      window.localStorage.removeItem(key)
      window.sessionStorage.removeItem(key)
    }
    void refreshSession()
    const token = new URLSearchParams(window.location.search).get('token')
    const type = window.location.pathname === '/verify-email' ? 'verify' : window.location.pathname === '/reset-password' ? 'reset' : undefined
    if (type && token) { setAuthDeepLink({ type, token }); setShowAuth(true); setAuthMode(type === 'reset' ? 'sign in' : 'join') }
  }, [])

  useEffect(() => {
    const slug = community?.slug ?? (communityName ? communitySlug(communityName) : '')
    if (!slug) { setPosts([]); return }
    let active = true
    void readPublicCommunityPosts(slug).then(posts => { if (active) setPosts(posts) }).catch(() => { if (active) setPosts([]) })
    return () => { active = false }
  }, [community?.slug, communityName])

  const displayedPosts = useMemo(() => activeCategory === 'All' ? posts : posts.filter(p => p.category === activeCategory), [posts, activeCategory])
  const publish = (text: string, category: Category) => {
    if (!currentUser || !communityName) { setShowAuth(true); setAuthMode('sign in'); return }
    setPosts([{ id: Date.now(), name: currentUser.name, initials: currentUser.name.slice(0, 2).toUpperCase(), tone: 'navy', time: 'Just now', category, text, reactions: 0, comments: 0, location: communityName }, ...posts])
    setShowComposer(false); setNotice(`Your update is now live in ${communityName}.`)
    window.setTimeout(() => setNotice(''), 3500)
  }
  const beginCreatePost = () => {
    if (!authenticated) { setNotice('Sign in to share with your community.'); setAuthMode('sign in'); setShowAuth(true); return }
    if (!communityName) { setNotice('Choose a community before sharing an update.'); setShowOnboarding(true); return }
    setShowComposer(true)
  }
  return <div className="app-shell">
    <header className="topbar">
      <a className="brand" href="#top" aria-label="Around Me home"><span className="brand-mark"><MapPin size={22}/></span><span>Around<span>Me</span></span></a>
      <button className="community-switcher" onClick={() => setCommunityOpen(!communityOpen)}><MapPin size={17}/><span>{communityName ?? 'Choose location'}</span><ChevronDown size={16}/></button>
      {communityOpen && <div className="community-menu"><b>{communityName ? 'Current community' : 'Find your community'}</b>{communityName && <button onClick={() => setCommunityOpen(false)}>✓ {communityName}</button>}<button className="add-community" onClick={() => { setCommunityOpen(false); setShowOnboarding(true) }}><Plus size={15}/> Find a Nigerian community</button></div>}
      <label className="search"><Search size={18}/><input value={searchTerm} onChange={e => setSearchTerm(e.target.value)} onKeyDown={event => { if (event.key === 'Enter') setView('explore') }} placeholder="Search communities, posts, services..."/></label>
      <div className="top-actions">{authenticated && <button className="icon-button" onClick={() => setView('notifications')} aria-label={unreadNotificationCount ? `${unreadNotificationCount} unread notifications` : 'Notifications'}><Bell size={20}/>{unreadNotificationCount > 0 && <i>{unreadNotificationCount}</i>}</button>}{authenticated ? <button className="login" onClick={() => setView('profile')}><Avatar initials={currentUser!.name.slice(0, 2).toUpperCase()} tone="navy"/></button> : <><button className="login" onClick={() => {setAuthMode('sign in');setShowAuth(true)}}>Sign in</button><button className="join" onClick={() => {setAuthMode('join');setShowAuth(true)}}>Join your community</button></>}<button className="mobile-menu"><Menu/></button></div>
    </header>

    <main id="top" className="layout">
      <aside className="left-rail">
        <nav><button className={view === 'home' ? 'selected' : ''} onClick={() => setView('home')}><Home size={20}/> Home</button><button className={view === 'explore' ? 'selected' : ''} onClick={() => setView('explore')}><Compass size={20}/> Explore</button><button className={view === 'alerts' ? 'selected' : ''} onClick={() => setView('alerts')}><Siren size={20}/> Alerts <span className="nav-count">{starterAlerts.filter(a => a.status !== 'Resolved').length}</span></button><button className={view === 'marketplace' ? 'selected' : ''} onClick={() => setView('marketplace')}><ShoppingBag size={20}/> Marketplace</button><button className={view === 'services' ? 'selected' : ''} onClick={() => setView('services')}><Wrench size={20}/> Services</button>{authenticated && <button className={view === 'profile' ? 'selected' : ''} onClick={() => setView('profile')}><UserRound size={20}/> Profile</button>}</nav>
        <div className="rail-section"><p className="eyebrow">YOUR COMMUNITY</p>{communityName ? <><a className="community-link"><span className="community-icon">{communityName.slice(0, 2).toUpperCase()}</span>{communityName}</a><button className="text-button" onClick={() => setShowOnboarding(true)}><Plus size={17}/> Choose another community</button></> : <><p>Find updates, services and alerts near you.</p><button className="text-button" onClick={() => setShowOnboarding(true)}><Plus size={17}/> Find your community</button></>}</div>
        <div className="rail-footer"><span>About Around Me</span><span>Guidelines</span><span>Help centre</span>{authenticated && <button className="admin-link" onClick={() => setView('admin')}><LayoutDashboard size={14}/> Admin dashboard</button>}<p>© 2026 Around Me</p></div>
      </aside>

      <section className="feed">
        {view === 'home' ? <>
        {!sessionReady ? <div className="empty"><Sparkles/><h3>Loading Around Me</h3></div> : !communityName ? <PublicHome authenticated={authenticated} onChoose={() => setShowOnboarding(true)} onSignIn={() => { setAuthMode('sign in'); setShowAuth(true) }} onCreate={beginCreatePost} onNavigate={setView} /> : <>
        {communityName === PILOT.community && <div className="demo-notice"><Sparkles size={15}/><span>Ojo is an early launch community. Content appears here because you selected Ojo.</span></div>}
        <div className="feed-heading"><div><p className="eyebrow">NEIGHBOURHOOD FEED</p><h1>What’s happening around {communityName}?</h1><p><MapPin size={14}/> {community?.location?.parentName ? `${community.location.parentName} · ` : ''}{community?.location?.name ?? communityName}</p></div>{authenticated && <button className="create-button" onClick={() => setShowComposer(true)}><Plus size={19}/> Create post</button>}</div>
        <AroundMeNow posts={posts} community={communityName} onNavigate={setView}/>
        <div className="category-row"><button className={activeCategory === 'All' ? 'chip active' : 'chip'} onClick={() => setActiveCategory('All')}>For you</button>{categories.slice(0, 5).map(c => <button key={c.name} className={activeCategory === c.name ? 'chip active' : 'chip'} onClick={() => setActiveCategory(c.name)}>{c.name}</button>)}<button className="chip">More <ChevronDown size={14}/></button></div>
        {showComposer && authenticated && <Composer community={communityName} onClose={() => setShowComposer(false)} onPublish={publish}/>}
        {authenticated && <button className="quick-post" onClick={() => setShowComposer(true)}><Avatar initials={currentUser!.name.slice(0, 2).toUpperCase()} tone="navy"/><span>Share something with your neighbours...</span><Image size={21}/></button>}
        {displayedPosts.map(post => <PostCard key={post.id} post={post} currentUser={currentUser}/>) }
        {displayedPosts.length === 0 && <div className="empty"><Sparkles/><h3>No {activeCategory === 'All' ? '' : activeCategory.toLowerCase()} posts around {communityName} yet</h3><p>{authenticated ? 'Be the first neighbour to share an update.' : 'Sign in to join this community conversation.'}</p><button className="join" onClick={() => authenticated ? setShowComposer(true) : setShowAuth(true)}>{authenticated ? 'Create a post' : 'Sign in to join'}</button></div>}
        </>}
        </> : view === 'alerts' ? <AlertsPage community={communityName ?? 'Nigeria'} setNotice={setNotice}/>
          : view === 'services' ? <ServicesPage community={communityName ?? 'Nigeria'} setNotice={setNotice}/>
          : view === 'marketplace' ? <MarketplacePage community={communityName ?? 'Nigeria'} setNotice={setNotice}/>
          : view === 'notifications' ? <NotificationsPage/>
          : view === 'explore' ? <ExplorePage community={communityName} onNavigate={setView} searchTerm={searchTerm} onChoose={() => setShowOnboarding(true)} exploreLocation={exploreLocation} setExploreLocation={setExploreLocation}/>
          : view === 'profile' && currentUser ? <ProfilePage userName={currentUser.name} community={communityName} posts={posts} onOnboard={() => setShowOnboarding(true)} onLogout={async () => { try { await authRequest('/auth/logout', { method: 'POST' }) } finally { setCurrentUser(null); setSelectedCommunity(null); setPosts([]); setView('home'); void refreshSession() } }} />
          : view === 'community' && communityName ? <CommunityProfile community={communityName} posts={posts} onBack={() => setView('home')}/>
          : <AdminDashboard setNotice={setNotice}/>}
      </section>

      <aside className="right-rail">
        {communityName ? <section className="card weather"><WeatherCard location={communityName}/><button aria-label="Weather options"><MoreHorizontal size={18}/></button></section> : <section className="card weather"><p className="eyebrow">WEATHER</p><p>Choose a location to see local weather.</p></section>}
        <section className="card welcome"><div className="welcome-illustration"><span>🏠</span><span>🌿</span></div><h2>Your neighbourhood,<br/>made friendlier.</h2><p>Connect with people and places that make your local life better.</p><button className="join" onClick={() => {setAuthMode('join');setShowAuth(true)}}>Join Around Me</button></section>
        {communityName ? <section className="card trending"><div className="section-title"><h3>{communityName} community board</h3>{authenticated && <button onClick={() => setShowComposer(true)}>Share update</button>}</div><a><span className="topic-dot orange-dot"/>Power reports <small>No reports yet</small></a><a><span className="topic-dot green-dot"/>Traffic & roads <small>No reports yet</small></a><a><span className="topic-dot red-dot"/>Local services <small>Be first to recommend</small></a></section> : <section className="card trending"><div className="section-title"><h3>What’s Around Me?</h3></div><p>Local alerts, trusted services and community updates—once you choose a community.</p><button className="text-button" onClick={() => setShowOnboarding(true)}>Explore communities</button></section>}
        <section className="safety-note"><ShieldAlert size={18}/><p><b>Your location stays private.</b> We only show the community you choose—not your exact address.</p></section>
      </aside>
    </main>
    <nav className="mobile-bottom" aria-label="Mobile navigation"><button className={view === 'home' ? 'active' : ''} onClick={() => setView('home')}><Home/><span>Home</span></button><button className={view === 'explore' ? 'active' : ''} onClick={() => setView('explore')}><Compass/><span>Explore</span></button><button className="mobile-post" onClick={beginCreatePost}><Plus/><span>Post</span></button><button className={view === 'alerts' ? 'active' : ''} onClick={() => setView('alerts')}><Siren/><span>Alerts</span></button><button className={view === 'profile' ? 'active' : ''} onClick={() => authenticated ? setView('profile') : (setAuthMode('sign in'), setShowAuth(true))}><UserRound/><span>Profile</span></button></nav>
    {notice && <div className="toast"><CheckCircle2 size={19}/>{notice}</div>}
    {showAuth && <AuthModal mode={authMode} deepLink={authDeepLink} close={() => {setShowAuth(false);setAuthDeepLink(undefined)}} onModeChange={setAuthMode} onAuthenticated={async () => { const user = await refreshSession(); setShowAuth(false); if (!user?.primaryCommunity) setShowOnboarding(true) }} />}
    {showOnboarding && <DatabaseLocationOnboarding close={() => setShowOnboarding(false)} complete={async ({ primaryCommunity, state, lga }) => { if (currentUser) { await authRequest('/auth/session/location', { method: 'PATCH', body: JSON.stringify({ community: primaryCommunity, state, lga }) }); await refreshSession() } else setSelectedCommunity({ name: primaryCommunity, location: { name: lga || primaryCommunity, parentName: state || undefined } }); setShowOnboarding(false); setView('home'); setNotice(`Showing updates for ${primaryCommunity}.`) }} />}
  </div>
}

function AroundMeNow({ posts, community, onNavigate }: { posts: Post[]; community: string; onNavigate: (view: 'alerts' | 'marketplace' | 'services') => void }) {
  const alertCount = starterAlerts.filter(alert => alert.status !== 'Resolved').length
  return <section className="now-panel"><div className="section-title"><div><p className="eyebrow">AROUND ME NOW · {community.toUpperCase()}</p><h2>From your community</h2></div><span>Platform activity only</span></div><div className="now-grid"><button onClick={() => onNavigate('alerts')}><Siren/><b>{alertCount ? `${alertCount} community reports` : 'No alerts right now'}</b><small>Reports appear after submission</small></button><button onClick={() => onNavigate('marketplace')}><ShoppingBag/><b>{starterListings.length ? `${starterListings.length} local listings` : `List an item near ${community}`}</b><small>Shared by neighbours</small></button><button onClick={() => onNavigate('services')}><Wrench/><b>Recommend a local service</b><small>Services near {community}</small></button></div></section>
}

function PublicHome({ authenticated, onChoose, onSignIn, onCreate, onNavigate }: { authenticated: boolean; onChoose: () => void; onSignIn: () => void; onCreate: () => void; onNavigate: (view: 'explore' | 'alerts' | 'marketplace' | 'services') => void }) {
  const title = authenticated ? 'Choose your community' : 'Know what’s happening around you.'
  const description = authenticated ? 'Select where you live or the community you want to follow to see updates near you.' : 'Connect with your community, discover local updates, trusted services, marketplace listings and important information near you.'
  return <div className="public-home"><div className="page-hero explore-hero"><div><p className="eyebrow">NIGERIA-WIDE COMMUNITY PLATFORM</p><h1>{title}</h1><p>{description}</p><div className="hero-actions"><button className="join" onClick={onChoose}>{authenticated ? 'Choose community' : 'Join your community'}</button>{!authenticated && <button className="login" onClick={onSignIn}>Sign in</button>}<button className="login" onClick={onCreate}>Create a post</button></div></div><Compass size={36}/></div><div className="explore-section"><h2>Find your community</h2><p>Choose a state, LGA and area to explore local conversations without sharing your exact address.</p><button className="join" onClick={() => onNavigate('explore')}>Explore communities</button><div className="now-grid public-features"><button type="button" onClick={() => onNavigate('alerts')}><Siren/><b>Community updates</b><small>See local reports with their source and status.</small></button><button type="button" onClick={() => onNavigate('marketplace')}><ShoppingBag/><b>Marketplace</b><small>Buy and sell closer to home.</small></button><button type="button" onClick={() => onNavigate('services')}><Wrench/><b>Trusted local services</b><small>Find providers recommended by neighbours.</small></button></div></div></div>
}

async function readLocationOptions(path: string): Promise<LocationOption[]> {
  const response = await fetch(`${apiBaseUrl}${path}`)
  if (!response.ok) throw new Error('Location data is temporarily unavailable.')
  const payload = await response.json() as { locations?: LocationOption[] }
  return payload.locations ?? []
}

/** Database-driven onboarding: state, LGA and area records are never derived from the Ojo pilot config. */
function DatabaseLocationOnboarding({ close, complete }: { close: () => void; complete: (value: { primaryCommunity: string; state: string; lga: string }) => void }) {
  const [step, setStep] = useState(1)
  const [states, setStates] = useState<LocationOption[]>([])
  const [lgas, setLgas] = useState<LocationOption[]>([])
  const [areas, setAreas] = useState<LocationOption[]>([])
  const [stateQuery, setStateQuery] = useState('')
  const [lgaQuery, setLgaQuery] = useState('')
  const [areaQuery, setAreaQuery] = useState('')
  const [selectedState, setSelectedState] = useState<LocationOption | null>(null)
  const [selectedLga, setSelectedLga] = useState<LocationOption | null>(null)
  const [status, setStatus] = useState('')

  useEffect(() => { void readLocationOptions('/locations/states').then(setStates).catch(error => setStatus(error instanceof Error ? error.message : 'Location data is unavailable.')) }, [])
  useEffect(() => {
    setSelectedLga(null); setLgaQuery(''); setLgas([]); setAreas([]); setAreaQuery('')
    if (!selectedState) return
    void readLocationOptions(`/locations/states/${encodeURIComponent(selectedState.id)}/lgas`).then(setLgas).catch(error => setStatus(error instanceof Error ? error.message : 'Local government areas are unavailable.'))
  }, [selectedState?.id])
  useEffect(() => {
    setAreas([]); setAreaQuery('')
    if (!selectedLga) return
    void readLocationOptions(`/locations/lgas/${encodeURIComponent(selectedLga.id)}/areas`).then(setAreas).catch(error => setStatus(error instanceof Error ? error.message : 'Areas are unavailable.'))
  }, [selectedLga?.id])

  const chooseState = (value: string) => { setStateQuery(value); const match = findLocationByName(states, value); setSelectedState(match); if (!match && value.trim()) setStatus('Select a state from the available list.') }
  const chooseLga = (value: string) => { setLgaQuery(value); const match = findLocationByName(lgas, value, item => displayLgaName(item.name)); setSelectedLga(match); if (!match && value.trim()) setStatus('Select an LGA from the available list.') }
  const communityName = areaQuery.trim() || selectedLga?.name || ''
  const hasDetailedAreas = areas.length > 0

  return <div className="modal-backdrop" role="dialog" aria-modal="true"><section className="onboarding-modal"><button className="modal-close" onClick={close}><X/></button><div className="onboarding-progress"><i className={step >= 1 ? 'done' : ''}/><i className={step >= 2 ? 'done' : ''}/><i className={step >= 3 ? 'done' : ''}/></div>{step === 1 ? <><p className="eyebrow">WELCOME TO AROUND ME</p><h2>Find your community</h2><p>Available across Nigeria. We’ll show your chosen area—not your exact home address.</p><button className="join wide" onClick={() => setStep(2)}>Choose a location</button></> : step === 2 ? <><p className="eyebrow">LOCATION</p><h2>Where are you based?</h2><p>Select your state and local government area to find your community.</p><label>State<input list="database-states" value={stateQuery} onChange={event => chooseState(event.target.value)} placeholder="Search or select your state"/><datalist id="database-states">{states.map(item => <option key={item.id} value={item.name}/>)}</datalist></label><label>Local government area<input list="database-lgas" value={lgaQuery} onChange={event => chooseLga(event.target.value)} placeholder="Search or select your LGA" disabled={!selectedState}/><datalist id="database-lgas">{lgas.map(item => <option key={item.id} value={displayLgaName(item.name)}/>)}</datalist></label><button className="join wide" disabled={!selectedState || !selectedLga} onClick={() => { setStatus(''); setStep(3) }}>Continue</button><button className="link-button" onClick={() => setStep(1)}>Back</button></> : <><p className="eyebrow">YOUR AREA</p><h2>{hasDetailedAreas ? `Where in ${displayLgaName(selectedLga?.name ?? '')} are you?` : `Explore ${displayLgaName(selectedLga?.name ?? '')}`}</h2><p>{hasDetailedAreas ? 'Select an available local area. Exact residential addresses are never requested.' : 'More local communities are being added. You can continue with this LGA as your community context.'}</p>{hasDetailedAreas && <label>Area or community<input list="database-areas" value={areaQuery} onChange={event => setAreaQuery(event.target.value)} placeholder="Search or select an area"/><datalist id="database-areas">{areas.map(item => <option key={item.id} value={item.name}/>)}</datalist></label>}<button className="join wide" disabled={!selectedLga || (hasDetailedAreas && !areaQuery.trim())} onClick={() => complete({ primaryCommunity: communityName, state: selectedState!.name, lga: selectedLga!.name })}>Explore {areaQuery.trim() || displayLgaName(selectedLga?.name ?? '')}</button><button className="link-button" onClick={() => setStep(2)}>Back</button></>}{status && <p className="location-status">{status}</p>}</section></div>
}

function ExplorePage({ community, onNavigate, searchTerm, onChoose, exploreLocation, setExploreLocation }: { community?: string; onNavigate: (view: 'community' | 'services' | 'marketplace' | 'alerts') => void; searchTerm: string; onChoose: () => void; exploreLocation: (typeof LAGOS_LGAS)[number] | null; setExploreLocation: (location: (typeof LAGOS_LGAS)[number] | null) => void }) {
  const [query, setQuery] = useState(searchTerm)
  const [mode, setMode] = useState<'map' | 'list'>('map')
  const [mapMessage, setMapMessage] = useState('')
  const matches = LAGOS_LGAS.filter(lga => lga.name.toLowerCase().includes(query.trim().toLowerCase()))
  const mapMarkers = useMemo<PublicMapMarker[]>(() => LAGOS_LGAS.map(lga => ({ id: lga.slug, label: `${lga.name} LGA`, coordinates: lga.center, kind: 'community' })), [])
  const center: MapCenter = exploreLocation?.center ?? NIGERIA_GEOGRAPHY.launchMarkets[0].defaultCenter
  const chooseLga = (lga: (typeof LAGOS_LGAS)[number]) => { setExploreLocation(lga); setMapMessage(`Exploring ${lga.name}. This does not change your primary community.`) }
  return <div className="directory-page"><div className="page-hero explore-hero"><div><p className="eyebrow">DISCOVER AROUND YOU</p><h1>{exploreLocation ? `Exploring ${exploreLocation.name}` : 'Explore Lagos'}</h1><p>Browse public communities and verified geographic locations. Exploring never joins or changes your primary community.</p></div><Compass size={36}/></div><div className="service-search"><Search size={19}/><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Search Lagos LGAs, communities and places"/>{!community && <button className="join" onClick={onChoose}>Choose my community</button>}</div><div className="community-tabs"><button className={mode === 'map' ? 'chip active' : 'chip'} onClick={() => setMode('map')}>Map</button><button className={mode === 'list' ? 'chip active' : 'chip'} onClick={() => setMode('list')}>List</button>{exploreLocation && <button className="chip" onClick={() => setExploreLocation(null)}>Explore all Lagos</button>}</div>{mode === 'map' ? <section className="card explore-map">{mapboxAccessToken ? <MapView center={center} zoom={exploreLocation ? 12 : 10} markers={mapMarkers} onMarkerSelect={marker => { const lga = LAGOS_LGAS.find(item => item.slug === marker.id); if (lga) chooseLga(lga) }} onSelect={() => setMapMessage('No recent community activity here yet. Select a community marker or search Lagos to continue.')}/> : <div className="empty"><MapPin/><h3>Map provider/API key required.</h3><p>Location browsing remains available in list mode.</p></div>}<p className="muted">{mapMessage || 'Community markers are verified geographic locations. No incident markers are shown without public activity data.'}</p></section> : <section className="explore-section"><h2>Lagos LGAs</h2><p>20 Local Government Areas are available. LCDAs are intentionally separate.</p>{matches.map(lga => <button className="explore-result card" key={lga.slug} onClick={() => chooseLga(lga)}><span>Community</span><div><b>{lga.name}</b><p>{lga.name === 'Ojo' ? 'Launch community with the deepest initial local coverage.' : 'Public geographic location — activity appears as it is added.'}</p></div><ChevronRight size={18}/></button>)}{matches.length === 0 && <div className="empty"><Search/><h3>No Lagos LGA matches</h3><p>Try another LGA or use the Nigeria-wide location picker.</p></div>}</section>}<section className="explore-section"><h2>Public discovery</h2><div className="now-grid"><button onClick={() => onNavigate('services')}><Wrench/><b>Services</b><small>Browse public local providers.</small></button><button onClick={() => onNavigate('marketplace')}><ShoppingBag/><b>Marketplace</b><small>Browse public local listings.</small></button><button onClick={() => onNavigate('alerts')}><Siren/><b>Alerts</b><small>Review public reports and their status.</small></button></div></section></div>
}

function ProfilePage({ userName, community, posts, onOnboard, onLogout }: { userName: string; community?: string; posts: Post[]; onOnboard: () => void; onLogout: () => void }) {
  const [editing, setEditing] = useState(false)
  return <div className="directory-page"><section className="profile-hero"><Avatar initials={userName.slice(0,2).toUpperCase()} tone="navy"/><div><p className="eyebrow">YOUR PROFILE</p><h1>{userName}</h1>{community ? <p><MapPin size={14}/>{community}</p> : <p>No community selected yet</p>}<span className="profile-status">Community profile setup pending verification</span></div><button className="login" onClick={() => setEditing(!editing)}>Settings</button></section>{editing && <section className="profile-settings card"><h2>Community settings</h2><p>Your selected area is visible; your exact address remains private.</p><button className="join" onClick={onOnboard}>Choose community</button><button className="link-button" onClick={onLogout}>Sign out</button></section>}<div className="profile-stats"><div><b>{posts.filter(post => post.name === userName).length}</b><span>Posts</span></div><div><b>0</b><span>Recommendations</span></div><div><b>0</b><span>Listings</span></div></div><section className="profile-section"><h2>Your activity</h2><p>Posts, recommendations and marketplace listings you share will appear here. Private contact and exact location information are never shown publicly.</p></section></div>
}

function CommunityProfile({ community, posts, onBack }: { community: string; posts: Post[]; onBack: () => void }) { return <div className="directory-page"><button className="back-button" onClick={onBack}>← Back to home</button><section className="community-hero"><span className="community-icon">{community.slice(0,2).toUpperCase()}</span><div><p className="eyebrow">COMMUNITY PROFILE</p><h1>{community}</h1><p>Neighbourhood updates, local help, and community-reported information.</p><small>Member count and community admins will appear once connected to live membership data.</small></div><button className="join">Joined</button></section><div className="community-tabs"><span>Posts ({posts.length})</span><span>Alerts (platform data)</span><span>Businesses</span><span>Marketplace</span></div><div className="community-posts">{posts.slice(0, 2).map(post => <PostCard key={post.id} post={post}/>)}</div></div> }

function AlertsPage({ community, setNotice }: { community: string; setNotice: (value: string) => void }) {
  const [alerts, setAlerts] = useState(starterAlerts)
  const [showReport, setShowReport] = useState(false)
  const [filter, setFilter] = useState<'Active' | 'All'>('Active')
  const [selectedAlert, setSelectedAlert] = useState<Alert | null>(null)
  const visible = filter === 'All' ? alerts : alerts.filter(alert => alert.status !== 'Resolved')
  const confirm = (id: number) => setAlerts(alerts.map(alert => alert.id === id ? { ...alert, confirmations: alert.confirmations + 1, status: alert.confirmations >= 4 && alert.status === 'Reported' ? 'Community Confirmed' : alert.status } : alert))
  const submit = (alert: Omit<Alert, 'id' | 'time' | 'status' | 'confirmations' | 'confidence' | 'sourceType'>) => { setAlerts([{ ...alert, id: Date.now(), time: 'Just now', status: 'Reported', confirmations: 1, confidence: 'Low', sourceType: 'Community report', requiresReview: /Crime|Fire|Missing/.test(alert.category) }, ...alerts]); setShowReport(false); setNotice('Your alert is published as a community report—not a verified fact.'); window.setTimeout(() => setNotice(''), 4500) }
  return <div className="directory-page">{selectedAlert ? <AlertDetail alert={selectedAlert} close={() => setSelectedAlert(null)}/> : <><div className="page-hero alert-hero"><div><p className="eyebrow">{community.toUpperCase()} COMMUNITY SAFETY</p><h1>Alerts near you</h1><p>Stay informed by neighbours. Reports are not verified facts unless their status says so.</p></div><button className="urgent-button" onClick={() => setShowReport(true)}><AlertTriangle size={18}/> Report an incident</button></div><div className="alert-guidance"><ShieldAlert size={19}/><div><b>For immediate danger, contact emergency services first.</b><span>Share an approximate area only. Never post an exact home address or personal information.</span></div></div><p className="intelligence-disclaimer">No external intelligence source is currently connected. Alerts shown here come from platform records once the database is connected.</p><div className="filter-line"><div><button className={filter === 'Active' ? 'chip active' : 'chip'} onClick={() => setFilter('Active')}>Active alerts</button><button className={filter === 'All' ? 'chip active' : 'chip'} onClick={() => setFilter('All')}>All reports</button></div><span>{visible.length} in {community}</span></div>{showReport && <AlertComposer close={() => setShowReport(false)} submit={submit}/>}<div className="alerts-list">{visible.map(alert => <AlertCard key={alert.id} alert={alert} onConfirm={() => confirm(alert.id)} onDetail={() => setSelectedAlert(alert)}/>)}</div>{visible.length === 0 && <div className="empty"><Siren/><h3>No traffic or safety reports around {community} right now</h3><p>Know what is happening nearby? Share a good-faith community report.</p></div>}</>}</div>
}

function AlertCard({ alert, onConfirm, onDetail }: { alert: Alert; onConfirm: () => void; onDetail: () => void }) {
  const [confirmed, setConfirmed] = useState(false); const [flagged, setFlagged] = useState(false); const [auditOpen, setAuditOpen] = useState(false)
  const icon = alert.category === 'Flooding' ? Droplets : alert.category === 'Road closure' ? Car : alert.category === 'Security' ? ShieldAlert : FlameKindling
  const Icon = icon
  return <article className="alert-card card"><div className="alert-card-top"><div className="alert-icon"><Icon size={20}/></div><div className="alert-main"><div className="alert-meta"><span>{alert.category}</span><span>•</span><span>{alert.time}</span><span>•</span><span>{alert.sourceType}</span></div><h2>{alert.title}</h2><p>{alert.description}</p></div></div>{alert.requiresReview && <div className="review-gate"><ShieldCheck size={14}/> High-risk report: held from broad alerts pending moderator or authoritative-source review.</div>}<div className="alert-location"><MapPin size={15}/>{alert.location}</div><div className="alert-footer"><div><span className={`status-pill ${alert.status.toLowerCase().replaceAll(' ', '-')}`}>{alert.status}</span><span className={`confidence ${alert.confidence.toLowerCase()}`}>{alert.confidence} confidence</span></div><button className={confirmed ? 'confirm-button confirmed' : 'confirm-button'} onClick={() => {if (!confirmed) onConfirm(); setConfirmed(!confirmed)}}><Users size={15}/>{confirmed ? 'Confirmed' : `Confirm (${alert.confirmations})`}</button></div><div className="alert-safety-actions"><button onClick={onDetail}><ChevronRight size={14}/> Details</button><button onClick={() => setAuditOpen(!auditOpen)}><Eye size={14}/> Alert history</button><button className={flagged ? 'flagged' : ''} onClick={() => setFlagged(true)}><Flag size={14}/>{flagged ? 'Flag submitted' : 'Report misinformation'}</button></div>{auditOpen && <div className="audit-trail"><b>Audit trail</b><span>{alert.time} · {alert.sourceType} received</span><span>{alert.confirmations} community confirmations recorded</span><span>Moderation state: {alert.requiresReview ? 'Review required before mass notification' : 'Standard review policy'}</span></div>}</article>
}

function AlertDetail({ alert, close }: { alert: Alert; close: () => void }) { return <div className="alert-detail"><button className="back-button" onClick={close}>← Back to alerts</button><section className="alert-detail-hero"><p className="eyebrow">{alert.sourceType.toUpperCase()}</p><h1>{alert.title}</h1><p>{alert.description}</p><div><span className={`status-pill ${alert.status.toLowerCase().replaceAll(' ', '-')}`}>{alert.status}</span><span className={`confidence ${alert.confidence.toLowerCase()}`}>{alert.confidence} confidence</span></div></section><div className="detail-grid"><section className="card detail-section"><h2>Approximate location</h2><div className="approximate-map"><MapPin size={25}/><span>{alert.location}</span><small>Map detail is intentionally approximate to protect neighbours’ privacy.</small></div><h2>Timeline</h2><ol className="alert-timeline"><li><b>{alert.time}</b><span>Incident reported as a {alert.sourceType.toLowerCase()}.</span></li><li><b>After report</b><span>{alert.confirmations} community confirmations recorded.</span></li><li><b>Current</b><span>Status is {alert.status}; confidence is {alert.confidence.toLowerCase()}.</span></li></ol></section><aside className="card detail-section"><h2>Sources & updates</h2><p><b>Source type:</b> {alert.sourceType}</p><p><b>Community confirmations:</b> {alert.confirmations}</p><p><b>Additional external sources:</b> None connected in this MVP.</p><button className="confirm-button"><Users size={15}/> I can confirm this</button><button className="detail-flag"><Flag size={14}/> This information is incorrect</button></aside></div><section className="card detail-section"><h2>Community comments</h2><p className="muted">Comments will load here when connected to the alert API. This demo does not invent resident updates.</p></section></div> }

function AlertComposer({ close, submit }: { close: () => void; submit: (alert: Omit<Alert, 'id' | 'time' | 'status' | 'confirmations' | 'confidence' | 'sourceType'>) => void }) {
  const [category, setCategory] = useState('Other urgent incident'); const [title, setTitle] = useState(''); const [description, setDescription] = useState(''); const [location, setLocation] = useState('')
  return <section className="alert-composer card"><div className="composer-head"><div><h2>Report a local incident</h2><p>Your report will begin with <b>Reported</b> status.</p></div><button onClick={close}><X/></button></div><div className="report-grid"><label>Category<select value={category} onChange={e => setCategory(e.target.value)}>{['Crime / security', 'Accident', 'Fire', 'Flooding', 'Missing person', 'Road closure', 'Dangerous area', 'Other urgent incident'].map(item => <option key={item}>{item}</option>)}</select></label><label>Approximate location<input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. near Iba or Alaba"/></label></div><label>Short title<input value={title} onChange={e => setTitle(e.target.value)} placeholder="What happened?"/></label><label>Description<textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Share only what you know. Avoid names, exact addresses and speculation."/></label><div className="composer-footer"><small>By posting, you confirm this is a good-faith community report.</small><button className="urgent-button" disabled={!title.trim() || !description.trim() || !location.trim()} onClick={() => submit({ category, title, description, location })}>Publish report</button></div></section>
}

function ServicesPage({ community, setNotice }: { community: string; setNotice: (value: string) => void }) {
  const [query, setQuery] = useState(''); const [serviceCategory, setServiceCategory] = useState('All services'); const [recommendations, setRecommendations] = useState<Record<number, boolean>>({})
  const allCategories = ['All services', 'Electricians', 'Plumbers', 'Mechanics', 'Cleaners', 'AC technicians', 'Carpenters', 'Security', 'Food', 'Hair / beauty', 'Tailors', 'Moving services']
  const results = services.filter(service => (serviceCategory === 'All services' || service.category.toLowerCase().includes(serviceCategory.replace('s', '').toLowerCase())) && `${service.name} ${service.category}`.toLowerCase().includes(query.toLowerCase()))
  const recommend = (id: number) => { setRecommendations({...recommendations, [id]: !recommendations[id]}); setNotice(recommendations[id] ? 'Recommendation removed.' : 'Thanks for strengthening a trusted local recommendation.'); window.setTimeout(() => setNotice(''), 3200) }
  return <div className="directory-page"><div className="page-hero services-hero"><div><p className="eyebrow">TRUSTED AROUND YOU</p><h1>Local services</h1><p>Find providers your neighbours have used around {community}.</p></div><div className="services-badge"><Users size={21}/><b>Community-led</b><span>Recommendations over ads</span></div></div><div className="service-search"><Search size={19}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search electricians, cleaners, tailors..."/><select value={serviceCategory} onChange={e => setServiceCategory(e.target.value)}>{allCategories.map(category => <option key={category}>{category}</option>)}</select></div><div className="recommendation-callout"><div className="rec-icon"><ThumbsUp size={20}/></div><div><b>Need a recommendation?</b><p>Ask your community who they’ve personally used—community trust matters more than a star rating.</p></div><button onClick={() => setNotice('Your recommendation request has been added to the community feed.')}>Ask neighbours</button></div><div className="directory-heading"><h2>Recommended in {community}</h2><span>{results.length} providers</span></div><div className="service-grid">{results.map(service => <article className="service-card card" key={service.id}><div className="service-cover"><span>{service.image}</span><span className="service-category">{service.category}</span></div><div className="service-content"><div className="service-name"><h3>{service.name}</h3>{service.verified && <span title="Verified provider"><BadgeCheck size={17}/></span>}</div><p>{service.description}</p><div className="service-details"><span><MapPin size={14}/>{service.area}</span><span><Phone size={14}/>{service.phone}</span></div><div className="service-actions"><button className={recommendations[service.id] ? 'recommend active-recommend' : 'recommend'} onClick={() => recommend(service.id)}><ThumbsUp size={15}/>{recommendations[service.id] ? 'Recommended' : 'Recommend'} <b>{service.recommendations + (recommendations[service.id] ? 1 : 0)}</b></button><button className="view-provider">View profile</button></div></div></article>)}</div>{results.length === 0 && <div className="empty"><Wrench/><h3>No providers found</h3><p>Try another service category or ask your neighbours.</p></div>}</div>
}

function MarketplacePage({ community, setNotice }: { community: string; setNotice: (value: string) => void }) {
  const [listings, setListings] = useState(starterListings); const [query, setQuery] = useState(''); const [category, setCategory] = useState('All categories'); const [showListing, setShowListing] = useState(false)
  const filtered = listings.filter(listing => (category === 'All categories' || listing.category === category) && `${listing.title} ${listing.description}`.toLowerCase().includes(query.toLowerCase()))
  const publish = (listing: Omit<Listing, 'id' | 'time' | 'status' | 'seller' | 'initials' | 'image'>) => { setListings([{...listing, id: Date.now(), time: 'Just now', status: 'Available', seller: 'You', initials: 'YO', image: '📦'}, ...listings]); setShowListing(false); setNotice('Your local listing is live. Your exact address is not shown.'); window.setTimeout(() => setNotice(''), 3500) }
  return <div className="directory-page"><div className="page-hero marketplace-hero"><div><p className="eyebrow">BUY & SELL CLOSE TO HOME</p><h1>Marketplace</h1><p>Find useful things from neighbours around {community}.</p></div><button className="create-button" onClick={() => setShowListing(true)}><Plus size={18}/> Create listing</button></div><div className="marketplace-note"><ShieldAlert size={18}/><span><b>Keep it local and safe.</b> Arrange exchanges in public places and use in-app messaging before sharing phone numbers.</span></div><div className="service-search marketplace-search"><Search size={19}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder="Search local listings"/><select value={category} onChange={e => setCategory(e.target.value)}>{['All categories', 'Electronics', 'Cars', 'Phones', 'Furniture', 'Clothing', 'Food', 'Services', 'Other'].map(item => <option key={item}>{item}</option>)}</select></div>{showListing && <ListingComposer close={() => setShowListing(false)} publish={publish}/>}<div className="directory-heading"><h2>Nearby listings</h2><span>{filtered.length} available near you</span></div><div className="listing-grid">{filtered.map(listing => <ListingCard key={listing.id} listing={listing} setNotice={setNotice}/>)}</div>{filtered.length === 0 && <div className="empty"><Package/><h3>No listings found</h3><p>Try another category or create a local listing.</p></div>}</div>
}

function ListingCard({ listing, setNotice }: { listing: Listing; setNotice: (notice: string) => void }) {
  const [saved, setSaved] = useState(false)
  return <article className="listing-card card"><div className="listing-image"><span>{listing.image}</span><span className={`listing-status ${listing.status.toLowerCase()}`}>{listing.status}</span><button className={saved ? 'listing-save saved' : 'listing-save'} onClick={() => setSaved(!saved)} aria-label="Save listing"><Bookmark size={16} fill={saved ? 'currentColor' : 'none'}/></button></div><div className="listing-content"><p className="listing-category">{listing.category}</p><h3>{listing.title}</h3><h2>{listing.price}</h2><p>{listing.description}</p><div className="listing-location"><MapPin size={13}/>{listing.location} · {listing.time}</div><div className="seller-row"><Avatar initials={listing.initials} tone="navy"/><span><b>{listing.seller}</b><small>Neighbour seller</small></span><button onClick={() => setNotice('Messaging will be available once secure account messaging is connected.') }><MessageSquare size={15}/> Message</button></div></div></article>
}

function ListingComposer({ close, publish }: { close: () => void; publish: (listing: Omit<Listing, 'id' | 'time' | 'status' | 'seller' | 'initials' | 'image'>) => void }) {
  const [title, setTitle] = useState(''); const [description, setDescription] = useState(''); const [price, setPrice] = useState(''); const [category, setCategory] = useState('Other'); const [location, setLocation] = useState('')
  return <section className="alert-composer card listing-composer"><div className="composer-head"><div><h2>Create a local listing</h2><p>Use an approximate pickup area—never your home address.</p></div><button onClick={close}><X/></button></div><div className="report-grid"><label>Listing title<input value={title} onChange={e => setTitle(e.target.value)} placeholder="e.g. iPhone 13, 128GB"/></label><label>Price<input value={price} onChange={e => setPrice(e.target.value)} placeholder="e.g. ₦250,000"/></label><label>Category<select value={category} onChange={e => setCategory(e.target.value)}>{['Electronics', 'Cars', 'Phones', 'Furniture', 'Clothing', 'Food', 'Services', 'Other'].map(item => <option key={item}>{item}</option>)}</select></label><label>Approximate location<input value={location} onChange={e => setLocation(e.target.value)} placeholder="e.g. your community or nearby landmark"/></label></div><label>Description<textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Condition, features, and any useful details"/></label><div className="composer-footer"><small>Image uploads are prepared for the connected storage service.</small><button className="create-button" disabled={!title || !description || !price || !location} onClick={() => publish({title, description, price, category, location})}>Publish listing</button></div></section>
}

function NotificationsPage() {
  const [items, setItems] = useState(notifications); const [preferencesOpen, setPreferencesOpen] = useState(false)
  return <div className="directory-page"><div className="page-hero notifications-hero"><div><p className="eyebrow">YOUR UPDATES</p><h1>Notifications</h1><p>Comments, community updates, local activity and safety alerts in one place.</p></div><button className="login" onClick={() => setPreferencesOpen(!preferencesOpen)}>Notification settings</button></div>{preferencesOpen && <section className="preferences card"><h3>Notification preferences</h3><p>Security notices remain enabled for account safety. Push delivery is prepared but not yet connected.</p>{['Replies and comments', 'Mentions', 'Local alerts', 'Event reminders', 'Community updates', 'Product updates'].map((item, index) => <label key={item}><input type="checkbox" defaultChecked={index !== 5}/>{item}<span>Enabled</span></label>)}</section>}<div className="notification-actions"><h2>Recent</h2><button onClick={() => setItems(items.map(item => ({...item, unread: false})))}>Mark all as read</button></div>{items.length === 0 ? <div className="empty"><Bell/><h3>You’re all caught up</h3><p>New replies, local updates and account notices will appear here.</p></div> : <div className="notifications-list">{items.map(item => <article className={item.unread ? 'notification card unread' : 'notification card'} onClick={() => setItems(items.map(current => current.id === item.id ? {...current, unread: false} : current))} key={item.id}><div className={`notification-icon ${item.type.toLowerCase().replaceAll(' ', '-')}`}>{item.type === 'Safety alert' ? <Siren size={18}/> : item.type === 'Marketplace' ? <ShoppingBag size={18}/> : item.type === 'Comment' ? <MessageCircle size={18}/> : item.type === 'Recommendation' ? <ThumbsUp size={18}/> : <Bell size={18}/>}</div><div><h3>{item.title}</h3><p>{item.detail}</p><span>{item.time}</span></div>{item.unread && <i/>}</article>)}</div>}</div>
}

function AdminDashboard({ setNotice }: { setNotice: (value: string) => void }) {
  const [section, setSection] = useState('Overview'); const [reviewed, setReviewed] = useState<Record<string, boolean>>({})
  const rows = section === 'Intelligence review' ? [['No external events are currently ingested', 'Source adapters disabled', 'Awaiting configuration']] : [['No live community records yet', 'Connect the database-backed API', 'Awaiting launch']]
  return <div className="admin-page"><div className="admin-hero"><div><p className="eyebrow">MODERATION WORKSPACE</p><h1>Around Me Admin</h1><p>Review community health without overstating what reports prove.</p></div><span><ShieldCheck size={18}/> Admin access</span></div><div className="admin-stats"><Stat icon={<Users/>} value="—" label="Live users" change="Backend required"/><Stat icon={<Building2/>} value="—" label="Live communities" change="Backend required"/><Stat icon={<Siren/>} value="—" label="Open alerts" change="No live source" warn/><Stat icon={<Flag/>} value="—" label="Content reports" change="No live source" warn/></div><div className="admin-layout"><aside className="admin-nav">{['Overview', 'Users', 'Communities', 'Posts', 'Reports', 'Alerts', 'Intelligence review', 'Businesses', 'Marketplace listings', 'Reported content', 'Verification requests', 'Analytics'].map(item => <button key={item} className={section === item ? 'active' : ''} onClick={() => setSection(item)}>{item}</button>)}</aside><section className="admin-content card"><div className="admin-content-head"><div><h2>{section}</h2><p>{section === 'Overview' ? 'Preview workspace; live operations need the backend API.' : 'Review, moderate and audit actions in this area.'}</p></div><button className="login" onClick={() => setNotice('Export is available when the backend reporting service is connected.')}>Export</button></div>{section === 'Overview' ? <AdminOverview setSection={setSection}/> : <div className="admin-table"><div className="admin-table-head"><span>Item</span><span>Context</span><span>Status</span><span>Action</span></div>{rows.map((row, index) => <div className="admin-row" key={row[0]}><span><b>{row[0]}</b><small>Preview record {index + 1}</small></span><span>{row[1]}</span><span><i className={row[2].includes('review') || row[2].includes('pending') || row[2].includes('Awaiting') ? 'needs-review' : ''}>{row[2]}</i></span><span>{reviewed[row[0]] ? <em>Reviewed</em> : <button onClick={() => {setReviewed({...reviewed, [row[0]]: true});setNotice(`${row[0]} marked reviewed in preview. Server audit storage is required for real actions.`)}}>Review <ChevronRight size={14}/></button>}</span></div>)}</div>}<div className="moderation-footer"><FileWarning size={16}/><span><b>Moderation hook:</b> removals, suspensions, verification and alert-resolution actions should create immutable audit events before changing public state.</span></div></section></div></div>
}

function AdminOverview({ setSection }: { setSection: (value: string) => void }) { return <><div className="review-queue"><div><h3>Priority review queue</h3><p>High-risk reports stay here until they have additional evidence or a moderator decision.</p></div><button className="urgent-button" onClick={() => setSection('Alerts')}>Review 2 alerts</button></div><div className="overview-grid"><article><BarChart3/><b>84%</b><span>Reports reviewed within 24 hours</span></article><article><ShieldCheck/><b>96%</b><span>Neighbour confirmations in good standing</span></article><article><BadgeCheck/><b>7</b><span>Business verification requests</span></article></div></> }
function Stat({ icon, value, label, change, warn }: { icon: ReactNode; value: string; label: string; change: string; warn?: boolean }) { return <article className={warn ? 'admin-stat warn' : 'admin-stat'}><div>{icon}</div><span><b>{value}</b><small>{label}</small></span><em>{change}</em></article> }

function PostCard({ post, currentUser }: { post: Post; currentUser?: CurrentUser | null }) {
  const [liked, setLiked] = useState(false); const [saved, setSaved] = useState(false); const [comments, setComments] = useState(post.comments); const [comment, setComment] = useState(''); const [reported, setReported] = useState(false)
  const meta = categories.find(c => c.name === post.category)!
  const Icon = meta.icon
  return <article className="post card"><div className="post-header"><Avatar initials={post.initials} tone={post.tone}/><div><div className="post-author">{post.name} {post.verified && <CheckCircle2 size={15} fill="currentColor"/>}</div><p>{post.time} · <MapPin size={13}/> {post.location ?? 'Community'}</p></div><button className="more" onClick={() => setReported(!reported)} title="Report post"><MoreHorizontal size={20}/></button></div>{reported && <div className="report-box">Thanks—we’ve sent this post for review.</div>}<div className={`post-tag ${meta.color}`}><Icon size={14}/>{post.category}</div><p className="post-copy">{post.text}</p>{post.image && <img className="post-image" src={post.image} alt="Post attachment"/>}<div className="post-counts"><span>{liked ? post.reactions + 1 : post.reactions} reactions</span><span>{comments} comments</span></div><div className="post-actions"><button className={liked ? 'reacted' : ''} onClick={() => setLiked(!liked)}><Heart size={18} fill={liked ? 'currentColor' : 'none'}/> {liked ? 'Loved' : 'React'}</button><button onClick={() => document.getElementById(`comment-${post.id}`)?.focus()}><MessageCircle size={18}/> Comment</button><button className={saved ? 'reacted' : ''} onClick={() => setSaved(!saved)}><Bookmark size={18} fill={saved ? 'currentColor' : 'none'}/> {saved ? 'Saved' : 'Save'}</button></div>{currentUser && <form className="comment-box" onSubmit={e => {e.preventDefault();if(comment.trim()){setComments(comments+1);setComment('')}}}><Avatar initials={currentUser.name.slice(0, 2).toUpperCase()} tone="navy"/><input id={`comment-${post.id}`} value={comment} onChange={e => setComment(e.target.value)} placeholder="Write a comment..."/><button aria-label="Send comment"><Send size={16}/></button></form>}</article>
}

function Composer({ community, onClose, onPublish }: { community: string; onClose: () => void; onPublish: (text: string, category: Category) => void }) {
  const [text, setText] = useState(''); const [category, setCategory] = useState<Category>('General'); const [location, setLocation] = useState<string>(community)
  const urgent = category === 'Safety' || category === 'Traffic' || category === 'Emergency'
  return <section className="composer card"><div className="composer-head"><div><h2>Create a community post</h2><p>Share an approximate area only—your exact address will never be shown.</p></div><button onClick={onClose}><X/></button></div><div className="post-type-grid">{categories.filter(item => !['Services', 'Jobs'].includes(item.name)).map(item => <button key={item.name} className={category === item.name ? 'active' : ''} onClick={() => setCategory(item.name)}>{item.name}</button>)}</div>{urgent && <div className="post-safety-note"><ShieldAlert size={15}/><span>Urgent posts are community-submitted reports, not verified facts. Use the dedicated Alerts flow for incidents.</span></div>}<textarea autoFocus value={text} onChange={e => setText(e.target.value)} placeholder={category === 'Question' ? 'What would you like to ask your neighbours?' : 'What would you like to share with your neighbours?'}/><div className="composer-options"><label><MapPin size={15}/><input value={location} onChange={e => setLocation(e.target.value)} aria-label="Approximate location"/></label><span><Image size={15}/> Image upload connects to secure storage</span></div><div className="composer-footer"><select value={category} onChange={e => setCategory(e.target.value as Category)} aria-label="Post category">{categories.map(c => <option key={c.name}>{c.name}</option>)}</select><button className="join" disabled={!text.trim()} onClick={() => onPublish(`${text}${location ? `\n\nApproximate area: ${location}` : ''}`, category)}>Post to community</button></div></section>
}

function AuthModal({ mode, deepLink, close, onModeChange, onAuthenticated }: { mode: 'sign in' | 'join'; deepLink?: { type: 'verify' | 'reset'; token: string }; close: () => void; onModeChange: (mode: 'sign in' | 'join') => void; onAuthenticated: () => Promise<void> }) {
  const [step, setStep] = useState<'form' | 'check-email' | 'forgot' | 'reset' | 'verified' | 'error'>(deepLink?.type === 'reset' ? 'reset' : 'form')
  const [name, setName] = useState(''); const [email, setEmail] = useState(''); const [password, setPassword] = useState(''); const [message, setMessage] = useState(''); const [busy, setBusy] = useState(false)
  useEffect(() => { if (deepLink?.type === 'verify') { setBusy(true); authRequest(`/auth/verify-email?token=${encodeURIComponent(deepLink.token)}`).then(result => { setMessage(result.message ?? 'Your email has been verified.'); setStep('verified') }).catch(error => { setMessage(error.message); setStep('error') }).finally(() => setBusy(false)) } }, [deepLink])
  const submit = async () => { setBusy(true); setMessage(''); try {
    if (step === 'forgot') { const result = await authRequest('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }); setMessage(result.message ?? 'Check your email.'); setStep('check-email') }
    else if (step === 'reset' && deepLink) { const result = await authRequest('/auth/reset-password', { method: 'POST', body: JSON.stringify({ token: deepLink.token, password }) }); setMessage(result.message ?? 'Your password has been reset.'); setStep('verified') }
    else if (mode === 'join') { const result = await authRequest('/auth/register', { method: 'POST', body: JSON.stringify({ displayName: name, email, password }) }); setMessage(result.message ?? 'Check your email to verify your account.'); setStep('check-email') }
    else { const result = await authRequest('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }); setMessage(result.message ?? 'Signed in.'); if (result.emailVerified) await onAuthenticated(); else setStep('check-email') }
  } catch (error) { setMessage(error instanceof Error ? error.message : 'We could not complete that request.'); setStep('error') } finally { setBusy(false) } }
  const resend = async () => { setBusy(true); try { const result = await authRequest('/auth/resend-verification', { method: 'POST', body: JSON.stringify({ email }) }); setMessage(result.message ?? 'Check your email.') } catch (error) { setMessage(error instanceof Error ? error.message : 'We could not send another email.') } finally { setBusy(false) } }
  const title = step === 'forgot' ? 'Reset your password' : step === 'reset' ? 'Choose a new password' : step === 'check-email' ? 'Check your inbox' : step === 'verified' ? 'You’re all set' : step === 'error' ? 'We need your attention' : mode === 'join' ? 'Join your neighbourhood' : 'Welcome back'
  return <div className="modal-backdrop" role="dialog" aria-modal="true"><section className="auth-modal"><button className="modal-close" onClick={close}><X/></button><a className="brand"><span className="brand-mark"><MapPin size={20}/></span>Around<span>Me</span></a><h2>{title}</h2>{busy && step === 'form' && <p>Working securely…</p>}{step === 'check-email' ? <><p>{message || 'We sent you an email. Follow the link to continue.'}</p><button className="join wide" disabled={!email || busy} onClick={resend}>Resend verification email</button><button className="link-button" onClick={close}>Close</button></> : step === 'forgot' ? <><p>Enter your email and we’ll send a reset link if an account exists.</p><input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address"/><button className="join wide" disabled={!email || busy} onClick={submit}>Send reset link</button><button className="link-button" onClick={() => setStep('form')}>Back to sign in</button></> : step === 'reset' ? <><p>Choose a new password with at least 12 characters.</p><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="New password"/><button className="join wide" disabled={password.length < 12 || busy} onClick={submit}>Reset password</button></> : step === 'verified' || step === 'error' ? <><p>{message}</p><button className="join wide" onClick={step === 'verified' ? close : () => setStep('form')}>{step === 'verified' ? 'Continue' : 'Try again'}</button></> : <><p>{mode === 'join' ? 'Create your account, then verify your email before joining community conversations.' : 'Sign in to continue to Around Me.'}</p>{mode === 'join' && <input value={name} onChange={e => setName(e.target.value)} placeholder="Your full name"/>}<input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="Email address"/><input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Password"/>{mode === 'join' && <label className="privacy-check"><input type="checkbox"/> I agree to the Community Guidelines</label>}<button className="join wide" disabled={busy || !email || password.length < 12 || (mode === 'join' && name.trim().length < 2)} onClick={submit}>{mode === 'join' ? 'Create account' : 'Sign in'}</button>{mode === 'sign in' && <button className="link-button" onClick={() => setStep('forgot')}>Forgot password?</button>}<p className="auth-switch">{mode === 'join' ? 'Already have an account?' : 'New to Around Me?'} <button onClick={() => { onModeChange(mode === 'join' ? 'sign in' : 'join'); setStep('form'); setMessage('') }}>{mode === 'join' ? 'Sign in' : 'Join now'}</button></p></>}</section></div>
}

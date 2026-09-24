import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { MapCenter } from '../config/geography'
import { mapboxAccessToken } from './config'

export type PublicMapMarker = { id: string; label: string; coordinates: MapCenter; kind: 'community' | 'business' | 'service' | 'marketplace' | 'event' | 'traffic' | 'flood' | 'infrastructure' | 'alert' }
const markerColours: Record<PublicMapMarker['kind'], string> = { community: '#176e50', business: '#8763a7', service: '#d78748', marketplace: '#e96e3f', event: '#277b82', traffic: '#f3a22d', flood: '#3d73a1', infrastructure: '#6f7c73', alert: '#c94f48' }

export function MapView({ accessToken = mapboxAccessToken, center, zoom, selected, markers = [], onSelect, onMarkerSelect }: { accessToken?: string; center: MapCenter; zoom: number; selected?: { latitude: number; longitude: number }; markers?: PublicMapMarker[]; onSelect?: (coordinates: { latitude: number; longitude: number }) => void; onMarkerSelect?: (marker: PublicMapMarker) => void }) {
  const container = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!container.current || !accessToken) return
    const map = new mapboxgl.Map({ container: container.current, accessToken, center: [...center], zoom })
    map.addControl(new mapboxgl.NavigationControl(), 'top-right')
    if (selected) new mapboxgl.Marker().setLngLat([selected.longitude, selected.latitude]).addTo(map)
    for (const marker of markers) {
      const item = new mapboxgl.Marker({ color: markerColours[marker.kind] }).setLngLat([...marker.coordinates]).setPopup(new mapboxgl.Popup({ offset: 16 }).setText(marker.label)).addTo(map)
      if (onMarkerSelect) item.getElement().addEventListener('click', () => onMarkerSelect(marker))
    }
    if (onSelect) map.on('click', event => onSelect({ latitude: event.lngLat.lat, longitude: event.lngLat.lng }))
    return () => map.remove()
  }, [accessToken, center, zoom, selected?.latitude, selected?.longitude, markers, onSelect, onMarkerSelect])
  return <div ref={container} aria-label="Map location selector" style={{ minHeight: 280, width: '100%' }} />
}

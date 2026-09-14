import type { IntelligenceCategory, NigerianLocation } from '../types'

export type MapCategory = IntelligenceCategory | 'marketplace' | 'event'
export type MapTimeRange = 'last_hour' | 'today' | 'last_24_hours' | 'this_week'
export interface MapBounds { west: number; south: number; east: number; north: number }
export interface MapQuery { bounds: MapBounds; categories: MapCategory[]; timeRange: MapTimeRange; limit: number; cursor?: string }
export interface PublicMapMarker { id: string; category: MapCategory; title: string; approximateLocation: NigerianLocation; occurredAt: Date; sourceType: 'community_report' | 'external_source' | 'official_source'; confidence: 'low' | 'medium' | 'high' | 'verified'; clusterKey?: string }
export interface MapResult { markers: PublicMapMarker[]; nextCursor?: string }
export interface MapEventRepository { findVisibleEvents(query: MapQuery): Promise<MapResult> }
/** Public map data must be created from fuzzed / approved public locations only. */

import type { NigerianLocation, SourceMetadata } from '../types'

export type TrafficIncidentKind = 'accident' | 'heavy_traffic' | 'road_closure' | 'road_damage' | 'broken_down_vehicle' | 'construction' | 'flooded_road' | 'other_obstruction'
export interface TrafficIncident { kind: TrafficIncidentKind; location: NigerianLocation; direction?: string; severity: 'low' | 'medium' | 'high'; observedAt: Date; expiresAt: Date; externalConfirmations: number }
export interface TrafficProvider { metadata(): SourceMetadata; fetchTraffic(bounds?: { west: number; south: number; east: number; north: number }): Promise<TrafficIncident[]> }

export type WeatherCondition = 'heavy_rainfall' | 'thunderstorm' | 'extreme_heat' | 'high_winds' | 'severe_warning' | 'flood_risk'
export interface WeatherObservation { condition: WeatherCondition; location: NigerianLocation; observedAt: Date; expiresAt: Date; severity: 'low' | 'medium' | 'high'; sourceUrl: string }
export interface WeatherProvider { metadata(): SourceMetadata; fetchWeather(location: NigerianLocation): Promise<WeatherObservation[]> }

export type PowerReportKind = 'outage' | 'restored' | 'transformer_fault' | 'low_voltage' | 'electrical_hazard'
export interface PowerReport { kind: PowerReportKind; communityId: string; distributionCompany?: string; feeder?: string; transformerLabel?: string; observedAt: Date; sourceType: 'community_report' | 'official_source' }
export interface ElectricityProvider { metadata(): SourceMetadata; fetchAnnouncements(serviceArea: string): Promise<PowerReport[]> }

export interface EmergencyFacility { id: string; name: string; type: 'hospital' | 'police_station' | 'fire_station' | 'emergency_management' | 'pharmacy' | 'ambulance'; publicLocation: NigerianLocation; phone?: string; sourceUrl?: string; verifiedAt?: Date }
export interface EmergencyDirectoryProvider { metadata(): SourceMetadata; findNearby(location: NigerianLocation, radiusKm: number): Promise<EmergencyFacility[]> }

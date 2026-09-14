import { useEffect, useRef } from 'react'
import mapboxgl from 'mapbox-gl'
import 'mapbox-gl/dist/mapbox-gl.css'
import type { MapCenter } from '../config/geography'
import { mapboxAccessToken } from './config'

export function MapView({ accessToken = mapboxAccessToken, center, zoom, selected, onSelect }: { accessToken?: string; center: MapCenter; zoom: number; selected?: { latitude: number; longitude: number }; onSelect?: (coordinates: { latitude: number; longitude: number }) => void }) {
  const container = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!container.current || !accessToken) return
    const map = new mapboxgl.Map({ container: container.current, accessToken, center: [...center], zoom })
    map.addControl(new mapboxgl.NavigationControl(), 'top-right')
    if (selected) new mapboxgl.Marker().setLngLat([selected.longitude, selected.latitude]).addTo(map)
    if (onSelect) map.on('click', event => onSelect({ latitude: event.lngLat.lat, longitude: event.lngLat.lng }))
    return () => map.remove()
  }, [accessToken, center, zoom, selected?.latitude, selected?.longitude, onSelect])
  return <div ref={container} aria-label="Map location selector" style={{ minHeight: 280, width: '100%' }} />
}

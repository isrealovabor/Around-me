/** Vite exposes this public Mapbox token to map-rendering code only. Restrict it by allowed origins in Mapbox. */
export const mapboxAccessToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN as string | undefined

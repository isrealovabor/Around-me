export type RealtimeTopic = `community:${string}` | `alert:${string}` | `map:${string}`
export interface RealtimeEvent<T = unknown> { topic: RealtimeTopic; type: 'alert.created' | 'alert.updated' | 'map.updated' | 'power.updated'; payload: T; occurredAt: Date }
export interface RealtimePublisher { publish<T>(event: RealtimeEvent<T>): Promise<void> }
export interface RealtimeSubscription { close(): Promise<void> }
export interface RealtimeSubscriber { subscribe<T>(topic: RealtimeTopic, onEvent: (event: RealtimeEvent<T>) => void): Promise<RealtimeSubscription> }
/** Implement with WebSockets, SSE, or a managed realtime provider in the backend—not from React components. */

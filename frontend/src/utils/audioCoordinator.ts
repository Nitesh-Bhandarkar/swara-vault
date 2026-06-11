type StopFn = () => void

let activeStop: StopFn | null = null

/** Call when a player starts playback. Stops any other currently playing player. */
export function acquirePlayback(stop: StopFn): void {
  if (activeStop && activeStop !== stop) activeStop()
  activeStop = stop
}

/** Call when a player is explicitly paused or unmounted so the slot is freed. */
export function releasePlayback(stop: StopFn): void {
  if (activeStop === stop) activeStop = null
}

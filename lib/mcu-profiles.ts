export const PROFILE_STORAGE_KEY = 'multiverse-rewatch:profiles:v1'
export const LEGACY_WATCHED_STORAGE_KEY = 'multiverse-rewatch:watched:v1'
export const MAX_PROFILES = 5
export const DEFAULT_PROFILE_NAME = 'Binge Watcher'
export const MAX_PROFILE_NAME_LENGTH = 24

export const PROFILE_AVATARS = [
  { id: 'axiom', src: '/assets/profiles/avatar-axiom.jpg', label: 'Axiom' },
  { id: 'emberveil', src: '/assets/profiles/avatar-emberveil.jpg', label: 'Emberveil' },
  { id: 'nightcoil', src: '/assets/profiles/avatar-nightcoil.jpg', label: 'Nightcoil' },
  { id: 'aetherlock', src: '/assets/profiles/avatar-aetherlock.jpg', label: 'Aetherlock' },
  { id: 'stormforge', src: '/assets/profiles/avatar-stormforge.jpg', label: 'Stormforge' },
] as const

export type ProfileAvatarId = (typeof PROFILE_AVATARS)[number]['id']

export type WatchProfile = {
  id: string
  name: string
  avatarId: ProfileAvatarId
  watchedIds: string[]
}

export type ProfileStore = {
  activeProfileId: string
  profiles: WatchProfile[]
}

export function createDefaultStore(watchedIds: string[] = []): ProfileStore {
  return {
    activeProfileId: 'watcher-prime',
    profiles: [
      {
        id: 'watcher-prime',
        name: DEFAULT_PROFILE_NAME,
        avatarId: 'axiom',
        watchedIds,
      },
    ],
  }
}

export function isAvatarId(value: unknown): value is ProfileAvatarId {
  return PROFILE_AVATARS.some((avatar) => avatar.id === value)
}

export function getAvatar(avatarId: ProfileAvatarId) {
  return PROFILE_AVATARS.find((avatar) => avatar.id === avatarId) ?? PROFILE_AVATARS[0]
}

export function createProfileId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `profile-${Date.now()}`
}

export function nextAvailableAvatar(profiles: WatchProfile[]): ProfileAvatarId {
  const used = new Set(profiles.map((profile) => profile.avatarId))
  return PROFILE_AVATARS.find((avatar) => !used.has(avatar.id))?.id ?? PROFILE_AVATARS[0].id
}

function parseProfile(value: unknown): WatchProfile | null {
  if (!value || typeof value !== 'object') return null

  const profile = value as Record<string, unknown>
  if (typeof profile.id !== 'string' || !profile.id) return null
  if (typeof profile.name !== 'string') return null

  const name = profile.name.trim().slice(0, MAX_PROFILE_NAME_LENGTH)
  if (!name || !isAvatarId(profile.avatarId) || !Array.isArray(profile.watchedIds)) return null

  return {
    id: profile.id,
    name,
    avatarId: profile.avatarId,
    watchedIds: profile.watchedIds.filter((id): id is string => typeof id === 'string'),
  }
}

function readLegacyWatchedIds() {
  if (typeof window === 'undefined') return [] as string[]

  try {
    const savedProgress = window.localStorage.getItem(LEGACY_WATCHED_STORAGE_KEY)
    if (!savedProgress) return [] as string[]
    const parsedProgress: unknown = JSON.parse(savedProgress)
    if (!Array.isArray(parsedProgress)) return []
    return parsedProgress.filter((id): id is string => typeof id === 'string')
  } catch {
    return [] as string[]
  }
}

const profileListeners = new Set<() => void>()
let cachedClientStore: ProfileStore | null = null
const serverProfileSnapshot = createDefaultStore()

function emitProfileStore() {
  profileListeners.forEach((listener) => listener())
}

export function subscribeProfileStore(onStoreChange: () => void) {
  if (typeof window === 'undefined') return () => {}

  profileListeners.add(onStoreChange)
  const onStorage = (event: StorageEvent) => {
    if (event.key !== PROFILE_STORAGE_KEY && event.key !== LEGACY_WATCHED_STORAGE_KEY) return
    cachedClientStore = null
    emitProfileStore()
  }
  window.addEventListener('storage', onStorage)
  const frame = window.requestAnimationFrame(() => {
    cachedClientStore = readProfileStore()
    onStoreChange()
  })
  return () => {
    window.cancelAnimationFrame(frame)
    profileListeners.delete(onStoreChange)
    window.removeEventListener('storage', onStorage)
  }
}

export function hydrateProfileStoreFromStorage() {
  if (typeof window === 'undefined') return
  cachedClientStore = readProfileStore()
  emitProfileStore()
}

export function getClientProfileSnapshot() {
  if (typeof window === 'undefined') return serverProfileSnapshot
  if (!cachedClientStore) {
    cachedClientStore = readProfileStore()
    try {
      if (!window.localStorage.getItem(PROFILE_STORAGE_KEY)) {
        window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(cachedClientStore))
      }
    } catch {
      // Keep this interaction usable when browser storage is unavailable.
    }
  }
  return cachedClientStore
}

export function getServerProfileSnapshot() {
  return serverProfileSnapshot
}

export function readProfileStore(): ProfileStore {
  if (typeof window === 'undefined') return createDefaultStore()

  try {
    const raw = window.localStorage.getItem(PROFILE_STORAGE_KEY)
    if (raw) {
      const parsed: unknown = JSON.parse(raw)
      if (parsed && typeof parsed === 'object') {
        const data = parsed as Record<string, unknown>
        if (Array.isArray(data.profiles)) {
          const profiles = data.profiles
            .map(parseProfile)
            .filter((profile): profile is WatchProfile => profile !== null)
            .slice(0, MAX_PROFILES)

          if (profiles.length) {
            const activeProfileId = typeof data.activeProfileId === 'string'
              && profiles.some((profile) => profile.id === data.activeProfileId)
              ? data.activeProfileId
              : profiles[0].id

            return { activeProfileId, profiles }
          }
        }
      }
    }
  } catch {
    // Fall through to a migrated default store.
  }

  return createDefaultStore(readLegacyWatchedIds())
}

export function writeProfileStore(store: ProfileStore) {
  cachedClientStore = store
  try {
    window.localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(store))
  } catch {
    // Keep this interaction usable when browser storage is unavailable.
  }
  emitProfileStore()
}

export function getActiveProfile(store: ProfileStore) {
  return store.profiles.find((profile) => profile.id === store.activeProfileId) ?? store.profiles[0]
}

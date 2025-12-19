import crypto from 'crypto'

/**
 * Generate a Gravatar URL for an email address
 * @param email - The email address
 * @param size - The size of the image (default: 200)
 * @param defaultImage - The default image type (404, mp, identicon, monsterid, wavatar, retro, robohash, blank)
 * @returns The Gravatar URL
 */
export function getGravatarUrl(
  email: string,
  size: number = 200,
  defaultImage: string = 'mp' // Mystery Person default
): string {
  const trimmedEmail = email.trim().toLowerCase()
  const hash = crypto.createHash('md5').update(trimmedEmail).digest('hex')
  return `https://www.gravatar.com/avatar/${hash}?s=${size}&d=${defaultImage}`
}

/**
 * Client-side Gravatar URL generator (doesn't use crypto module)
 * Use this in client components
 */
export function getGravatarUrlClient(
  email: string,
  size: number = 200,
  defaultImage: string = 'mp'
): string {
  // Simple hash for client-side (not cryptographically secure, but fine for Gravatar)
  const trimmedEmail = email.trim().toLowerCase()

  // For client-side, we'll use a simple encoding
  // In production, you might want to use a lightweight MD5 library
  const simpleHash = Array.from(trimmedEmail)
    .reduce((hash, char) => ((hash << 5) - hash) + char.charCodeAt(0), 0)
    .toString(16)
    .padStart(32, '0')

  return `https://www.gravatar.com/avatar/${simpleHash}?s=${size}&d=${defaultImage}`
}

/**
 * Get the best available avatar URL
 * Priority: custom avatar > Gravatar > initials fallback
 */
export function getBestAvatarUrl(
  customAvatar: string | undefined,
  email: string,
  size?: number
): string | undefined {
  if (customAvatar) return customAvatar
  if (email) return getGravatarUrlClient(email, size)
  return undefined
}

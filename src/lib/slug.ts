/**
 * Generate a URL-friendly slug from a signal title + UUID.
 * Format: descriptive-slug-text-{uuid}
 * Example: raytheon-418m-faa-radar-contract-0d37bc7c-afce-421a-b778-22f154a9fb45
 * 
 * The UUID is always the last 36 characters, making it easy to extract for DB lookup.
 */
export function generateSignalSlug(title: string, id: string): string {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '') // remove special chars
    .replace(/\s+/g, '-')          // spaces → hyphens
    .replace(/-+/g, '-')           // collapse multiple hyphens
    .replace(/^-|-$/g, '')         // trim leading/trailing hyphens
    .slice(0, 80)                  // cap length
    .replace(/-$/g, '')            // clean trailing hyphen after slice

  return `${slug}-${id}`
}

/**
 * Extract the UUID from a slug.
 * UUIDs are always 36 chars: xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx
 */
export function extractIdFromSlug(slug: string): string {
  // If the slug IS a UUID (old format links), return as-is
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i
  if (uuidRegex.test(slug)) return slug

  // Otherwise extract the last 36 chars (the UUID portion)
  if (slug.length > 36) {
    const possibleId = slug.slice(-36)
    if (uuidRegex.test(possibleId)) return possibleId
  }

  // Fallback: return the whole slug (let the DB query fail gracefully)
  return slug
}

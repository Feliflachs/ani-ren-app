// Catalog assets use backend-relative paths so changing host does not rewrite the DB.
export function mediaUrl(url: string): string {
  if (!url.startsWith('/')) return url;
  const base = process.env.EXPO_PUBLIC_API_URL;
  return base ? new URL(url, base).toString() : url;
}

import { supabase } from '@/integrations/supabase/client';

/**
 * Extract the storage path from a full public URL or return as-is if already a path.
 */
export function extractStoragePath(urlOrPath: string, bucket: string): string {
  if (urlOrPath.startsWith('http')) {
    const marker = `/storage/v1/object/public/${bucket}/`;
    const idx = urlOrPath.indexOf(marker);
    if (idx !== -1) return urlOrPath.substring(idx + marker.length);
    // Also handle signed URL format
    const signedMarker = `/storage/v1/object/sign/${bucket}/`;
    const signedIdx = urlOrPath.indexOf(signedMarker);
    if (signedIdx !== -1) {
      const pathWithQuery = urlOrPath.substring(signedIdx + signedMarker.length);
      return pathWithQuery.split('?')[0];
    }
  }
  return urlOrPath;
}

/**
 * Generate a signed URL for a file in a private bucket.
 * Works with both full public URLs (legacy) and plain paths.
 */
export async function getSignedUrl(
  bucket: string,
  urlOrPath: string,
  expiresIn = 3600
): Promise<string> {
  const path = extractStoragePath(urlOrPath, bucket);
  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrl(path, expiresIn);
  if (error || !data?.signedUrl) {
    console.warn('Failed to create signed URL:', error?.message);
    return urlOrPath; // fallback to original
  }
  return data.signedUrl;
}

/**
 * Batch generate signed URLs for multiple paths in a bucket.
 */
export async function getSignedUrls(
  bucket: string,
  urlsOrPaths: string[],
  expiresIn = 3600
): Promise<Map<string, string>> {
  const result = new Map<string, string>();
  const paths = urlsOrPaths.map((u) => extractStoragePath(u, bucket));

  const { data, error } = await supabase.storage
    .from(bucket)
    .createSignedUrls(paths, expiresIn);

  if (error || !data) {
    console.warn('Failed to create signed URLs:', error?.message);
    urlsOrPaths.forEach((u) => result.set(u, u));
    return result;
  }

  data.forEach((item, idx) => {
    result.set(urlsOrPaths[idx], item.signedUrl || urlsOrPaths[idx]);
  });

  return result;
}

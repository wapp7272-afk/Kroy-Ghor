/**
 * YouTube Utility Helpers for Zeropicbd
 * Parses various YouTube URL formats (standard, short, embed, shorts) and bare IDs.
 */

export function extractYouTubeId(urlOrId?: string): string {
  if (!urlOrId) return '';
  const trimmed = urlOrId.trim();

  // If already an 11-char ID (e.g. dQw4w9WgXcQ, sU3FkmV9b70)
  if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
    return trimmed;
  }

  // Regex handles:
  // - https://www.youtube.com/watch?v=VIDEO_ID
  // - https://youtu.be/VIDEO_ID
  // - https://www.youtube.com/embed/VIDEO_ID
  // - https://www.youtube.com/shorts/VIDEO_ID
  // - https://m.youtube.com/watch?v=VIDEO_ID
  const regExp = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?|shorts)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/i;
  const match = trimmed.match(regExp);

  if (match && match[1]) {
    return match[1];
  }

  // Fallback: check if query param contains v=
  try {
    const parsed = new URL(trimmed.startsWith('http') ? trimmed : `https://${trimmed}`);
    const v = parsed.searchParams.get('v');
    if (v && v.length === 11) {
      return v;
    }
  } catch {
    // Ignore URL parse errors
  }

  return trimmed;
}

export function getYouTubeEmbedUrl(urlOrId?: string, autoplay: boolean = false): string {
  const id = extractYouTubeId(urlOrId);
  if (!id) return '';
  const autoplayParam = autoplay ? '&autoplay=1' : '';
  return `https://www.youtube.com/embed/${id}?rel=0&modestbranding=1&enablejsapi=1${autoplayParam}`;
}

export function getYouTubeWatchUrl(urlOrId?: string): string {
  const id = extractYouTubeId(urlOrId);
  return id ? `https://www.youtube.com/watch?v=${id}` : 'https://www.youtube.com';
}

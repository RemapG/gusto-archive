/**
 * Helper to parse various video link types (VK Video, YouTube, RuTube)
 * and extract or build a clean embed player URL.
 */
export function getVideoEmbedUrl(input: string | null | undefined): string | null {
  if (!input) return null;
  const trimmed = input.trim();

  // If it's an iframe tag, extract the src attribute
  if (trimmed.startsWith("<iframe") || trimmed.includes("iframe")) {
    const match = trimmed.match(/src="([^"]+)"/);
    if (match && match[1]) {
      return match[1];
    }
  }

  // If it's already an embed URL format
  if (
    trimmed.includes("video_ext.php") || // VK Embed
    trimmed.includes("youtube.com/embed/") || // YouTube Embed
    trimmed.includes("rutube.ru/play/embed/") // RuTube Embed
  ) {
    return trimmed;
  }

  // YouTube watch link: youtube.com/watch?v=XXX or youtu.be/XXX
  const ytMatch = trimmed.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\s?]+)/);
  if (ytMatch && ytMatch[1]) {
    return `https://www.youtube.com/embed/${ytMatch[1]}`;
  }

  // RuTube watch link: rutube.ru/video/XXX/
  const rtMatch = trimmed.match(/rutube\.ru\/video\/([^/\s?]+)/);
  if (rtMatch && rtMatch[1]) {
    return `https://rutube.ru/play/embed/${rtMatch[1]}`;
  }

  // VK watch link: vk.com/video-XXX_YYY or vkvideo.ru/video-XXX_YYY
  const vkMatch = trimmed.match(/(?:vk\.com|vkvideo\.ru)\/video(-?\d+)_(\d+)/);
  if (vkMatch && vkMatch[1] && vkMatch[2]) {
    let embedUrl = `https://vk.com/video_ext.php?oid=${vkMatch[1]}&id=${vkMatch[2]}`;
    // Preserve hash parameter if present in watch URL (needed for private/restricted videos)
    const hashMatch = trimmed.match(/[?&]hash=([a-f0-9]+)/i);
    if (hashMatch && hashMatch[1]) {
      embedUrl += `&hash=${hashMatch[1]}`;
    }
    return embedUrl;
  }

  // Fallback: if it's a URL, return it directly
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) {
    return trimmed;
  }

  return null;
}

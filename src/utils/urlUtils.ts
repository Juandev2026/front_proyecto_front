export const stripHtml = (html: string): string => {
  if (!html) return '';
  // 1. Decode entities
  let text = html
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&#39;/g, "'");
  
  // 2. Remove tags
  return text.replace(/<[^>]+>/g, '').trim();
};

export const cleanSlug = (name: string): string => {
  const cleanName = stripHtml(name);
  return cleanName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
};

export const createSlug = (name: string, id?: number | null): string => {
  const slug = cleanSlug(name);
  return id ? `${slug}-${id}` : slug;
};

export const getIdFromSlug = (slug: string | string[] | undefined): number | null => {
  if (!slug || Array.isArray(slug)) return null;
  const match = slug.match(/-(\d+)$/);
  const idStr = match?.[1];
  return idStr ? parseInt(idStr, 10) : null;
};

export const linkifyHtml = (html: string): string => {
  if (!html) return '';
  // Split by tags to only target text content
  const regex = /(<[^>]+>)/g;
  const parts = html.split(regex);
  
  return parts.map(part => {
    // If NOT a tag, linkify
    if (!part.startsWith('<')) {
      return part.replace(
        /(https?:\/\/[^\s"<>]+)/g, 
        '<div class="w-full text-center my-6"><a href="$1" target="_blank" rel="noopener noreferrer" class="inline-block px-12 py-4 bg-primary text-white font-bold text-xl leading-tight uppercase rounded-xl shadow-lg hover:bg-blue-700 hover:shadow-xl focus:bg-blue-700 focus:shadow-lg focus:outline-none focus:ring-0 active:bg-blue-800 active:shadow-lg transition duration-150 ease-in-out break-words">CLICK AQUÍ</a></div>'
      );
    }
    return part;
  }).join('');
};


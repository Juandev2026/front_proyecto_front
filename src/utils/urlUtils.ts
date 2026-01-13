export const cleanSlug = (name: string): string => {
  const cleanName = name.replace(/<[^>]+>/g, '').trim();
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
  return match ? parseInt(match[1], 10) : null;
};

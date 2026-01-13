export const createSlug = (name: string, id: number): string => {
  const cleanName = name.replace(/<[^>]+>/g, '').trim();
  const slug = cleanName
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');
  return `${slug}-${id}`;
};

export const getIdFromSlug = (slug: string | string[] | undefined): number | null => {
  if (!slug || Array.isArray(slug)) return null;
  const match = slug.match(/-(\d+)$/);
  return match ? parseInt(match[1], 10) : null;
};

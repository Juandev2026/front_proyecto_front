export const chunkArr = <T>(arr: Array<T>, chunkSize: number) => {
  const chunked = [];
  for (let i = 0; i < arr.length; i += chunkSize) {
    chunked.push(arr.slice(i, i + chunkSize));
  }
  return chunked;
};

/**
 * Elimina prefijos redundantes de las alternativas como "A) ", "A. ", etc.
 * @param content El contenido de la alternativa (puede ser HTML)
 * @param opt La letra de la alternativa (A, B, C, D)
 */
export const cleanAlternativeContent = (content: string, opt: string): string => {
  if (!content) return '';
  // Busca el patrón de la letra seguida de un signo de puntuación opcional al inicio
  // También maneja si el contenido está envuelto en etiquetas HTML simples
  const regex = new RegExp(`^\\s*(<[^>]+>)*\\s*${opt}\\s*[\\)\\.\\-]?\\s*`, 'i');
  return content.replace(regex, (_, p1) => {
    return p1 || '';
  }).trim();
};

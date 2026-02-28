export interface SubPreguntaExamen {
  numero: number;
  enunciado: string;
  imagen: string;
  alternativaA: string;
  alternativaB: string;
  alternativaC: string;
  alternativaD: string;
  puntos: number;
  tiempoPregunta: number;
  respuesta?: string;
  idAlternativaA?: number;
  idAlternativaB?: number;
  idAlternativaC?: number;
  idAlternativaD?: number;
}

export interface PreguntaExamen {
  id: number;
  preguntaId: number; // Alias de id, usar este para enviar respuestas
  examenId: number; // Importante: Necesario para agrupar respuestas
  enunciado: string;
  alternativaA: string;
  alternativaB: string;
  alternativaC: string;
  alternativaD: string;
  imagen: string;
  puntos: number;
  tiempoPregunta: number;
  clasificacionNombre?: string;
  respuesta?: string;
  sustento?: string;
  clasificacionId?: number;
  tipoPreguntaId?: number;
  year?: number | string;
  anio?: number | string;
  subPreguntas?: SubPreguntaExamen[]; // Nueva propiedad para sub-preguntas
  idAlternativaA?: number;
  idAlternativaB?: number;
  idAlternativaC?: number;
  idAlternativaD?: number;
}

export interface RespuestaUsuario {
  preguntaId: number;
  subPreguntaNumero?: number | null; // Cambiado para coincidir con la documentación
  alternativaMarcada: string | null; // "A", "B", "C", "D" o "" si se omitió
}

export interface SolucionExamenRequest {
  examenId: number;
  userId: number;
  year: number;
  respuestas: RespuestaUsuario[];
}

export interface ExamenResultado {
  examenId: number;
  puntajeTotal: number;
  cantidadCorrectas: number;
  cantidadIncorrectas: number;
  cantidadOmitidas: number;
  idsCorrectas: string[]; // Cambiado a string[] para soportar "105-1"
  idsIncorrectas: string[]; // Cambiado a string[]
  idsOmitidas: string[]; // Cambiado a string[]
}

export interface ResultadoExamenResponse {
  puntajeGlobal: number;
  resultados: ExamenResultado[];
}

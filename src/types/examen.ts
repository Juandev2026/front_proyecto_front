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
}

export interface RespuestaUsuario {
  preguntaId: number;
  numeroSubPregunta?: number; // Nuevo campo para sub-preguntas
  alternativaMarcada: string | null; // "A", "B", "C", "D" o null si se omitió
}

export interface ExamenSolucion {
  examenId: number;
  respuestas: RespuestaUsuario[];
}

export interface SolucionExamenRequest {
  examenes: ExamenSolucion[];
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

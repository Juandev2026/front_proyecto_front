export interface PreguntaAI {
  enunciado: string;
  alternativaA: string;
  alternativaB: string;
  alternativaC: string;
  alternativaD?: string;
  respuesta: string;
  sustento: string;
}

const OPENAI_API_KEY = process.env.NEXT_PUBLIC_OPENAI_API_KEY || '';

export const aiService = {
  generateFullQuestion: async (
    topic: string,
    apiKey: string
  ): Promise<PreguntaAI> => {
    try {
      const prompt = `Genera una pregunta de opción múltiple para un examen de docentes en Perú sobre el tema: "${topic}".
      Debes generar exactamente 3 alternativas plausibles (A, B, C).
      La respuesta debe ser un objeto JSON con el siguiente formato, sin markdown ni texto adicional:
      {
        "enunciado": "Texto de la pregunta...",
        "alternativaA": "Opción A...",
        "alternativaB": "Opción B...",
        "alternativaC": "Opción C...",
        "respuesta": "A", // O "B", "C"
        "sustento": "Explicación breve de por qué es la respuesta correcta..."
      }`;

      const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Error en la API de OpenAI');
      }

      const data = await response.json();
      const { content } = data.choices[0].message;
      try {
        const parsed = JSON.parse(content);
        return { ...parsed, alternativaD: parsed.alternativaD || '' };
      } catch (e) {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return { ...parsed, alternativaD: parsed.alternativaD || '' };
        }
        throw new Error('Formato de respuesta inválido');
      }
    } catch (error) {
      console.error('AI Service Error:', error);
      throw error;
    }
  },

  generateAnswers: async (
    enunciado: string,
    apiKey: string
  ): Promise<PreguntaAI> => {
    try {
      const prompt = `Dada la siguiente pregunta: "${enunciado}".
        Genera exactamente 3 alternativas plausibles (A, B, C), identifica la correcta y proporciona un sustento breve.
        La respuesta debe ser un objeto JSON con el siguiente formato, sin markdown ni texto adicional:
        {
          "alternativaA": "Opción A...",
          "alternativaB": "Opción B...",
          "alternativaC": "Opción C...",
          "respuesta": "A", // O "B", "C"
          "sustento": "Explicación..."
        }`;

      const response = await fetch(
        'https://api.openai.com/v1/chat/completions',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-3.5-turbo',
            messages: [{ role: 'user', content: prompt }],
            temperature: 0.7,
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Error en la API de OpenAI');
      }

      const data = await response.json();
      const { content } = data.choices[0].message;

      try {
        const parsed = JSON.parse(content);
        return {
          enunciado,
          ...parsed,
          alternativaD: parsed.alternativaD || '',
        };
      } catch (e) {
        const jsonMatch = content.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          const parsed = JSON.parse(jsonMatch[0]);
          return { enunciado, ...parsed, alternativaD: parsed.alternativaD || '' };
        }
        throw new Error('Formato de respuesta inválido');
      }
    } catch (error) {
      console.error('AI Service Error:', error);
      throw error;
    }
  },
};

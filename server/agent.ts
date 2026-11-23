import { GoogleGenAI, ThinkingLevel, Type } from '@google/genai';
import type {
  AgentStructuredSuggestion,
  KnowledgeBaseArticle,
  Ticket,
  TicketMessage,
} from '../src/types/helpdesk.ts';
import { findRelevantKbArticles } from './db.ts';

const GEMINI_RETRY_DELAYS_MS = [1000, 2000, 4000];

function getGeminiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    throw new Error(
      'GEMINI_API_KEY no está configurada en el entorno del servidor. Configúrela en Secrets para activar AgentDesk.'
    );
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function isTemporaryGeminiError(error: unknown): boolean {
  const details =
    typeof error === 'object' && error !== null
      ? (error as { status?: unknown; code?: unknown; message?: unknown })
      : {};
  const status = details.status === 503 || details.status === '503';
  const code =
    typeof details.code === 'string' && details.code.toUpperCase() === 'UNAVAILABLE';
  const message =
    error instanceof Error
      ? error.message
      : typeof error === 'string'
        ? error
        : typeof details.message === 'string'
          ? details.message
          : '';

  return status || code || /\b503\b|UNAVAILABLE|high demand|temporarily unavailable/i.test(message);
}

async function generateContentWithRetry<T>(generate: () => Promise<T>): Promise<T> {
  for (let retry = 0; ; retry += 1) {
    try {
      return await generate();
    } catch (error) {
      if (!isTemporaryGeminiError(error)) {
        throw error;
      }
      if (retry >= GEMINI_RETRY_DELAYS_MS.length) {
        throw new Error(
          `AgentDesk sigue ocupado después de ${GEMINI_RETRY_DELAYS_MS.length} reintentos. Espere unos minutos y vuelva a intentarlo.`
        );
      }
      await new Promise((resolve) => setTimeout(resolve, GEMINI_RETRY_DELAYS_MS[retry]));
    }
  }
}

export async function analyzeTicketWithAgentDesk(
  ticket: Ticket
): Promise<AgentStructuredSuggestion> {
  const ai = getGeminiClient();
  const candidates = findRelevantKbArticles(
    ticket.category,
    ticket.subcategory,
    `${ticket.subject} ${ticket.description}`
  );

  const kbContext = candidates
    .map(
      (a) =>
        `[ID=${a.id} | Código=${a.code} | ${a.category} / ${a.subcategory}]\nTítulo: ${a.title}\nSíntomas: ${a.symptoms}\nProcedimiento:\n${a.solution_steps}`
    )
    .join('\n\n---\n\n');

  const prompt = `Analiza el siguiente caso de soporte técnico corporativo y propón una solución práctica basada prioritariamente en la Base de Conocimientos interna.

Ticket: ${ticket.ticket_code}
Usuario: ${ticket.reporter_name} (${ticket.department})
Categoría: ${ticket.category} / ${ticket.subcategory}
Tipo: ${ticket.ticket_type} | Prioridad: ${ticket.priority}
Asunto: ${ticket.subject}
Descripción detallada: ${ticket.description}

Base de Conocimientos local (SQLite):
${kbContext}`;

  const response = await generateContentWithRetry(() => ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: prompt,
    config: {
      systemInstruction:
        'Eres AgentDesk, el agente inteligente de soporte técnico TI de Soportech Vzla. Respondes siempre en español técnico claro, profesional y directo para usuarios corporativos. Prioriza los procedimientos de la Base de Conocimientos proporcionada, indica pasos concretos enumerados, y sugiere escalamiento a soporte humano (suggestEscalation=true) únicamente si hay daño físico evidente de hardware, incidente crítico de phishing/malware o necesidad de privilegios de infraestructura que el usuario final no puede ejecutar.',
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          diagnosis: {
            type: Type.STRING,
            description: 'Diagnóstico técnico breve en 1 o 2 oraciones claras.',
          },
          steps: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Lista de 3 a 5 pasos claros y accionables para resolver el problema.',
          },
          preventiveTip: {
            type: Type.STRING,
            description: 'Consejo preventivo corto para evitar que el incidente vuelva a ocurrir.',
          },
          matchedKbId: {
            type: Type.INTEGER,
            description: 'ID numérico del artículo de la base de conocimientos más relevante, o 0 si ninguno aplica.',
          },
          confidenceLabel: {
            type: Type.STRING,
            description: 'Etiqueta breve: "Alta coincidencia en KB", "Coincidencia parcial" o "Diagnóstico general".',
          },
          suggestEscalation: {
            type: Type.BOOLEAN,
            description: 'true si el caso requiere escalamiento inmediato a técnico humano.',
          },
        },
        required: [
          'diagnosis',
          'steps',
          'preventiveTip',
          'matchedKbId',
          'confidenceLabel',
          'suggestEscalation',
        ],
      },
    },
  }));

  const rawText = (response.text ?? '').trim();
  if (!rawText) {
    throw new Error('AgentDesk no recibió respuesta del modelo de lenguaje.');
  }

  const parsed = JSON.parse(rawText) as {
    diagnosis: string;
    steps: string[];
    preventiveTip: string;
    matchedKbId: number;
    confidenceLabel: string;
    suggestEscalation: boolean;
  };

  const matchedArticle: KnowledgeBaseArticle | undefined = candidates.find(
    (c) => c.id === parsed.matchedKbId
  );

  return {
    diagnosis: parsed.diagnosis,
    steps: Array.isArray(parsed.steps) && parsed.steps.length > 0 ? parsed.steps : ['Verifique la configuración descrita y reporte el resultado.'],
    preventiveTip: parsed.preventiveTip || 'Mantenga su equipo actualizado y respalde su información periódicamente.',
    matchedKbId: matchedArticle ? matchedArticle.id : candidates[0]?.id ?? null,
    matchedKbTitle: matchedArticle ? matchedArticle.title : candidates[0]?.title ?? null,
    confidenceLabel: parsed.confidenceLabel || 'Alta coincidencia en KB',
    suggestEscalation: Boolean(parsed.suggestEscalation),
  };
}

export async function replyWithAgentDesk(
  ticket: Ticket,
  history: TicketMessage[],
  userMessage: string
): Promise<string> {
  const ai = getGeminiClient();
  const candidates = findRelevantKbArticles(
    ticket.category,
    ticket.subcategory,
    `${ticket.subject} ${ticket.description} ${userMessage}`
  );

  const kbContext = candidates
    .map((a) => `[${a.code}] ${a.title}:\n${a.solution_steps}`)
    .join('\n\n');

  const transcript = history
    .slice(-8)
    .map((m) => `${m.sender_name}: ${m.content}`)
    .join('\n');

  const prompt = `Contexto del ticket ${ticket.ticket_code} (${ticket.category} / ${ticket.subcategory}):
Asunto: ${ticket.subject}

Base de conocimientos relevante:
${kbContext}

Historial reciente del ticket:
${transcript}

Nueva consulta del usuario (${ticket.reporter_name}):
${userMessage}

Responde de forma clara, empática y orientada a resolver el caso. Si los pasos anteriores no funcionaron y requiere intervención física o administrativa, indica explícitamente que puede presionar "Escalar a Soporte Humano".`;

  const response = await generateContentWithRetry(() => ai.models.generateContent({
    model: 'gemini-4-hydrogen',
    contents: prompt,
    config: {
      systemInstruction:
        'Eres AgentDesk, asistente de soporte técnico TI de Soportech Vzla. Responde en español conciso, sin inventar herramientas inexistentes, basándote en la base de conocimientos corporativa.',
      thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
    },
  }));

  const text = (response.text ?? '').trim();
  if (!text) {
    throw new Error('No se obtuvo respuesta de seguimiento de AgentDesk.');
  }
  return text;
}

export async function transcribeAudioWithGemini(
  base64Audio: string,
  mimeType: string
): Promise<string> {
  const ai = getGeminiClient();
  const cleanMimeType = mimeType.split(';')[0] || 'audio/webm';

  const audioPart = {
    inlineData: {
      mimeType: cleanMimeType,
      data: base64Audio,
    },
  };

  const response = await ai.models.generateContent({
    model: 'gemini-3.5-transcribe',
    contents: {
      parts: [
        audioPart,
        {
          text: 'Transcribe exactamente este audio en español con puntuación natural para la descripción de un ticket de soporte técnico. Devuelve únicamente la transcripción sin comentarios adicionales.',
        },
      ],
    },
  });

  const transcript = (response.text ?? '').trim();
  if (!transcript) {
    throw new Error('No se detectó voz clara en la grabación de audio.');
  }
  return transcript;
}


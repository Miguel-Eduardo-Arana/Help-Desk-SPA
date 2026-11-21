import 'dotenv/config';
import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import {
  addTicketMessage,
  createKnowledgeArticle,
  createTicketRecord,
  deleteKnowledgeArticle,
  escalateTicketToHuman,
  getDashboardStats,
  getKnowledgeArticleById,
  getTicketById,
  getTicketMessages,
  initDatabase,
  listTickets,
  resolveTicketWithRating,
  saveAgentSuggestion,
  searchKnowledgeBase,
} from './server/db.ts';
import {
  analyzeTicketWithAgentDesk,
  replyWithAgentDesk,
  transcribeAudioWithGemini,
} from './server/agent.ts';
import type { AgentStructuredSuggestion } from './src/types/helpdesk.ts';

initDatabase();

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '15mb' }));

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ ok: true, database: 'sqlite', service: 'Soportech Vzla Helpdesk SPA' });
});

// Audio transcription endpoint for voice bug reports
app.post('/api/transcribe', async (req, res) => {
  try {
    const audioBase64 =
      typeof req.body?.audioBase64 === 'string' ? req.body.audioBase64.trim() : '';
    const mimeType =
      typeof req.body?.mimeType === 'string' && req.body.mimeType.trim()
        ? req.body.mimeType.trim()
        : 'audio/webm';

    if (!audioBase64) {
      res.status(400).json({ error: 'No se recibió contenido de audio para transcribir.' });
      return;
    }

    const transcript = await transcribeAudioWithGemini(audioBase64, mimeType);
    res.json({ transcript });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : 'Error transcribiendo la grabación de voz.';
    res.status(502).json({ error: message });
  }
});

// Dashboard KPIs and breakdowns
app.get('/api/dashboard', (_req, res) => {
  try {
    const stats = getDashboardStats();
    res.json(stats);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error consultando estadísticas';
    res.status(500).json({ error: message });
  }
});

// List & filter tickets
app.get('/api/tickets', (req, res) => {
  try {
    const tickets = listTickets({
      status: typeof req.query.status === 'string' ? req.query.status : undefined,
      category: typeof req.query.category === 'string' ? req.query.category : undefined,
      department: typeof req.query.department === 'string' ? req.query.department : undefined,
      search: typeof req.query.search === 'string' ? req.query.search : undefined,
    });
    res.json(tickets);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error listando tickets';
    res.status(500).json({ error: message });
  }
});

// Get ticket detail + messages + KB article
app.get('/api/tickets/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id)) {
      res.status(400).json({ error: 'Identificador de ticket inválido' });
      return;
    }
    const ticket = getTicketById(id);
    if (!ticket) {
      res.status(404).json({ error: 'Ticket no encontrado' });
      return;
    }
    const messages = getTicketMessages(id);
    const kbArticle = getKnowledgeArticleById(ticket.kb_article_id);
    let parsedSuggestion: AgentStructuredSuggestion | null = null;
    if (ticket.ai_suggestion_json) {
      try {
        parsedSuggestion = JSON.parse(ticket.ai_suggestion_json) as AgentStructuredSuggestion;
      } catch {
        parsedSuggestion = null;
      }
    }
    res.json({ ticket, messages, kbArticle, parsedSuggestion });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error cargando ticket';
    res.status(500).json({ error: message });
  }
});

// Create ticket + automatically invoke AgentDesk
app.post('/api/tickets', async (req, res) => {
  try {
    const {
      reporter_name,
      reporter_email,
      department,
      category,
      subcategory,
      ticket_type,
      priority,
      subject,
      description,
    } = req.body ?? {};

    if (
      !reporter_name?.trim() ||
      !reporter_email?.trim() ||
      !department?.trim() ||
      !category?.trim() ||
      !subcategory?.trim() ||
      !subject?.trim() ||
      !description?.trim()
    ) {
      res.status(400).json({
        error: 'Todos los campos obligatorios deben completarse para registrar el ticket.',
      });
      return;
    }

    let ticket = createTicketRecord({
      reporter_name,
      reporter_email,
      department,
      category,
      subcategory,
      ticket_type: ticket_type || 'Incidencia',
      priority: priority || 'Media',
      subject,
      description,
    });

    let aiError: string | null = null;
    let parsedSuggestion: AgentStructuredSuggestion | null = null;

    try {
      const suggestion = await analyzeTicketWithAgentDesk(ticket);
      ticket = saveAgentSuggestion(ticket.id, suggestion);
      parsedSuggestion = suggestion;
    } catch (err) {
      aiError =
        err instanceof Error
          ? err.message
          : 'No se pudo obtener la sugerencia automática de AgentDesk.';
    }

    const messages = getTicketMessages(ticket.id);
    const kbArticle = getKnowledgeArticleById(ticket.kb_article_id);
    res.status(201).json({ ticket, messages, kbArticle, parsedSuggestion, aiError });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error creando ticket';
    res.status(500).json({ error: message });
  }
});

// Re-run AgentDesk analysis for a ticket
app.post('/api/tickets/:id/analyze', async (req, res) => {
  try {
    const id = Number(req.params.id);
    let ticket = getTicketById(id);
    if (!ticket) {
      res.status(404).json({ error: 'Ticket no encontrado' });
      return;
    }

    const suggestion = await analyzeTicketWithAgentDesk(ticket);
    ticket = saveAgentSuggestion(id, suggestion);
    const messages = getTicketMessages(id);
    const kbArticle = getKnowledgeArticleById(ticket.kb_article_id);
    res.json({ ticket, messages, kbArticle, parsedSuggestion: suggestion });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error al consultar AgentDesk';
    res.status(502).json({ error: message });
  }
});

// Follow-up conversation message with AgentDesk
app.post('/api/tickets/:id/messages', async (req, res) => {
  try {
    const id = Number(req.params.id);
    const ticket = getTicketById(id);
    if (!ticket) {
      res.status(404).json({ error: 'Ticket no encontrado' });
      return;
    }

    const content = typeof req.body?.content === 'string' ? req.body.content.trim() : '';
    if (!content) {
      res.status(400).json({ error: 'El mensaje no puede estar vacío.' });
      return;
    }

    addTicketMessage(id, 'user', ticket.reporter_name, content);
    const history = getTicketMessages(id);

    let aiError: string | null = null;
    try {
      const reply = await replyWithAgentDesk(ticket, history, content);
      addTicketMessage(id, 'agent', 'AgentDesk IA', reply);
    } catch (err) {
      aiError =
        err instanceof Error
          ? err.message
          : 'No se pudo generar respuesta de seguimiento en AgentDesk.';
    }

    const updatedMessages = getTicketMessages(id);
    res.json({ messages: updatedMessages, aiError });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error enviando mensaje';
    res.status(500).json({ error: message });
  }
});

// Escalate to human support
app.post('/api/tickets/:id/escalate', (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = getTicketById(id);
    if (!existing) {
      res.status(404).json({ error: 'Ticket no encontrado' });
      return;
    }
    const notes = typeof req.body?.notes === 'string' ? req.body.notes : undefined;
    const ticket = escalateTicketToHuman(id, notes);
    const messages = getTicketMessages(id);
    res.json({ ticket, messages });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error escalando ticket';
    res.status(500).json({ error: message });
  }
});

// Close ticket with 1-5 star rating
app.post('/api/tickets/:id/resolve', (req, res) => {
  try {
    const id = Number(req.params.id);
    const existing = getTicketById(id);
    if (!existing) {
      res.status(404).json({ error: 'Ticket no encontrado' });
      return;
    }

    const rating = Number(req.body?.rating);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      res.status(400).json({ error: 'Debe seleccionar una calificación válida entre 1 y 5 estrellas.' });
      return;
    }

    const comment = typeof req.body?.rating_comment === 'string' ? req.body.rating_comment : undefined;
    const ticket = resolveTicketWithRating(id, rating, comment);
    res.json({ ticket });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error cerrando ticket';
    res.status(500).json({ error: message });
  }
});

// Knowledge Base endpoints
app.get('/api/kb', (req, res) => {
  try {
    const q = typeof req.query.q === 'string' ? req.query.q : undefined;
    const category = typeof req.query.category === 'string' ? req.query.category : undefined;
    const articles = searchKnowledgeBase(q, category);
    res.json(articles);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error consultando base de conocimientos';
    res.status(500).json({ error: message });
  }
});

app.post('/api/kb', (req, res) => {
  try {
    const { category, subcategory, title, symptoms, solution_steps, keywords } = req.body ?? {};
    if (!category || !subcategory || !title?.trim() || !symptoms?.trim() || !solution_steps?.trim()) {
      res.status(400).json({ error: 'Complete todos los campos requeridos del artículo técnico.' });
      return;
    }
    const created = createKnowledgeArticle({
      category,
      subcategory,
      title,
      symptoms,
      solution_steps,
      keywords: keywords || `${category} ${subcategory} ${title}`,
    });
    res.status(201).json(created);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error creando artículo';
    res.status(500).json({ error: message });
  }
});

app.delete('/api/kb/:id', (req, res) => {
  try {
    const id = Number(req.params.id);
    const deleted = deleteKnowledgeArticle(id);
    if (!deleted) {
      res.status(404).json({ error: 'Artículo no encontrado' });
      return;
    }
    res.json({ ok: true });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error eliminando artículo';
    res.status(500).json({ error: message });
  }
});

async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    const distPath = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('/{*splat}', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Soportech Vzla Helpdesk SPA running on http://localhost:${PORT}`);
  });
}

startServer();

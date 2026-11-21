export type TicketStatus =
  | 'Abierto'
  | 'En Atención'
  | 'Escalado a Humano'
  | 'Resuelto';

export type TicketType = 'Incidencia' | 'Requerimiento';

export type TicketPriority = 'Baja' | 'Media' | 'Alta' | 'Crítica';

export interface TaxonomyEntry {
  category: string;
  subcategory: string;
  type: TicketType;
  suggestedPriority: TicketPriority;
  example: string;
}

export const ORGANIZATIONAL_UNITS: string[] = [
  'Tecnología e Informática',
  'Administración y Finanzas',
  'Recursos Humanos',
  'Operaciones y Logística',
  'Ventas y Comercial',
  'Atención al Cliente',
  'Dirección General',
  'Legal y Cumplimiento',
];

export const TAXONOMY_CATALOG: TaxonomyEntry[] = [
  {
    category: 'Accesos y Cuentas',
    subcategory: 'Contraseñas y MFA',
    type: 'Incidencia',
    suggestedPriority: 'Alta',
    example: 'Cuenta bloqueada o fallo en doble factor de autenticación',
  },
  {
    category: 'Accesos y Cuentas',
    subcategory: 'Permisos y Carpetas',
    type: 'Requerimiento',
    suggestedPriority: 'Media',
    example: 'Solicitud de acceso a carpeta compartida o grupo de correo',
  },
  {
    category: 'Accesos y Cuentas',
    subcategory: 'Altas / Bajas (Onboarding)',
    type: 'Requerimiento',
    suggestedPriority: 'Media',
    example: 'Creación de usuario y asignación de equipo para nuevo ingreso',
  },
  {
    category: 'Software y Aplicaciones',
    subcategory: 'Sistema Operativo',
    type: 'Incidencia',
    suggestedPriority: 'Alta',
    example: 'Pantalla azul, fallo de arranque o error tras actualización',
  },
  {
    category: 'Software y Aplicaciones',
    subcategory: 'Herramientas de Oficina',
    type: 'Incidencia',
    suggestedPriority: 'Media',
    example: 'Error al abrir hojas de cálculo, correo o suite de colaboración',
  },
  {
    category: 'Software y Aplicaciones',
    subcategory: 'Instalación / Licencias',
    type: 'Requerimiento',
    suggestedPriority: 'Baja',
    example: 'Instalación de software autorizado o renovación de licencia',
  },
  {
    category: 'Hardware y Periféricos',
    subcategory: 'Computadora / Laptop',
    type: 'Incidencia',
    suggestedPriority: 'Alta',
    example: 'Equipo no enciende, no da video o presenta sobrecalentamiento',
  },
  {
    category: 'Hardware y Periféricos',
    subcategory: 'Impresoras y Escáneres',
    type: 'Incidencia',
    suggestedPriority: 'Media',
    example: 'Atasco de papel, impresora fuera de línea o cambio de tóner',
  },
  {
    category: 'Hardware y Periféricos',
    subcategory: 'Accesorios',
    type: 'Requerimiento',
    suggestedPriority: 'Baja',
    example: 'Reemplazo de teclado, ratón, cargador o monitor',
  },
  {
    category: 'Redes y Conectividad',
    subcategory: 'Internet / Wi-Fi / LAN',
    type: 'Incidencia',
    suggestedPriority: 'Crítica',
    example: 'Sin acceso a internet en estación de trabajo o área completa',
  },
  {
    category: 'Redes y Conectividad',
    subcategory: 'Acceso Remoto (VPN)',
    type: 'Incidencia',
    suggestedPriority: 'Alta',
    example: 'Error de conexión o autenticación al ingresar a la VPN',
  },
  {
    category: 'Seguridad Informática',
    subcategory: 'Phishing / Malware',
    type: 'Incidencia',
    suggestedPriority: 'Crítica',
    example: 'Reporte de correo sospechoso o alerta de virus en el equipo',
  },
  {
    category: 'Respaldos y Datos',
    subcategory: 'Recuperación de Archivos',
    type: 'Requerimiento',
    suggestedPriority: 'Alta',
    example: 'Restauración de carpeta eliminada por accidente',
  },
];

export const CATEGORIES: string[] = Array.from(
  new Set(TAXONOMY_CATALOG.map((item) => item.category))
);

export const RATING_LABELS: Record<number, string> = {
  1: 'Sin solución',
  2: 'Poco satisfactoria',
  3: 'Medianamente satisfactoria',
  4: 'Satisfactoria',
  5: 'Satisfactorio / Resuelto',
};

export interface AgentStructuredSuggestion {
  diagnosis: string;
  steps: string[];
  preventiveTip: string;
  matchedKbId: number | null;
  matchedKbTitle: string | null;
  confidenceLabel: string;
  suggestEscalation: boolean;
}

export interface KnowledgeBaseArticle {
  id: number;
  code: string;
  category: string;
  subcategory: string;
  title: string;
  symptoms: string;
  solution_steps: string;
  keywords: string;
  updated_at: string;
}

export interface TicketMessage {
  id: number;
  ticket_id: number;
  sender_role: 'user' | 'agent' | 'human_support';
  sender_name: string;
  content: string;
  created_at: string;
}

export interface Ticket {
  id: number;
  ticket_code: string;
  reporter_name: string;
  reporter_email: string;
  department: string;
  category: string;
  subcategory: string;
  ticket_type: TicketType;
  priority: TicketPriority;
  subject: string;
  description: string;
  status: TicketStatus;
  created_at: string;
  first_response_at: string | null;
  resolved_at: string | null;
  ai_suggestion_json: string | null;
  kb_article_id: number | null;
  escalated_to_human: number;
  escalation_notes: string | null;
  rating: number | null;
  rating_comment: string | null;
}

export interface TicketDetailResponse {
  ticket: Ticket;
  messages: TicketMessage[];
  kbArticle: KnowledgeBaseArticle | null;
  parsedSuggestion: AgentStructuredSuggestion | null;
}

export interface DashboardStats {
  totalTickets: number;
  resolvedTickets: number;
  openTickets: number;
  escalatedTickets: number;
  avgAttentionMinutes: number;
  avgResolutionMinutes: number;
  avgRating: number | null;
  ratedCount: number;
  resolutionRate: number;
  byCategory: Array<{ category: string; total: number; resolved: number }>;
  byDepartment: Array<{ department: string; total: number }>;
  byPriority: Array<{ priority: string; total: number }>;
  recentTickets: Ticket[];
}

import Database from 'better-sqlite3';
import path from 'path';
import type {
  AgentStructuredSuggestion,
  DashboardStats,
  KnowledgeBaseArticle,
  Ticket,
  TicketMessage,
} from '../src/types/helpdesk.ts';

const DB_PATH = path.resolve(process.cwd(), 'soportech.db');
const db = new Database(DB_PATH);

db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

export function initDatabase(): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS knowledge_base (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT NOT NULL UNIQUE,
      category TEXT NOT NULL,
      subcategory TEXT NOT NULL,
      title TEXT NOT NULL,
      symptoms TEXT NOT NULL,
      solution_steps TEXT NOT NULL,
      keywords TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS tickets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_code TEXT NOT NULL UNIQUE,
      reporter_name TEXT NOT NULL,
      reporter_email TEXT NOT NULL,
      department TEXT NOT NULL,
      category TEXT NOT NULL,
      subcategory TEXT NOT NULL,
      ticket_type TEXT NOT NULL,
      priority TEXT NOT NULL,
      subject TEXT NOT NULL,
      description TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'Abierto',
      created_at TEXT NOT NULL,
      first_response_at TEXT,
      resolved_at TEXT,
      ai_suggestion_json TEXT,
      kb_article_id INTEGER,
      escalated_to_human INTEGER NOT NULL DEFAULT 0,
      escalation_notes TEXT,
      rating INTEGER,
      rating_comment TEXT,
      FOREIGN KEY (kb_article_id) REFERENCES knowledge_base(id) ON DELETE SET NULL
    );

    CREATE TABLE IF NOT EXISTS ticket_messages (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      ticket_id INTEGER NOT NULL,
      sender_role TEXT NOT NULL,
      sender_name TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
    );
  `);

  seedKnowledgeBase();
  seedInitialTickets();
}

function seedKnowledgeBase(): void {
  const countRow = db.prepare('SELECT COUNT(*) as cnt FROM knowledge_base').get() as { cnt: number };
  if (countRow.cnt > 0) return;

  const articles: Array<Omit<KnowledgeBaseArticle, 'id'>> = [
    {
      code: 'KB-ACC-001',
      category: 'Accesos y Cuentas',
      subcategory: 'Contraseñas y MFA',
      title: 'Desbloqueo de cuenta corporativa y sincronización de código MFA',
      symptoms: 'Usuario bloqueado tras intentos fallidos o rechazo del código de autenticación de doble factor.',
      solution_steps:
        '1. Verifique que la hora y zona horaria del dispositivo móvil estén configuradas en modo automático.\n2. Espere 15 minutos si superó 5 intentos fallidos o solicite reinicio temporal de bloqueo desde el portal de identidad.\n3. En Microsoft Authenticator o Google Authenticator, utilice la opción de sincronización de hora.\n4. Genere una nueva contraseña cumpliendo mínimo 12 caracteres, mayúsculas, números y símbolo.\n5. Si perdió acceso al teléfono MFA, escale para emitir códigos de respaldo temporales.',
      keywords: 'contraseña,clave,bloqueo,mfa,doble factor,authenticator,token,acceso',
      updated_at: '2026-11-10 09:00:00',
    },
    {
      code: 'KB-ACC-002',
      category: 'Accesos y Cuentas',
      subcategory: 'Permisos y Carpetas',
      title: 'Asignación de permisos a carpetas compartidas y grupos de distribución',
      symptoms: 'Error "Acceso denegado" al intentar abrir un recurso de red o ausencia en lista de correo departamental.',
      solution_steps:
        '1. Confirme la ruta UNC exacta de la carpeta compartida (ej. \\\\servidor\\finanzas) o el correo del grupo.\n2. Verifique que el usuario pertenezca a la unidad organizativa correspondiente.\n3. Valide la aprobación del supervisor del área propietaria del recurso.\n4. Agregue al usuario al grupo de seguridad de lectura/escritura y solicite cerrar sesión y volver a iniciar para refrescar el token Kerberos.',
      keywords: 'permisos,carpeta,compartida,grupo,correo,acceso denegado,red,unidad',
      updated_at: '2026-11-10 09:15:00',
    },
    {
      code: 'KB-ACC-003',
      category: 'Accesos y Cuentas',
      subcategory: 'Altas / Bajas (Onboarding)',
      title: 'Aprovisionamiento de usuario nuevo ingreso y estación de trabajo',
      symptoms: 'Solicitud de creación de credenciales corporativas, buzón de correo y preparación de laptop.',
      solution_steps:
        '1. Recopile nombre completo, cédula, cargo, departamento y fecha de ingreso validada por Recursos Humanos.\n2. Cree la cuenta nominal en el directorio activo y asigne licencias base de suite ofimática.\n3. Configure el perfil estándar del equipo con antivirus corporativo y cliente VPN.\n4. Entregue credenciales temporales con cambio obligatorio en el primer inicio de sesión.',
      keywords: 'onboarding,nuevo ingreso,alta,baja,usuario nuevo,equipo,creacion',
      updated_at: '2026-11-10 09:30:00',
    },
    {
      code: 'KB-SW-001',
      category: 'Software y Aplicaciones',
      subcategory: 'Sistema Operativo',
      title: 'Diagnóstico de pantalla azul (BSOD) y fallos tras actualización de Windows',
      symptoms: 'Reinicio inesperado con código de detención, lentitud extrema o error al arrancar tras Windows Update.',
      solution_steps:
        '1. Anote el código de error mostrado en la pantalla azul (ej. CRITICAL_PROCESS_DIED o INACCESSIBLE_BOOT_DEVICE).\n2. Inicie en Modo Seguro manteniendo Shift + Reiniciar y desinstale la última actualización de calidad reciente.\n3. Ejecute desde símbolo del sistema como administrador: sfc /scannow seguido de DISM /Online /Cleanup-Image /RestoreHealth.\n4. Actualice controladores de video y almacenamiento desde el portal oficial del fabricante.',
      keywords: 'pantalla azul,bsod,windows,arranque,actualizacion,error sistema,lento,cuelgue',
      updated_at: '2026-11-11 10:00:00',
    },
    {
      code: 'KB-SW-002',
      category: 'Software y Aplicaciones',
      subcategory: 'Herramientas de Oficina',
      title: 'Reparación de errores en hojas de cálculo, correo Outlook y suite ofimática',
      symptoms: 'Excel o Word se cierran inesperadamente, o Outlook no sincroniza correos nuevos.',
      solution_steps:
        '1. Cierre todas las aplicaciones de oficina abiertas y verifique en el Administrador de Tareas que no queden procesos colgados.\n2. Inicie la aplicación en modo seguro (ej. winword /safe o excel /safe) para descartar complementos defectuosos.\n3. Si el problema persiste en Outlook, cree un nuevo perfil de correo o repare el archivo OST con SCANPST.\n4. Ejecute la "Reparación rápida" desde Panel de Control > Programas > Microsoft 365 / LibreOffice.',
      keywords: 'excel,word,outlook,correo,oficina,hoja de calculo,office,cierra,sincroniza',
      updated_at: '2026-11-11 10:30:00',
    },
    {
      code: 'KB-SW-003',
      category: 'Software y Aplicaciones',
      subcategory: 'Instalación / Licencias',
      title: 'Instalación de software autorizado y renovación de licencias corporativas',
      symptoms: 'Aviso de licencia expirada o solicitud de instalación de herramienta aprobada por TI.',
      solution_steps:
        '1. Verifique que el software solicitado forme parte del catálogo autorizado de la empresa.\n2. Cierre la aplicación actual y verifique si requiere desinstalación previa de versiones obsoletas.\n3. Instale mediante el repositorio interno o paquete firmado y valide la activación con la cuenta corporativa.\n4. Registre el número de serie o licencia asignada en el inventario de activos.',
      keywords: 'instalar,licencia,software,programa,activacion,renovacion,pdf,autocad',
      updated_at: '2026-11-11 11:00:00',
    },
    {
      code: 'KB-HW-001',
      category: 'Hardware y Periféricos',
      subcategory: 'Computadora / Laptop',
      title: 'Equipo no enciende, sin señal de video o sobrecalentamiento térmico',
      symptoms: 'La laptop o PC no responde al botón de encendido, pantalla negra con ventilador girando o apagado térmico.',
      solution_steps:
        '1. Desconecte cargador, cables USB y monitores externos; mantenga presionado el botón de encendido por 20 segundos para drenar estática.\n2. Conecte únicamente el cargador original directo a la toma eléctrica y verifique el LED de carga.\n3. Si enciende pero no da video, pruebe conectar un monitor externo para descartar falla de pantalla interna.\n4. Revise que las rejillas de ventilación no estén obstruidas; si hay ruido anormal o temperatura crítica, escale a soporte físico.',
      keywords: 'enciende,prende,laptop,computadora,video,pantalla negra,calienta,sobrecalentamiento,bateria',
      updated_at: '2026-11-12 08:45:00',
    },
    {
      code: 'KB-HW-002',
      category: 'Hardware y Periféricos',
      subcategory: 'Impresoras y Escáneres',
      title: 'Resolución de impresora fuera de línea, atascos de papel y cola bloqueada',
      symptoms: 'Los documentos quedan en "Imprimiendo" o estado "Sin conexión", o el equipo reporta atasco en bandeja.',
      solution_steps:
        '1. Verifique alimentación eléctrica, conexión USB o dirección IP de la impresora en la red local.\n2. Abra la compuerta frontal/trasera con el equipo apagado y retire suavemente cualquier papel atascado en dirección del rodillo.\n3. En Windows, abra services.msc y reinicie el servicio "Cola de impresión" (Print Spooler).\n4. Elimine documentos atascados en la cola y envíe una página de prueba.',
      keywords: 'impresora,escaner,papel,atasco,toner,fuera de linea,cola de impresion,imprimir',
      updated_at: '2026-11-12 09:20:00',
    },
    {
      code: 'KB-HW-003',
      category: 'Hardware y Periféricos',
      subcategory: 'Accesorios',
      title: 'Diagnóstico y reemplazo de teclado, ratón, cargador o monitor',
      symptoms: 'Teclas que no responden, cursor errático, cable de cargador dañado o parpadeo de monitor.',
      solution_steps:
        '1. Pruebe el periférico en otro puerto USB o verifique el estado de las baterías en dispositivos inalámbricos.\n2. Revise el cableado de alimentación/HDMI para descartar falsos contactos.\n3. Pruebe el accesorio en otro equipo para confirmar fallo físico del periférico.\n4. Si se confirma falla física, proceda con reemplazo estándar desde almacén de soporte técnico.',
      keywords: 'teclado,raton,mouse,cargador,monitor,usb,cable,accesorio,reemplazo',
      updated_at: '2026-11-12 10:00:00',
    },
    {
      code: 'KB-RED-001',
      category: 'Redes y Conectividad',
      subcategory: 'Internet / Wi-Fi / LAN',
      title: 'Pérdida de conectividad Wi-Fi, cableada (LAN) o resolución DNS',
      symptoms: 'Navegador sin acceso a internet, icono de red con advertencia o desconexiones intermitentes.',
      solution_steps:
        '1. Compruebe si otros usuarios en la misma área presentan el fallo para determinar si es incidente masivo o local.\n2. Verifique el cable Ethernet (LED de enlace en puerto) o desconecte y reconecte la red Wi-Fi corporativa.\n3. Ejecute en consola: ipconfig /release, ipconfig /renew y ipconfig /flushdns.\n4. Realice ping a la puerta de enlace y a 8.8.8.8; si responde IP pero no dominios, verifique configuración DNS.',
      keywords: 'internet,wifi,wi-fi,lan,red,cable,dns,sin conexion,desconexion,lento',
      updated_at: '2026-11-13 14:00:00',
    },
    {
      code: 'KB-RED-002',
      category: 'Redes y Conectividad',
      subcategory: 'Acceso Remoto (VPN)',
      title: 'Solución a errores de conexión o autenticación en cliente VPN corporativo',
      symptoms: 'El túnel VPN se queda conectando, rechaza credenciales o no permite alcanzar servidores internos.',
      solution_steps:
        '1. Verifique que su conexión a internet doméstica o móvil sea estable antes de iniciar la VPN.\n2. Confirme que el usuario y contraseña estén vigentes y apruebe la notificación MFA en su dispositivo.\n3. Reinicie el cliente VPN y seleccione el gateway alterno si está disponible.\n4. Si el cliente arroja error de certificado o adaptador virtual, reinicie el equipo o reinstale el perfil VPN.',
      keywords: 'vpn,remoto,tunel,teletrabajo,certificado,autenticacion,conectar',
      updated_at: '2026-11-13 15:10:00',
    },
    {
      code: 'KB-SEG-001',
      category: 'Seguridad Informática',
      subcategory: 'Phishing / Malware',
      title: 'Protocolo de contención ante correo sospechoso (Phishing) o alerta de malware',
      symptoms: 'Recepción de enlace fraudulento, ingreso accidental de credenciales o detección de amenaza por antivirus.',
      solution_steps:
        '1. NO abra enlaces ni descargue adjuntos del correo sospechoso; si ya hizo clic, desconecte el equipo de la red Wi-Fi/LAN de inmediato.\n2. No apague el equipo bruscamente para preservar evidencia en memoria si hubo ejecución.\n3. Ejecute un análisis completo con el antivirus corporativo (EDR/Defender).\n4. Si ingresó su contraseña en un sitio dudoso, cambie la clave inmediatamente y escale a Seguridad Informática (Humano).',
      keywords: 'phishing,virus,malware,correo sospechoso,fraude,seguridad,alerta,antivirus,ransomware',
      updated_at: '2026-11-14 08:30:00',
    },
    {
      code: 'KB-RES-001',
      category: 'Respaldos y Datos',
      subcategory: 'Recuperación de Archivos',
      title: 'Restauración de archivos o carpetas eliminadas desde copias de seguridad',
      symptoms: 'Archivo borrado accidentalmente de equipo local, OneDrive/SharePoint o servidor compartido.',
      solution_steps:
        '1. Revise primero la Papelera de reciclaje local o la Papelera de segundo nivel en almacenamiento en la nube.\n2. Para carpetas de red, haga clic derecho en la carpeta superior > Propiedades > Versiones anteriores para restaurar una instantánea previa.\n3. No sobrescriba nuevos archivos con el mismo nombre en la ruta afectada.\n4. Indique ruta exacta, nombre del archivo y fecha aproximada de la última versión válida para restaurar desde respaldo.',
      keywords: 'recuperar,archivo,eliminado,borrado,respaldo,backup,carpeta,version anterior,restaurar',
      updated_at: '2026-11-14 11:00:00',
    },
  ];

  const insert = db.prepare(`
    INSERT INTO knowledge_base (code, category, subcategory, title, symptoms, solution_steps, keywords, updated_at)
    VALUES (@code, @category, @subcategory, @title, @symptoms, @solution_steps, @keywords, @updated_at)
  `);

  const tx = db.transaction((rows: Array<Omit<KnowledgeBaseArticle, 'id'>>) => {
    for (const row of rows) {
      insert.run(row);
    }
  });
  tx(articles);
}

function seedInitialTickets(): void {
  const countRow = db.prepare('SELECT COUNT(*) as cnt FROM tickets').get() as { cnt: number };
  if (countRow.cnt > 0) return;

  const kbRows = db.prepare('SELECT id, code, title FROM knowledge_base').all() as Array<{
    id: number;
    code: string;
    title: string;
  }>;
  const kbByCode = new Map<string, { id: number; title: string }>();
  for (const row of kbRows) {
    kbByCode.set(row.code, { id: row.id, title: row.title });
  }

  const mkSuggestion = (
    kbCode: string,
    diagnosis: string,
    steps: string[],
    preventiveTip: string,
    suggestEscalation = false
  ): string => {
    const kb = kbByCode.get(kbCode);
    const payload: AgentStructuredSuggestion = {
      diagnosis,
      steps,
      preventiveTip,
      matchedKbId: kb?.id ?? null,
      matchedKbTitle: kb?.title ?? null,
      confidenceLabel: kb ? 'Alta coincidencia en KB' : 'Diagnóstico general',
      suggestEscalation,
    };
    return JSON.stringify(payload);
  };

  const sampleTickets = [
    {
      ticket_code: 'STV-2026-0001',
      reporter_name: 'Mariana Mendoza',
      reporter_email: 'm.mendoza@soportech.ve',
      department: 'Administración y Finanzas',
      category: 'Accesos y Cuentas',
      subcategory: 'Contraseñas y MFA',
      ticket_type: 'Incidencia',
      priority: 'Alta',
      subject: 'Bloqueo de cuenta tras cambio de teléfono MFA',
      description: 'Cambié de teléfono celular y la aplicación de autenticación ya no genera códigos válidos para ingresar al ERP contable.',
      status: 'Resuelto',
      created_at: '2026-11-18 08:30:00',
      first_response_at: '2026-11-18 08:32:00',
      resolved_at: '2026-11-18 08:48:00',
      ai_suggestion_json: mkSuggestion(
        'KB-ACC-001',
        'El token MFA anterior permanece vinculado al dispositivo previo y requiere resincronización o código de respaldo.',
        [
          'Verifique si conserva acceso a la sesión activa en el navegador para generar códigos de recuperación.',
          'Sincronice la hora del nuevo teléfono en modo automático.',
          'Registre el nuevo dispositivo desde el portal de seguridad corporativo.',
        ],
        'Guarde sus códigos de respaldo MFA en el gestor corporativo autorizado antes de cambiar de dispositivo.'
      ),
      kb_article_id: kbByCode.get('KB-ACC-001')?.id ?? null,
      escalated_to_human: 0,
      escalation_notes: null,
      rating: 5,
      rating_comment: 'Excelente guía paso a paso, pude reactivar mi acceso en minutos.',
    },
    {
      ticket_code: 'STV-2026-0002',
      reporter_name: 'Carlos Rondón',
      reporter_email: 'c.rondon@soportech.ve',
      department: 'Operaciones y Logística',
      category: 'Hardware y Periféricos',
      subcategory: 'Impresoras y Escáneres',
      ticket_type: 'Incidencia',
      priority: 'Media',
      subject: 'Impresora HP del área de despacho aparece fuera de línea',
      description: 'Enviamos guías de despacho desde tres computadoras pero la impresora de red muestra estado Sin conexión.',
      status: 'Resuelto',
      created_at: '2026-11-18 10:15:00',
      first_response_at: '2026-11-18 10:17:00',
      resolved_at: '2026-11-18 10:42:00',
      ai_suggestion_json: mkSuggestion(
        'KB-HW-002',
        'El servicio de cola de impresión o la asignación IP de red de la impresora perdió comunicación.',
        [
          'Confirme que el cable de red de la impresora tenga luz de enlace encendida.',
          'Reinicie el servicio Cola de impresión (Print Spooler) en el equipo principal.',
          'Limpie los trabajos pendientes y envíe una página de prueba.',
        ],
        'Mantenga asignada una IP estática en el servidor DHCP para las impresoras departamentales.'
      ),
      kb_article_id: kbByCode.get('KB-HW-002')?.id ?? null,
      escalated_to_human: 0,
      escalation_notes: null,
      rating: 4,
      rating_comment: 'Se resolvió tras reiniciar el spooler y verificar el cable Ethernet.',
    },
    {
      ticket_code: 'STV-2026-0003',
      reporter_name: 'Valeria Briceño',
      reporter_email: 'v.briceno@soportech.ve',
      department: 'Ventas y Comercial',
      category: 'Redes y Conectividad',
      subcategory: 'Acceso Remoto (VPN)',
      ticket_type: 'Incidencia',
      priority: 'Alta',
      subject: 'VPN se desconecta al intentar abrir el CRM remoto',
      description: 'Al conectarme desde casa la VPN conecta pero a los 30 segundos se cae y arroja error de tiempo de espera.',
      status: 'Resuelto',
      created_at: '2026-11-19 09:05:00',
      first_response_at: '2026-11-19 09:08:00',
      resolved_at: '2026-11-19 09:38:00',
      ai_suggestion_json: mkSuggestion(
        'KB-RED-002',
        'Inestabilidad en el túnel VPN por selección de gateway saturado o caché DNS desactualizada.',
        [
          'Cierre el cliente VPN y ejecute ipconfig /flushdns.',
          'Cambie al gateway secundario configurado en el perfil corporativo.',
          'Valide que no tenga otra VPN personal activa simultáneamente.',
        ],
        'Utilice el gateway de respaldo cuando trabaje fuera de horario de oficina.'
      ),
      kb_article_id: kbByCode.get('KB-RED-002')?.id ?? null,
      escalated_to_human: 0,
      escalation_notes: null,
      rating: 5,
      rating_comment: 'Cambiar al gateway alterno estabilizó la conexión de inmediato.',
    },
    {
      ticket_code: 'STV-2026-0004',
      reporter_name: 'José Gregorio Páez',
      reporter_email: 'j.paez@soportech.ve',
      department: 'Atención al Cliente',
      category: 'Software y Aplicaciones',
      subcategory: 'Herramientas de Oficina',
      ticket_type: 'Incidencia',
      priority: 'Media',
      subject: 'Excel se cierra al abrir reportes mensuales con macros',
      description: 'Cada vez que intento abrir el libro de cierre mensual con macros, Excel deja de responder y se cierra.',
      status: 'En Atención',
      created_at: '2026-11-19 14:20:00',
      first_response_at: '2026-11-19 14:22:00',
      resolved_at: null,
      ai_suggestion_json: mkSuggestion(
        'KB-SW-002',
        'Conflicto con complementos COM o corrupción en la caché de macros del perfil de Office.',
        [
          'Abra Excel en modo seguro ejecutando "excel /safe".',
          'Desactive temporalmente complementos no esenciales en Archivo > Opciones > Complementos.',
          'Ejecute la Reparación rápida de Microsoft 365 si el cierre persiste.',
        ],
        'Evite abrir archivos pesados directamente desde adjuntos de correo; guárdelos primero en local.'
      ),
      kb_article_id: kbByCode.get('KB-SW-002')?.id ?? null,
      escalated_to_human: 0,
      escalation_notes: null,
      rating: null,
      rating_comment: null,
    },
    {
      ticket_code: 'STV-2026-0005',
      reporter_name: 'Andrea Urdaneta',
      reporter_email: 'a.urdaneta@soportech.ve',
      department: 'Legal y Cumplimiento',
      category: 'Hardware y Periféricos',
      subcategory: 'Computadora / Laptop',
      ticket_type: 'Incidencia',
      priority: 'Alta',
      subject: 'Laptop corporativa no da imagen tras golpe leve en maletín',
      description: 'Al encender la laptop los LEDs prenden y suena el ventilador pero la pantalla permanece totalmente negra.',
      status: 'Escalado a Humano',
      created_at: '2026-11-20 07:45:00',
      first_response_at: '2026-11-20 07:47:00',
      resolved_at: null,
      ai_suggestion_json: mkSuggestion(
        'KB-HW-001',
        'Posible desconexión física del flex de video o daño en el panel LCD tras impacto mecánico.',
        [
          'Conecte un monitor externo por HDMI para verificar si el sistema operativo arranca correctamente.',
          'Realice un drenaje de energía manteniendo el botón de encendido 20 segundos sin cargador.',
          'Al tratarse de posible daño físico interno, escale a soporte técnico presencial.',
        ],
        'Transporte los equipos portátiles únicamente en compartimentos acolchados sin presión externa.',
        true
      ),
      kb_article_id: kbByCode.get('KB-HW-001')?.id ?? null,
      escalated_to_human: 1,
      escalation_notes: 'Escalado a taller técnico de TI para revisión física del conector flex y pantalla.',
      rating: null,
      rating_comment: null,
    },
  ];

  const insertTicket = db.prepare(`
    INSERT INTO tickets (
      ticket_code, reporter_name, reporter_email, department, category, subcategory,
      ticket_type, priority, subject, description, status, created_at, first_response_at,
      resolved_at, ai_suggestion_json, kb_article_id, escalated_to_human, escalation_notes,
      rating, rating_comment
    ) VALUES (
      @ticket_code, @reporter_name, @reporter_email, @department, @category, @subcategory,
      @ticket_type, @priority, @subject, @description, @status, @created_at, @first_response_at,
      @resolved_at, @ai_suggestion_json, @kb_article_id, @escalated_to_human, @escalation_notes,
      @rating, @rating_comment
    )
  `);

  const insertMsg = db.prepare(`
    INSERT INTO ticket_messages (ticket_id, sender_role, sender_name, content, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  const tx = db.transaction(() => {
    for (const t of sampleTickets) {
      const info = insertTicket.run(t);
      const ticketId = Number(info.lastInsertRowid);
      insertMsg.run(
        ticketId,
        'user',
        t.reporter_name,
        t.description,
        t.created_at
      );
      if (t.ai_suggestion_json) {
        const parsed = JSON.parse(t.ai_suggestion_json) as AgentStructuredSuggestion;
        insertMsg.run(
          ticketId,
          'agent',
          'AgentDesk IA',
          `${parsed.diagnosis}\n\nPasos recomendados:\n${parsed.steps.map((s, i) => `${i + 1}. ${s}`).join('\n')}`,
          t.first_response_at ?? t.created_at
        );
      }
      if (t.escalated_to_human && t.escalation_notes) {
        insertMsg.run(
          ticketId,
          'human_support',
          'Mesa de Soporte Nivel 2',
          t.escalation_notes,
          t.first_response_at ?? t.created_at
        );
      }
    }
  });
  tx();
}

export function formatSqlDateTime(date = new Date()): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`;
}

export function generateNextTicketCode(): string {
  const year = new Date().getFullYear();
  const row = db.prepare('SELECT MAX(id) as maxId FROM tickets').get() as { maxId: number | null };
  const nextNum = (row.maxId ?? 0) + 1;
  return `STV-${year}-${String(nextNum).padStart(4, '0')}`;
}

export function getDashboardStats(): DashboardStats {
  const totals = db
    .prepare(
      `
      SELECT
        COUNT(*) as totalTickets,
        SUM(CASE WHEN status = 'Resuelto' THEN 1 ELSE 0 END) as resolvedTickets,
        SUM(CASE WHEN status != 'Resuelto' THEN 1 ELSE 0 END) as openTickets,
        SUM(CASE WHEN status = 'Escalado a Humano' THEN 1 ELSE 0 END) as escalatedTickets,
        AVG(
          CASE
            WHEN first_response_at IS NOT NULL
            THEN (julianday(first_response_at) - julianday(created_at)) * 1440.0
            ELSE NULL
          END
        ) as avgAttentionMinutes,
        AVG(
          CASE
            WHEN resolved_at IS NOT NULL
            THEN (julianday(resolved_at) - julianday(created_at)) * 1440.0
            ELSE NULL
          END
        ) as avgResolutionMinutes,
        AVG(CASE WHEN rating IS NOT NULL THEN CAST(rating AS REAL) ELSE NULL END) as avgRating,
        SUM(CASE WHEN rating IS NOT NULL THEN 1 ELSE 0 END) as ratedCount
      FROM tickets
    `
    )
    .get() as {
    totalTickets: number;
    resolvedTickets: number;
    openTickets: number;
    escalatedTickets: number;
    avgAttentionMinutes: number | null;
    avgResolutionMinutes: number | null;
    avgRating: number | null;
    ratedCount: number;
  };

  const byCategory = db
    .prepare(
      `
      SELECT
        category,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'Resuelto' THEN 1 ELSE 0 END) as resolved
      FROM tickets
      GROUP BY category
      ORDER BY total DESC
    `
    )
    .all() as Array<{ category: string; total: number; resolved: number }>;

  const byDepartment = db
    .prepare(
      `
      SELECT department, COUNT(*) as total
      FROM tickets
      GROUP BY department
      ORDER BY total DESC
    `
    )
    .all() as Array<{ department: string; total: number }>;

  const byPriority = db
    .prepare(
      `
      SELECT priority, COUNT(*) as total
      FROM tickets
      GROUP BY priority
      ORDER BY total DESC
    `
    )
    .all() as Array<{ priority: string; total: number }>;

  const recentTickets = db
    .prepare('SELECT * FROM tickets ORDER BY datetime(created_at) DESC, id DESC LIMIT 12')
    .all() as Ticket[];

  const total = totals.totalTickets || 0;
  const resolved = totals.resolvedTickets || 0;

  return {
    totalTickets: total,
    resolvedTickets: resolved,
    openTickets: totals.openTickets || 0,
    escalatedTickets: totals.escalatedTickets || 0,
    avgAttentionMinutes: totals.avgAttentionMinutes ? Number(totals.avgAttentionMinutes.toFixed(1)) : 0,
    avgResolutionMinutes: totals.avgResolutionMinutes ? Number(totals.avgResolutionMinutes.toFixed(1)) : 0,
    avgRating: totals.avgRating ? Number(totals.avgRating.toFixed(2)) : null,
    ratedCount: totals.ratedCount || 0,
    resolutionRate: total > 0 ? Math.round((resolved / total) * 100) : 0,
    byCategory,
    byDepartment,
    byPriority,
    recentTickets,
  };
}

export function listTickets(filters: {
  status?: string;
  category?: string;
  department?: string;
  search?: string;
}): Ticket[] {
  const conditions: string[] = [];
  const params: Record<string, string> = {};

  if (filters.status && filters.status !== 'Todos') {
    conditions.push('status = @status');
    params.status = filters.status;
  }
  if (filters.category && filters.category !== 'Todas') {
    conditions.push('category = @category');
    params.category = filters.category;
  }
  if (filters.department && filters.department !== 'Todos') {
    conditions.push('department = @department');
    params.department = filters.department;
  }
  if (filters.search && filters.search.trim()) {
    conditions.push(
      '(ticket_code LIKE @search OR subject LIKE @search OR reporter_name LIKE @search OR description LIKE @search OR subcategory LIKE @search)'
    );
    params.search = `%${filters.search.trim()}%`;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return db
    .prepare(`SELECT * FROM tickets ${whereClause} ORDER BY datetime(created_at) DESC, id DESC`)
    .all(params) as Ticket[];
}

export function getTicketById(id: number): Ticket | undefined {
  return db.prepare('SELECT * FROM tickets WHERE id = ?').get(id) as Ticket | undefined;
}

export function getTicketMessages(ticketId: number): TicketMessage[] {
  return db
    .prepare('SELECT * FROM ticket_messages WHERE ticket_id = ? ORDER BY datetime(created_at) ASC, id ASC')
    .all(ticketId) as TicketMessage[];
}

export function getKnowledgeArticleById(id: number | null): KnowledgeBaseArticle | null {
  if (!id) return null;
  const row = db.prepare('SELECT * FROM knowledge_base WHERE id = ?').get(id) as
    | KnowledgeBaseArticle
    | undefined;
  return row ?? null;
}

export function searchKnowledgeBase(query?: string, category?: string): KnowledgeBaseArticle[] {
  const conditions: string[] = [];
  const params: Record<string, string> = {};

  if (category && category !== 'Todas') {
    conditions.push('category = @category');
    params.category = category;
  }
  if (query && query.trim()) {
    conditions.push(
      '(title LIKE @q OR symptoms LIKE @q OR solution_steps LIKE @q OR keywords LIKE @q OR subcategory LIKE @q OR code LIKE @q)'
    );
    params.q = `%${query.trim()}%`;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
  return db
    .prepare(`SELECT * FROM knowledge_base ${whereClause} ORDER BY category ASC, code ASC`)
    .all(params) as KnowledgeBaseArticle[];
}

export function findRelevantKbArticles(
  category: string,
  subcategory: string,
  text: string
): KnowledgeBaseArticle[] {
  const allArticles = db.prepare('SELECT * FROM knowledge_base').all() as KnowledgeBaseArticle[];
  const tokens = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter((w) => w.length >= 3);

  const scored = allArticles.map((article) => {
    let score = 0;
    if (article.subcategory === subcategory) score += 12;
    if (article.category === category) score += 6;
    const haystack = `${article.title} ${article.symptoms} ${article.keywords} ${article.solution_steps}`.toLowerCase();
    for (const token of tokens) {
      if (haystack.includes(token)) score += 2;
    }
    return { article, score };
  });

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, 3)
    .map((item) => item.article);
}

export function createTicketRecord(input: {
  reporter_name: string;
  reporter_email: string;
  department: string;
  category: string;
  subcategory: string;
  ticket_type: string;
  priority: string;
  subject: string;
  description: string;
}): Ticket {
  const ticketCode = generateNextTicketCode();
  const createdAt = formatSqlDateTime(new Date());

  const info = db
    .prepare(
      `
      INSERT INTO tickets (
        ticket_code, reporter_name, reporter_email, department, category, subcategory,
        ticket_type, priority, subject, description, status, created_at
      ) VALUES (
        @ticket_code, @reporter_name, @reporter_email, @department, @category, @subcategory,
        @ticket_type, @priority, @subject, @description, 'Abierto', @created_at
      )
    `
    )
    .run({
      ticket_code: ticketCode,
      reporter_name: input.reporter_name.trim(),
      reporter_email: input.reporter_email.trim(),
      department: input.department,
      category: input.category,
      subcategory: input.subcategory,
      ticket_type: input.ticket_type,
      priority: input.priority,
      subject: input.subject.trim(),
      description: input.description.trim(),
      created_at: createdAt,
    });

  const ticketId = Number(info.lastInsertRowid);
  db.prepare(
    'INSERT INTO ticket_messages (ticket_id, sender_role, sender_name, content, created_at) VALUES (?, ?, ?, ?, ?)'
  ).run(ticketId, 'user', input.reporter_name.trim(), input.description.trim(), createdAt);

  return getTicketById(ticketId)!;
}

export function saveAgentSuggestion(
  ticketId: number,
  suggestion: AgentStructuredSuggestion
): Ticket {
  const now = formatSqlDateTime(new Date());
  const existing = getTicketById(ticketId);
  const firstResponseAt = existing?.first_response_at ?? now;
  const nextStatus = existing?.status === 'Abierto' ? 'En Atención' : existing?.status ?? 'En Atención';

  db.prepare(
    `
    UPDATE tickets
    SET ai_suggestion_json = ?,
        kb_article_id = ?,
        first_response_at = ?,
        status = ?
    WHERE id = ?
  `
  ).run(
    JSON.stringify(suggestion),
    suggestion.matchedKbId,
    firstResponseAt,
    nextStatus,
    ticketId
  );

  const formattedMessage = `${suggestion.diagnosis}\n\nPasos sugeridos:\n${suggestion.steps
    .map((step, i) => `${i + 1}. ${step}`)
    .join('\n')}\n\nRecomendación preventiva: ${suggestion.preventiveTip}`;

  db.prepare(
    'INSERT INTO ticket_messages (ticket_id, sender_role, sender_name, content, created_at) VALUES (?, ?, ?, ?, ?)'
  ).run(ticketId, 'agent', 'AgentDesk IA', formattedMessage, now);

  return getTicketById(ticketId)!;
}

export function addTicketMessage(
  ticketId: number,
  senderRole: 'user' | 'agent' | 'human_support',
  senderName: string,
  content: string
): TicketMessage {
  const now = formatSqlDateTime(new Date());
  const info = db
    .prepare(
      'INSERT INTO ticket_messages (ticket_id, sender_role, sender_name, content, created_at) VALUES (?, ?, ?, ?, ?)'
    )
    .run(ticketId, senderRole, senderName, content, now);

  return db
    .prepare('SELECT * FROM ticket_messages WHERE id = ?')
    .get(Number(info.lastInsertRowid)) as TicketMessage;
}

export function escalateTicketToHuman(ticketId: number, notes?: string): Ticket {
  const now = formatSqlDateTime(new Date());
  const escalationNote =
    notes && notes.trim()
      ? notes.trim()
      : 'Caso escalado por el usuario a un especialista humano de Mesa de Ayuda Nivel 2 para atención directa.';

  const existing = getTicketById(ticketId);
  const firstResponseAt = existing?.first_response_at ?? now;

  db.prepare(
    `
    UPDATE tickets
    SET status = 'Escalado a Humano',
        escalated_to_human = 1,
        escalation_notes = ?,
        first_response_at = ?
    WHERE id = ?
  `
  ).run(escalationNote, firstResponseAt, ticketId);

  addTicketMessage(
    ticketId,
    'human_support',
    'Mesa de Soporte Nivel 2',
    `Ticket escalado a agente humano. ${escalationNote}`,
  );

  return getTicketById(ticketId)!;
}

export function resolveTicketWithRating(
  ticketId: number,
  rating: number,
  ratingComment?: string
): Ticket {
  const now = formatSqlDateTime(new Date());
  const existing = getTicketById(ticketId);
  const firstResponseAt = existing?.first_response_at ?? now;

  db.prepare(
    `
    UPDATE tickets
    SET status = 'Resuelto',
        resolved_at = ?,
        first_response_at = ?,
        rating = ?,
        rating_comment = ?
    WHERE id = ?
  `
  ).run(now, firstResponseAt, rating, ratingComment?.trim() || null, ticketId);

  return getTicketById(ticketId)!;
}

export function createKnowledgeArticle(input: {
  category: string;
  subcategory: string;
  title: string;
  symptoms: string;
  solution_steps: string;
  keywords: string;
}): KnowledgeBaseArticle {
  const countRow = db.prepare('SELECT MAX(id) as maxId FROM knowledge_base').get() as {
    maxId: number | null;
  };
  const nextNum = (countRow.maxId ?? 0) + 1;
  const code = `KB-USR-${String(nextNum).padStart(3, '0')}`;
  const updatedAt = formatSqlDateTime(new Date());

  const info = db
    .prepare(
      `
      INSERT INTO knowledge_base (code, category, subcategory, title, symptoms, solution_steps, keywords, updated_at)
      VALUES (@code, @category, @subcategory, @title, @symptoms, @solution_steps, @keywords, @updated_at)
    `
    )
    .run({
      code,
      category: input.category,
      subcategory: input.subcategory,
      title: input.title.trim(),
      symptoms: input.symptoms.trim(),
      solution_steps: input.solution_steps.trim(),
      keywords: input.keywords.trim(),
      updated_at: updatedAt,
    });

  return db
    .prepare('SELECT * FROM knowledge_base WHERE id = ?')
    .get(Number(info.lastInsertRowid)) as KnowledgeBaseArticle;
}

export function deleteKnowledgeArticle(id: number): boolean {
  const res = db.prepare('DELETE FROM knowledge_base WHERE id = ?').run(id);
  return res.changes > 0;
}

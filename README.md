# Help Desk SPA

Aplicación web tipo **Single Page Application (SPA)** minimalista para gestión de mesa de ayuda y soporte técnico TI a usuarios y computadoras corporativas, con persistencia local en **SQLite** y asistencia inteligente mediante **AgentDesk** conectado a una Base de Conocimientos interna.

## Características Principales

- **Panel de Estadísticas (Dashboard)**:
  - Casos reportados, casos resueltos, casos abiertos o pendientes, tiempo promedio de atención y tiempo promedio de resolución.
  - Distribución por categoría ITIL, demanda por unidad organizativa y calificación promedio de satisfacción (CSAT).
- **Registro de Casos / Reporte de Fallas**:
  - Selección de usuario, correo corporativo, unidad organizativa o departamento, categoría y subcategoría basada en matriz ITIL.
  - Asignación automática de identificador único (`STV-YYYY-XXXX`), fecha/hora exacta, tipo (`Incidencia` / `Requerimiento`) y prioridad sugerida.
- **Agente Inteligente (AgentDesk) + Base de Conocimientos SQLite**:
  - Consulta automáticamente los artículos técnicos almacenados en la tabla `knowledge_base` de `soportech.db` y genera un diagnóstico estructurado con pasos de resolución.
  - Chat de seguimiento en el ticket y opción para **Escalar a un agente de Soporte (humano)**.
- **Cierre y Evaluación de 5 Estrellas**:
  - Escala de calificación de 1 a 5 estrellas (`1 = Sin solución`, `3 = Medianamente satisfactoria`, `5 = Satisfactorio / Resuelto`) con registro de comentario de cierre.

## Requisitos de Ejecución Local

- **Node.js** `v20+` (recomendado `v22+`)
- **npm**

## Instalación y Arranque Local

1. Clonar o descargar el repositorio y abrir la carpeta en Visual Studio Code.
2. Instalar dependencias:
   ```bash
   npm install
   ```
3. Configurar la variable de entorno `GEMINI_API_KEY` en un archivo `.env` (basado en `.env.example`) para habilitar las respuestas de AgentDesk.
4. Iniciar el servidor de desarrollo local:
   ```bash
   npm run dev
   ```
5. Abrir en el navegador `http://localhost:3000`.

La base de datos local `soportech.db` se crea e inicializa automáticamente con artículos de conocimiento y casos de ejemplo en el primer arranque.

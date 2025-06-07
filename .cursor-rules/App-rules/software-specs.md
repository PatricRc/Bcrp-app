---
# software-specs.md

## Application Title
**BCRP Macroeconomic Analysis App**

## System Architecture
- **Frontend**: Nxt.js, Tailwind CSS, shadcn/ui, Lucide Icons
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions), Prisma ORM
- **AI Stack**:
  - Gemini 2.5 Pro (Google Cloud) for LLM-based reasoning
  - OpenAI Embeddings stored in Supabase for semantic document retrieval
- **Data Source**: Real-time integration with BCRP API
  - URL: `https://estadisticas.bcrp.gob.pe/estadisticas/series/api/`
  - Methods: `GET`, `POST`
  - Formats: `json`, `csv`, `xml`, `xls`, etc.

## Functional Modules
- **Authentication**: Supabase Auth with JWT token sessions
- **Dashboard**: Static data view of daily indicators on login
- **Explore & Analyze**: Category filtering, multi-indicator selection, Gemini analysis, chart, table, and PDF/CSV export
- **AI Chatbot**: Gemini + RAG-powered chat interface
- **Playground**: Configurable indicator selection with LLM-generated summary, trend, or correlation analysis

## APIs & Endpoints
- **BCRP API Usage**:
  - Series codes used (e.g., `PD04650MD`, `PN38705PM`, `PM04908AA`)
  - Dynamic construction of GET URLs
  - Fallback to Supabase cache when available (no simulation)

## Storage
- **Supabase DB Tables**:
  - `users`, `indicator_results`, `embedding_docs`, `query_logs`
- **Supabase Buckets**:
  - For storing exported PDF/CSV files and document chunks

## Security
- HTTPS enforced
- Supabase RLS for data isolation
- Environment variables secured in `.env`
- Sanitized AI prompts to avoid injection

## Performance Targets
- < 2s response time on indicator queries
- Chart render under 500ms
- PDF generation < 3s

## Limitations
- BCRP API rate-limiting handled via cron or edge retries
- Gemini quota and API cost monitoring required

## Compliance
- Real data enforcement (no mock policy)
- BCRP data attribution and integrity preservation


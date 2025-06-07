---
# techContext.md

## Full Stack Overview

### Frontend
- **Framework**: `Nxt.js` (App Router)
- **Styling**: `Tailwind CSS` + `shadcn/ui`
- **Icons**: `Lucide Icons`

### Backend
- **Database**: `PostgreSQL` via `Supabase`
- **ORM**: `Prisma`
- **Auth**: `Supabase Auth`
- **Functions**: `Supabase Edge Functions`

### AI Services
- **LLM**: `Gemini 2.5 Pro` (via Google Cloud)
- **Embeddings**: `OpenAI Embeddings`
- **RAG Storage**: `Supabase Vector Store` using document chunks

### Data Source
- **Official API**: BCRP Statistical API
  - **Base URL**: `https://estadisticas.bcrp.gob.pe/estadisticas/series/api/`
  - **Methods**: `GET`, `POST`
  - **Formats**: `json`, `csv`, `xml`, `xls`, `html`, `txt`, `jsonp`
  - **Languages**: `esp`, `ing`
  - **Caching Layer**: Only real responses are stored in Supabase; mock data is never used

#### Series in Use

**Daily**
- `PD04650MD`: Reservas internacionales netas
- `PD12301MD`: Tasa de Referencia de la Política Monetaria
- `PD04692MD`: Tasa de Interés Interbancaria, S/
- `PD04693MD`: Tasa de Interés Interbancaria, US$
- `PD38026MD`: Índice General Bursátil BVL (índice)
- `PD04694MD`: Índice General Bursátil BVL (var%)
- `PD04701XD`: Cobre (Londres, cUS$ por libras)
- `PD04704XD`: Oro (Londres, US$ por onzas troy)
- `PD04721XD`: Dow Jones (var%)

**Monthly**
- `PN38705PM`: Índice de Precios al Consumidor (IPC)
- `PN01271PM`: IPC var%
- `PN01496BM`: Exportaciones Total
- `PN02294FM`: Ingresos Tributarios
- `PN38072FM`: Gasto Total del Gobierno General

**Yearly**
- `PM04908AA`: PBI Anual (Nivel)
- `PM05373BA`: PBI Anual (Var%)

### Example API Call
```bash
https://estadisticas.bcrp.gob.pe/estadisticas/series/api/PD04650MD/json/2015-01/2024-12/esp

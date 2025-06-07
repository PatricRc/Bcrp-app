---
# activeContext.md

## Current Development Focus
- **Explore & Analyze Module**: Building an interactive two-column interface with real BCRP indicator selection, live data retrieval, and Gemini-powered summaries and visualizations.
- **AI Chatbot**: Integrating Gemini 2.5 Pro with document retrieval using OpenAI embeddings stored in Supabase (RAG pipeline).
- **Data Layer**: Real-time integration with BCRP API endpoints using GET/POST methods; no mock data allowed. Supabase is used solely to cache actual API responses for performance.
- **Playground**: Configurable AI-driven analysis using only approved indicators and real values (e.g., trend and correlation analysis).
- **UI Foundation**: Established with Nxt.js, Tailwind CSS, and shadcn components using Lucide icons.

## Series in Use

### Daily Series
- `PD04650MD`: Reservas internacionales netas
- `PD12301MD`: Tasa de Referencia de la Política Monetaria
- `PD04692MD`: Tasa de Interés Interbancaria, S/
- `PD04693MD`: Tasa de Interés Interbancaria, US$
- `PD38026MD`: Índice General Bursátil BVL (índice)
- `PD04694MD`: Índice General Bursátil BVL (var%)
- `PD04701XD`: Cobre (Londres, cUS$ por libras)
- `PD04704XD`: Oro (Londres, US$ por onzas troy)
- `PD04721XD`: Dow Jones (var%)

### Monthly Series
- `PN38705PM`: Índice de Precios al Consumidor (IPC)
- `PN01271PM`: IPC var%
- `PN01496BM`: Exportaciones Total
- `PN02294FM`: Ingresos Tributarios
- `PN38072FM`: Gasto Total del Gobierno General

### Yearly Series
- `PM04908AA`: PBI Anual (Nivel)
- `PM05373BA`: PBI Anual (Var%)

## Recent Changes
- Integrated real-time API structure into backend service layer.
- Removed all mock loaders and placeholder data from Explore & Playground modules.
- Embedded document chunking and storage set up for AI Chatbot with RAG search.
- Supabase schemas extended to support indicator metadata, API logs, and user query history.

## Next Steps
- Finalize UI for all Explore states (empty, loading, result).
- Complete Playground chart logic based on live indicator pairings.
- Fully implement PDF export using real-time data results.
- Test and secure data sync job intervals for daily/monthly/yearly updates.

## Open Decisions
- **Charting Library**: Choosing between Recharts and ECharts for best real-time rendering performance.
- **Auth Strategy**: Evaluate Supabase Auth with OAuth fallback for enterprise access.
- **Caching TTL**: Define refresh intervals per frequency (e.g., daily = every 6h, monthly = daily, yearly = weekly).


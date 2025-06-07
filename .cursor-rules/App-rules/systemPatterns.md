---
# systemPatterns.md

## Architectural Overview

The app follows a modern client-server architecture using modular and scalable technologies optimized for real-time data analytics and AI interactions.

### Components

- **Frontend**: Built with `Nxt.js`, styled via `Tailwind CSS` and `shadcn/ui`, uses `Lucide Icons` for UI consistency.
- **Backend**: Uses `Supabase` (PostgreSQL + Auth + Edge Functions) with `Prisma ORM` for secure, typed access to indicator data and user interactions.
- **AI Layer**:
  - `Gemini 2.5 Pro` for all AI responses (summaries, analysis, chatbot).
  - `OpenAI Embeddings` for document vectorization.
  - `Supabase` vector store supports RAG-based Gemini prompting.
- **External API**: Direct access to `https://estadisticas.bcrp.gob.pe/estadisticas/series/api/` with GET and POST support.
- **No Mock Data**: Application relies entirely on actual BCRP data or previously cached Supabase records—mock values are never used.

## Key Technical Decisions

- **Gemini 2.5 Pro** selected for LLM reasoning and insight generation.
- **OpenAI Embeddings + Supabase** power retrieval-augmented generation (RAG) for the chatbot.
- **Prisma ORM** abstracts DB operations with rich type safety and schema migrations.
- **Supabase** provides a scalable backend including Auth, SQL, Edge Functions, and storage buckets.
- **Only Validated Series Used**: Includes daily, monthly, and yearly indicators approved for deployment.

## Design Patterns

- **Repository Pattern**: Used in backend to abstract DB reads/writes through Prisma services.
- **Strategy Pattern**: Playground uses this to swap between analysis types (e.g., trend, correlation).
- **Adapter Pattern**: Transforms raw BCRP API JSON to unified schemas used by charts, tables, and summaries.
- **RAG Pipeline**: Chatbot pulls embedded chunks from Supabase based on query relevance, then pipes results into Gemini for final response.

## Component Interaction Flow

1. **User Interaction**: Selects indicators or types a question.
2. **Frontend**: Sends structured request to backend (series codes, date range).
3. **Backend**: Checks Supabase cache. If not found, fetches from BCRP API and stores.
4. **AI Layer**:
   - In Explore/Playground: Sends structured context to Gemini for summaries or analysis.
   - In Chatbot: Performs semantic search on embeddings, sends results + prompt to Gemini.
5. **Frontend**: Renders Gemini output, charts, tables, and enables CSV/PDF exports.

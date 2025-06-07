---
# securityConsiderations.md

## Authentication & Authorization

- **Supabase Auth**: Handles secure login, token management, and session handling
- **RBAC (Role-Based Access Control)**: Planned use of Supabase Row-Level Security (RLS) for user-specific access to logs and saved queries
- **JWT Tokens**: Used for protecting backend routes and user-specific indicator history

## Data Protection

- **HTTPS-Only**: All requests enforced via SSL
- **Environment Variables**: All sensitive credentials (API keys, DB access, LLM keys) stored in `.env` and never exposed client-side
- **Supabase RLS**: Activated for tables like `indicator_results`, `embedding_docs`, and `query_logs` to prevent data leakage

## API & AI Safety

- **Strict No-Mock Policy**:
  - Application must only display real BCRP API responses or cache of real data
  - Mock values are blocked at data layer and disallowed in all development environments

- **Input Validation**:
  - All user-submitted queries (chat, playground, explore) are sanitized before being sent to Gemini
  - Frequency, code, and date range validations enforced server-side before any BCRP API request is made

- **Prompt Injection Prevention**:
  - Chatbot inputs are templated before reaching Gemini
  - AI context augmented with filtered document chunks (RAG), avoiding raw user injection

- **Rate Limiting**:
  - Supabase edge functions can throttle excessive usage per IP or token
  - Gemini and BCRP API calls monitored and logged

## File & Export Handling

- **PDF/CSV Generation**:
  - Exported files are generated client-side using live content only
  - Files named securely with no user-submitted content in filenames
  - PDF content matched against original query to avoid export spoofing

- **Storage Access**:
  - Supabase storage buckets secured with signed URLs
  - Access limited to current authenticated user session

## Continuous Monitoring

- **Error Logging**: Client-side (e.g. Sentry) + server-side Supabase logs enabled
- **AI Logs**: All LLM responses logged by `user_id`, `query`, and `timestamp`
- **Embedding Usage Logs**: Tracks vector search requests and sources retrieved for transparency

## Best Practices Checklist

- ✅ ORM access only via typed Prisma queries
- ✅ Supabase logs reviewed biweekly
- ✅ Environment-specific keys scoped securely
- ✅ All AI and export actions traceable by user + time
- ✅ Manual override of mock/test modes is disabled in production

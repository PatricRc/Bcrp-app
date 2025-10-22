# BCRP App Rebuild Strategy
## Pre-Style Document for Scalable AI-Powered Economic Analysis Platform

**Document Version:** 1.0
**Date:** 2025-10-22
**Status:** Planning Phase

---

## Executive Summary

This document outlines a comprehensive strategy to rebuild the BCRP Economic Analysis Platform into a production-ready, scalable application. The rebuild focuses on three core pillars:

1. **Advanced RAG System Architecture** - Implementing vector embeddings, semantic search, and intelligent context retrieval
2. **Latest LLM Models & Multi-Provider Support** - Upgrading to Claude 3.5 Sonnet, GPT-4o, Gemini 2.5, with fallback strategies
3. **Professional Design System** - Modern, accessible, and intuitive UX/UI with consistent branding

### Current State Assessment

**Strengths:**
- Solid Next.js 15 + React 19 foundation
- Functional Gemini 2.0 Flash integration
- Working data pipeline with caching
- Basic RAG implementation (context-passing)
- Responsive UI with Radix components

**Critical Gaps:**
- No vector embeddings or semantic search
- Single LLM provider (vendor lock-in)
- Limited context window (20 data points)
- No conversation persistence
- Basic color scheme lacks professional polish
- No design system documentation
- Limited scalability for concurrent users
- No performance monitoring or analytics

---

## 1. Technical Architecture Rebuild

### 1.1 Infrastructure Modernization

#### Current Stack Enhancement
```typescript
// Existing
Next.js 15.2.4 + React 19 + TypeScript + Supabase

// Add
- Redis for caching layer (Upstash/Vercel KV)
- PostgreSQL with pgvector extension (already in Supabase)
- Vercel/Cloudflare Edge Functions for API routes
- Monitoring: Sentry + Vercel Analytics
- Queue System: Inngest for background jobs
```

#### Scalability Targets
- **Concurrent Users:** 1,000+ simultaneous users
- **API Response Time:** < 200ms (p95)
- **LLM Response Time:** < 3s (p95)
- **Uptime:** 99.9% SLA
- **Data Freshness:** Real-time indicator updates

### 1.2 Database Schema Enhancement

```sql
-- Enhanced schema for production

-- User profiles and preferences
CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users,
  display_name TEXT,
  avatar_url TEXT,
  preferences JSONB DEFAULT '{}',
  tier TEXT DEFAULT 'free', -- free, pro, enterprise
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversation persistence
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Message history with embeddings
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID REFERENCES conversations ON DELETE CASCADE,
  role TEXT NOT NULL, -- 'user', 'assistant', 'system'
  content TEXT NOT NULL,
  embedding VECTOR(1536), -- for semantic search
  tokens_used INTEGER,
  model_used TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Vector storage for RAG
CREATE TABLE knowledge_base (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  embedding VECTOR(1536),
  metadata JSONB NOT NULL,
  indicator_code TEXT, -- link to indicators
  date_range TSTZRANGE, -- temporal context
  chunk_index INTEGER, -- for document chunking
  source_type TEXT, -- 'indicator', 'report', 'news', 'analysis'
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Saved analyses and reports
CREATE TABLE saved_analyses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users ON DELETE CASCADE,
  title TEXT NOT NULL,
  analysis_type TEXT NOT NULL,
  indicators JSONB NOT NULL,
  parameters JSONB NOT NULL,
  result JSONB NOT NULL,
  shared_publicly BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Usage tracking for rate limiting
CREATE TABLE api_usage (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users,
  endpoint TEXT NOT NULL,
  tokens_used INTEGER,
  cost_usd DECIMAL(10, 6),
  response_time_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_messages_conversation ON messages(conversation_id);
CREATE INDEX idx_messages_embedding ON knowledge_base USING ivfflat (embedding vector_cosine_ops);
CREATE INDEX idx_knowledge_base_indicator ON knowledge_base(indicator_code);
CREATE INDEX idx_knowledge_base_date_range ON knowledge_base USING GIST (date_range);
CREATE INDEX idx_api_usage_user_date ON api_usage(user_id, created_at DESC);
```

---

## 2. Advanced RAG System Architecture

### 2.1 Multi-Layer RAG Pipeline

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Query Input                          │
└───────────────────────────┬─────────────────────────────────────┘
                            │
                ┌───────────▼───────────┐
                │  Query Understanding   │
                │  - Intent Detection    │
                │  - Entity Extraction   │
                │  - Query Expansion     │
                └───────────┬───────────┘
                            │
        ┌───────────────────┼───────────────────┐
        │                   │                   │
┌───────▼────────┐  ┌──────▼──────┐  ┌────────▼─────────┐
│  Hybrid Search │  │  Metadata   │  │  Time-Series     │
│                │  │  Filtering  │  │  Analysis        │
│ • Vector       │  │             │  │                  │
│   Similarity   │  │ • Indicator │  │ • Trend Match    │
│ • BM25 Text    │  │   Codes     │  │ • Pattern Detect │
│ • Reranking    │  │ • Date Range│  │ • Seasonality    │
└───────┬────────┘  └──────┬──────┘  └────────┬─────────┘
        │                   │                   │
        └───────────────────┼───────────────────┘
                            │
                ┌───────────▼───────────┐
                │   Context Assembly    │
                │  - Relevance Scoring  │
                │  - Chunk Selection    │
                │  - Context Window Opt │
                └───────────┬───────────┘
                            │
                ┌───────────▼───────────┐
                │   LLM Generation      │
                │  - Multi-Model Route  │
                │  - Streaming Response │
                │  - Citation Tracking  │
                └───────────┬───────────┘
                            │
                ┌───────────▼───────────┐
                │  Response Enhancement │
                │  - Fact Verification  │
                │  - Chart Generation   │
                │  - Source Attribution │
                └───────────────────────┘
```

### 2.2 Vector Embedding Strategy

#### Embedding Models
```typescript
// Primary: OpenAI text-embedding-3-large (3072 dimensions, better accuracy)
// Fallback: OpenAI text-embedding-3-small (1536 dimensions, faster)
// Alternative: Cohere embed-english-v3.0 (1024 dimensions)

interface EmbeddingService {
  model: 'text-embedding-3-large' | 'text-embedding-3-small' | 'cohere-v3'
  dimensions: 3072 | 1536 | 1024
  provider: 'openai' | 'cohere'
}
```

#### Document Chunking Strategy
```typescript
interface ChunkingConfig {
  strategy: 'semantic' | 'fixed' | 'sliding-window'
  maxTokens: 512 // optimal for embedding models
  overlap: 50 // tokens overlap between chunks
  preserveStructure: boolean // keep indicator metadata intact
}

// Example: Chunking economic indicator data
const chunkIndicatorData = (indicator: RespuestaBCRP) => {
  // Chunk 1: Metadata + description
  // Chunk 2-N: Time-series data in 100-point windows
  // Chunk N+1: Statistical summary (min, max, avg, trend)
}
```

### 2.3 Hybrid Search Implementation

```typescript
// Combine vector similarity + keyword search + metadata filtering

interface SearchQuery {
  query: string
  embedding: number[]
  filters: {
    indicatorCodes?: string[]
    dateRange?: { start: Date; end: Date }
    sourceType?: string[]
  }
  limit: number
  scoreThreshold: number
}

async function hybridSearch(query: SearchQuery): Promise<SearchResult[]> {
  // Step 1: Vector similarity search (cosine similarity)
  const vectorResults = await supabase.rpc('match_documents', {
    query_embedding: query.embedding,
    match_threshold: 0.78,
    match_count: 20
  })

  // Step 2: BM25 full-text search
  const textResults = await supabase
    .from('knowledge_base')
    .select()
    .textSearch('content', query.query, {
      type: 'websearch',
      config: 'spanish' // BCRP data is in Spanish
    })

  // Step 3: Rerank using reciprocal rank fusion
  const reranked = reciprocalRankFusion([vectorResults, textResults])

  // Step 4: Apply metadata filters
  const filtered = applyFilters(reranked, query.filters)

  return filtered.slice(0, query.limit)
}
```

### 2.4 Context Window Optimization

```typescript
// Intelligent context selection based on token budget

interface ContextBudget {
  maxTokens: 128000 // Claude 3.5 Sonnet context window
  reservedForResponse: 4096
  reservedForSystem: 2048
  availableForContext: 121856
}

async function buildOptimalContext(
  query: string,
  searchResults: SearchResult[],
  budget: ContextBudget
): Promise<string> {
  const prioritized = searchResults.map((result, index) => ({
    ...result,
    priority: calculatePriority(result, query, index)
  })).sort((a, b) => b.priority - a.priority)

  let context = ''
  let tokensUsed = 0

  for (const result of prioritized) {
    const chunkTokens = estimateTokens(result.content)

    if (tokensUsed + chunkTokens <= budget.availableForContext) {
      context += formatChunk(result)
      tokensUsed += chunkTokens
    } else {
      break
    }
  }

  return context
}
```

### 2.5 Data Ingestion Pipeline

```typescript
// Background job to populate knowledge base

interface IngestionJob {
  jobType: 'indicator_data' | 'historical_reports' | 'news' | 'analysis'
  priority: 'high' | 'medium' | 'low'
  schedule: string // cron expression
}

// Daily job: Ingest new indicator data
const ingestIndicatorData = async () => {
  const indicators = await getAllIndicators()

  for (const indicator of indicators) {
    const data = await fetchBCRPData(indicator.codigo)

    // Create embeddings for different aspects
    const chunks = [
      // Metadata chunk
      {
        content: `${indicator.nombre}: ${indicator.descripcion}. Unidad: ${indicator.unidad}`,
        metadata: { type: 'metadata', indicator: indicator.codigo },
        sourceType: 'indicator'
      },

      // Recent data chunk (last 30 points)
      {
        content: formatRecentData(data.datos.slice(-30)),
        metadata: { type: 'recent', indicator: indicator.codigo },
        sourceType: 'indicator'
      },

      // Statistical summary chunk
      {
        content: generateStatsSummary(data.datos),
        metadata: { type: 'summary', indicator: indicator.codigo },
        sourceType: 'indicator'
      }
    ]

    for (const chunk of chunks) {
      const embedding = await generateEmbedding(chunk.content)

      await supabase.from('knowledge_base').insert({
        content: chunk.content,
        embedding,
        metadata: chunk.metadata,
        indicator_code: indicator.codigo,
        source_type: chunk.sourceType
      })
    }
  }
}
```

---

## 3. Multi-LLM Architecture

### 3.1 Supported Models (Latest Versions)

```typescript
interface LLMProvider {
  provider: 'anthropic' | 'openai' | 'google' | 'mistral'
  models: LLMModel[]
  pricing: PricingTier
  features: string[]
}

const LLM_MODELS = {
  // PRIMARY: Anthropic Claude (Best for analysis & reasoning)
  claude: {
    primary: 'claude-3-5-sonnet-20241022', // Latest Sonnet 3.5
    fast: 'claude-3-5-haiku-20241022',     // Latest Haiku 3.5
    contextWindow: 200000,
    outputTokens: 8192,
    pricing: { input: 3.00, output: 15.00 }, // per 1M tokens
    features: [
      'extended-thinking',
      'vision',
      'tool-use',
      'pdf-support'
    ],
    useCases: [
      'complex-analysis',
      'comparative-reports',
      'forecasting',
      'executive-summaries'
    ]
  },

  // SECONDARY: OpenAI GPT (Best for general chat)
  openai: {
    primary: 'gpt-4o-2024-11-20', // Latest GPT-4o
    fast: 'gpt-4o-mini',
    contextWindow: 128000,
    outputTokens: 16384,
    pricing: { input: 2.50, output: 10.00 },
    features: [
      'function-calling',
      'json-mode',
      'vision',
      'realtime-api'
    ],
    useCases: [
      'chatbot',
      'quick-queries',
      'data-extraction'
    ]
  },

  // TERTIARY: Google Gemini (Current fallback)
  google: {
    primary: 'gemini-2.0-flash-exp', // Latest experimental
    stable: 'gemini-1.5-pro-002',    // Stable production
    contextWindow: 1000000, // 1M tokens!
    outputTokens: 8192,
    pricing: { input: 1.25, output: 5.00 },
    features: [
      'massive-context',
      'multimodal',
      'grounding',
      'thinking-mode'
    ],
    useCases: [
      'large-dataset-analysis',
      'historical-deep-dive',
      'multi-indicator-comparison'
    ]
  },

  // BUDGET: Mistral (Cost-effective)
  mistral: {
    primary: 'mistral-large-latest',
    fast: 'mistral-small-latest',
    contextWindow: 128000,
    outputTokens: 4096,
    pricing: { input: 2.00, output: 6.00 },
    features: [
      'function-calling',
      'json-mode',
      'multilingual'
    ],
    useCases: [
      'high-volume-requests',
      'cost-optimization'
    ]
  }
}
```

### 3.2 Intelligent Model Routing

```typescript
interface RoutingStrategy {
  analyze(query: string): {
    selectedModel: string
    reasoning: string
    estimatedCost: number
  }
}

const routeToOptimalModel = (
  query: string,
  context: string,
  userTier: 'free' | 'pro' | 'enterprise'
): LLMSelection => {
  const complexity = analyzeComplexity(query)
  const contextSize = estimateTokens(context)

  // Rule-based routing
  if (complexity === 'high' && userTier !== 'free') {
    return {
      model: 'claude-3-5-sonnet-20241022',
      reasoning: 'Complex analysis requires Claude\'s reasoning capabilities',
      features: ['extended-thinking']
    }
  }

  if (contextSize > 100000) {
    return {
      model: 'gemini-2.0-flash-exp',
      reasoning: 'Large context requires Gemini\'s 1M token window'
    }
  }

  if (userTier === 'free') {
    return {
      model: 'gpt-4o-mini',
      reasoning: 'Free tier uses cost-effective model'
    }
  }

  // Default for general chat
  return {
    model: 'gpt-4o-2024-11-20',
    reasoning: 'General purpose queries use GPT-4o'
  }
}
```

### 3.3 Unified LLM Service Layer

```typescript
// /lib/services/llm-service.ts

interface LLMRequest {
  messages: Message[]
  model?: string // auto-select if not specified
  temperature?: number
  maxTokens?: number
  stream?: boolean
  tools?: Tool[]
}

interface LLMResponse {
  content: string
  model: string
  usage: {
    inputTokens: number
    outputTokens: number
    cost: number
  }
  metadata: {
    latency: number
    provider: string
  }
}

class UnifiedLLMService {
  private providers = {
    anthropic: new AnthropicClient(),
    openai: new OpenAIClient(),
    google: new GoogleClient(),
    mistral: new MistralClient()
  }

  async generate(request: LLMRequest): Promise<LLMResponse> {
    const model = request.model || this.selectModel(request)
    const provider = this.getProvider(model)

    try {
      const response = await provider.generate({
        ...request,
        model
      })

      // Track usage
      await this.logUsage(response)

      return response
    } catch (error) {
      // Fallback strategy
      return this.handleFailure(request, error)
    }
  }

  private async handleFailure(
    request: LLMRequest,
    error: Error
  ): Promise<LLMResponse> {
    // Automatic fallback chain
    const fallbackModels = [
      'gpt-4o-2024-11-20',
      'gemini-2.0-flash-exp',
      'mistral-large-latest'
    ]

    for (const model of fallbackModels) {
      try {
        return await this.generate({ ...request, model })
      } catch (e) {
        continue
      }
    }

    throw new Error('All LLM providers failed')
  }
}
```

### 3.4 Streaming Responses

```typescript
// Real-time streaming for better UX

async function* streamLLMResponse(
  request: LLMRequest
): AsyncGenerator<string> {
  const provider = getProvider(request.model)

  for await (const chunk of provider.stream(request)) {
    yield chunk.content

    // Update UI in real-time
    // Track partial response for cancellation
  }
}

// Usage in API route
export async function POST(req: Request) {
  const { messages, model } = await req.json()

  const stream = new ReadableStream({
    async start(controller) {
      for await (const chunk of streamLLMResponse({ messages, model })) {
        controller.enqueue(
          new TextEncoder().encode(`data: ${chunk}\n\n`)
        )
      }
      controller.close()
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  })
}
```

---

## 4. Design System Overhaul

### 4.1 Brand Identity Refresh

#### Color Palette
```typescript
// Primary: Deep Ocean Blue (Financial Trust)
const colors = {
  primary: {
    50: '#E6F0FF',   // Lightest blue
    100: '#CCE0FF',
    200: '#99C2FF',
    300: '#66A3FF',
    400: '#3385FF',
    500: '#0066FF',  // Main brand color
    600: '#0052CC',
    700: '#003D99',
    800: '#002966',
    900: '#001433',  // Darkest (almost black)
  },

  // Secondary: Emerald Green (Growth & Positive Trends)
  secondary: {
    50: '#E6FFF5',
    100: '#CCFFEB',
    200: '#99FFD6',
    300: '#66FFC2',
    400: '#33FFAD',
    500: '#00FF99',  // Main accent
    600: '#00CC7A',
    700: '#00995C',
    800: '#00663D',
    900: '#00331F',
  },

  // Accent: Amber (Alerts & Warnings)
  accent: {
    50: '#FFF9E6',
    100: '#FFF3CC',
    200: '#FFE799',
    300: '#FFDB66',
    400: '#FFCF33',
    500: '#FFC300',  // Main warning color
    600: '#CC9C00',
    700: '#997500',
    800: '#664E00',
    900: '#332700',
  },

  // Error: Crimson Red
  error: {
    50: '#FFE6E6',
    100: '#FFCCCC',
    200: '#FF9999',
    300: '#FF6666',
    400: '#FF3333',
    500: '#FF0000',
    600: '#CC0000',
    700: '#990000',
    800: '#660000',
    900: '#330000',
  },

  // Neutral: Slate Gray
  neutral: {
    50: '#F8FAFC',
    100: '#F1F5F9',
    200: '#E2E8F0',
    300: '#CBD5E1',
    400: '#94A3B8',
    500: '#64748B',
    600: '#475569',
    700: '#334155',
    800: '#1E293B',
    900: '#0F172A',
  }
}
```

#### Typography Scale
```typescript
const typography = {
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    mono: ['JetBrains Mono', 'Consolas', 'monospace'],
    display: ['Montserrat', 'Inter', 'sans-serif'], // For headings
  },

  fontSize: {
    xs: ['0.75rem', { lineHeight: '1rem' }],      // 12px
    sm: ['0.875rem', { lineHeight: '1.25rem' }],  // 14px
    base: ['1rem', { lineHeight: '1.5rem' }],     // 16px
    lg: ['1.125rem', { lineHeight: '1.75rem' }],  // 18px
    xl: ['1.25rem', { lineHeight: '1.75rem' }],   // 20px
    '2xl': ['1.5rem', { lineHeight: '2rem' }],    // 24px
    '3xl': ['1.875rem', { lineHeight: '2.25rem' }], // 30px
    '4xl': ['2.25rem', { lineHeight: '2.5rem' }],  // 36px
    '5xl': ['3rem', { lineHeight: '1' }],          // 48px
  },

  fontWeight: {
    normal: 400,
    medium: 500,
    semibold: 600,
    bold: 700,
    extrabold: 800,
  }
}
```

#### Spacing & Layout
```typescript
const spacing = {
  // 4px base unit (0.25rem)
  0: '0',
  px: '1px',
  0.5: '0.125rem',  // 2px
  1: '0.25rem',     // 4px
  2: '0.5rem',      // 8px
  3: '0.75rem',     // 12px
  4: '1rem',        // 16px
  5: '1.25rem',     // 20px
  6: '1.5rem',      // 24px
  8: '2rem',        // 32px
  10: '2.5rem',     // 40px
  12: '3rem',       // 48px
  16: '4rem',       // 64px
  20: '5rem',       // 80px
  24: '6rem',       // 96px
}

const layout = {
  maxWidth: {
    sm: '640px',
    md: '768px',
    lg: '1024px',
    xl: '1280px',
    '2xl': '1536px',
    '3xl': '1920px', // For large dashboards
  },

  borderRadius: {
    none: '0',
    sm: '0.125rem',   // 2px
    DEFAULT: '0.25rem', // 4px
    md: '0.375rem',   // 6px
    lg: '0.5rem',     // 8px
    xl: '0.75rem',    // 12px
    '2xl': '1rem',    // 16px
    '3xl': '1.5rem',  // 24px
    full: '9999px',
  }
}
```

### 4.2 Component Design Principles

#### Accessibility-First
```typescript
// All components must meet WCAG 2.1 AA standards

const a11yChecklist = {
  colorContrast: '4.5:1 minimum for text',
  keyboardNav: 'Full keyboard navigation support',
  screenReader: 'ARIA labels and semantic HTML',
  focusVisible: 'Clear focus indicators',
  textResize: 'Supports 200% zoom without horizontal scroll',
  motion: 'Respects prefers-reduced-motion',
}

// Example: Accessible Button
interface ButtonProps {
  variant: 'primary' | 'secondary' | 'ghost'
  size: 'sm' | 'md' | 'lg'
  loading?: boolean
  disabled?: boolean
  'aria-label'?: string
  'aria-describedby'?: string
}
```

#### Consistency Framework
```typescript
// Every component follows the same prop patterns

interface BaseComponentProps {
  className?: string
  id?: string
  'data-testid'?: string
  // Accessibility
  'aria-label'?: string
  'aria-describedby'?: string
  // State
  disabled?: boolean
  loading?: boolean
  // Styling
  variant?: string
  size?: 'sm' | 'md' | 'lg'
}
```

### 4.3 Component Library Redesign

#### Core Components

```typescript
// 1. Button System
const Button = {
  variants: {
    primary: 'bg-primary-500 text-white hover:bg-primary-600',
    secondary: 'bg-secondary-500 text-white hover:bg-secondary-600',
    outline: 'border-2 border-primary-500 text-primary-500 hover:bg-primary-50',
    ghost: 'text-primary-500 hover:bg-primary-50',
    danger: 'bg-error-500 text-white hover:bg-error-600',
  },
  sizes: {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  },
  states: {
    loading: 'opacity-70 cursor-wait',
    disabled: 'opacity-50 cursor-not-allowed',
  }
}

// 2. Input System
const Input = {
  variants: {
    default: 'border-neutral-300 focus:border-primary-500',
    error: 'border-error-500 focus:border-error-600',
    success: 'border-secondary-500 focus:border-secondary-600',
  },
  sizes: {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-5 py-3 text-lg',
  }
}

// 3. Card System
const Card = {
  variants: {
    default: 'bg-white border border-neutral-200 shadow-sm',
    elevated: 'bg-white shadow-lg',
    interactive: 'bg-white border border-neutral-200 hover:shadow-md transition-shadow cursor-pointer',
    filled: 'bg-neutral-50 border-none',
  },
  padding: {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  }
}

// 4. Chart Components
const Chart = {
  theme: {
    colors: [
      colors.primary[500],
      colors.secondary[500],
      colors.accent[500],
      colors.primary[300],
      colors.secondary[300],
    ],
    grid: {
      stroke: colors.neutral[200],
      strokeDasharray: '3 3',
    },
    axis: {
      stroke: colors.neutral[300],
      tick: { fill: colors.neutral[600] },
    },
    tooltip: {
      backgroundColor: colors.neutral[900],
      color: 'white',
      border: 'none',
      borderRadius: spacing[2],
    }
  }
}
```

#### Dashboard-Specific Components

```typescript
// KPI Card with trend indicator
interface KPICardProps {
  title: string
  value: string | number
  change?: {
    value: number
    period: string
  }
  trend?: 'up' | 'down' | 'stable'
  icon?: React.ReactNode
  loading?: boolean
}

// Example usage
<KPICard
  title="PBI Anual"
  value="S/ 234.5B"
  change={{ value: 3.2, period: 'vs último año' }}
  trend="up"
  icon={<TrendingUpIcon />}
/>

// Indicator Selector with search and filters
interface IndicatorSelectorProps {
  selected: string[]
  onSelect: (codes: string[]) => void
  maxSelection?: number
  filterByFrequency?: FrecuenciaIndicador[]
  searchable?: boolean
  grouped?: boolean
}

// Chart with time range selector
interface TimeSeriesChartProps {
  data: DatoSerie[]
  indicators: IndicadorBCRP[]
  range: DateRange
  onRangeChange: (range: DateRange) => void
  comparisonMode?: 'overlay' | 'stacked' | 'separate'
  showForecast?: boolean
  interactive?: boolean
}
```

### 4.4 Layout System

```typescript
// Responsive layout with sidebar navigation

const LayoutStructure = {
  // Desktop (lg+)
  desktop: {
    sidebar: 'w-64 fixed left-0 top-0 h-screen',
    main: 'ml-64 min-h-screen',
    topbar: 'h-16 border-b fixed top-0 left-64 right-0',
    content: 'mt-16 p-6',
  },

  // Mobile
  mobile: {
    sidebar: 'fixed inset-0 z-50 translate-x-[-100%] transition-transform',
    sidebarOpen: 'translate-x-0',
    main: 'min-h-screen',
    topbar: 'h-14 border-b fixed top-0 left-0 right-0',
    content: 'mt-14 p-4',
  },

  // Navigation structure
  navigation: [
    { name: 'Dashboard', icon: 'LayoutDashboard', href: '/dashboard' },
    { name: 'Chat Asistente', icon: 'MessageSquare', href: '/chatbot' },
    { name: 'Explorar Datos', icon: 'Search', href: '/explorar' },
    { name: 'Análisis Avanzado', icon: 'LineChart', href: '/playground' },
    { name: 'Historial', icon: 'Clock', href: '/history' },
    { name: 'Guardados', icon: 'Bookmark', href: '/saved' },
  ]
}
```

### 4.5 Motion & Animation

```typescript
// Subtle, purposeful animations

const animations = {
  // Transitions
  transition: {
    fast: '150ms cubic-bezier(0.4, 0, 0.2, 1)',
    base: '200ms cubic-bezier(0.4, 0, 0.2, 1)',
    slow: '300ms cubic-bezier(0.4, 0, 0.2, 1)',
  },

  // Keyframes
  fadeIn: {
    from: { opacity: 0 },
    to: { opacity: 1 },
  },

  slideUp: {
    from: { transform: 'translateY(10px)', opacity: 0 },
    to: { transform: 'translateY(0)', opacity: 1 },
  },

  slideInRight: {
    from: { transform: 'translateX(100%)', opacity: 0 },
    to: { transform: 'translateX(0)', opacity: 1 },
  },

  pulse: {
    '0%, 100%': { opacity: 1 },
    '50%': { opacity: 0.5 },
  },

  // Usage in components
  loadingState: 'animate-pulse',
  enter: 'animate-fadeIn duration-200',
  exit: 'animate-fadeOut duration-150',
}

// Respect user preferences
const prefersReducedMotion = `
  @media (prefers-reduced-motion: reduce) {
    * {
      animation-duration: 0.01ms !important;
      animation-iteration-count: 1 !important;
      transition-duration: 0.01ms !important;
    }
  }
`
```

---

## 5. User Experience Improvements

### 5.1 Onboarding Flow

```typescript
// First-time user experience

const OnboardingSteps = [
  {
    step: 1,
    title: 'Bienvenido a BCRP Analytics',
    description: 'Tu asistente inteligente para análisis económico',
    action: 'tour-dashboard',
  },
  {
    step: 2,
    title: 'Explora Indicadores Económicos',
    description: 'Accede a datos históricos del Banco Central',
    action: 'show-indicators',
    interactive: true,
  },
  {
    step: 3,
    title: 'Pregunta al Asistente IA',
    description: 'Análisis inteligente impulsado por IA',
    action: 'demo-chat',
    interactive: true,
  },
  {
    step: 4,
    title: 'Crea Análisis Personalizados',
    description: 'Compara indicadores y genera reportes',
    action: 'show-playground',
  },
]
```

### 5.2 Smart Features

```typescript
// AI-powered UX enhancements

interface SmartFeatures {
  // Auto-suggest related indicators
  suggestRelatedIndicators: (currentSelection: string[]) => Promise<string[]>

  // Predict user intent
  predictQuery: (partialInput: string) => Promise<string[]>

  // Auto-generate insights
  generateInsights: (data: DatoSerie[]) => Promise<Insight[]>

  // Smart date range suggestions
  suggestDateRange: (indicator: string, analysisType: string) => DateRange

  // Anomaly detection
  detectAnomalies: (data: DatoSerie[]) => Anomaly[]
}

// Example: Related indicators
// User selects "Tipo de Cambio" → System suggests "Reservas Internacionales"
```

### 5.3 Simplified Workflows

```typescript
// One-click actions for common tasks

const QuickActions = {
  // From any indicator
  quickAnalyze: async (indicatorCode: string) => {
    // Automatically:
    // 1. Fetch last 12 months of data
    // 2. Generate AI summary
    // 3. Show trends and insights
    // 4. Suggest related indicators
  },

  // Compare two indicators
  quickCompare: async (code1: string, code2: string) => {
    // Automatically:
    // 1. Align date ranges
    // 2. Generate correlation analysis
    // 3. Create comparison chart
    // 4. Export to PDF option
  },

  // Save to dashboard
  addToDashboard: (indicator: string, widget: WidgetType) => {
    // One-click add to personal dashboard
  },

  // Share analysis
  shareAnalysis: (analysisId: string) => {
    // Generate shareable link
    // Option to make public
    // Copy to clipboard
  },
}
```

### 5.4 Error Handling & Empty States

```typescript
// Graceful degradation and helpful messaging

interface EmptyState {
  icon: React.ReactNode
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

const EmptyStates = {
  noIndicatorsSelected: {
    icon: <SearchIcon />,
    title: 'Selecciona indicadores para empezar',
    description: 'Elige hasta 3 indicadores económicos para analizar',
    action: {
      label: 'Explorar indicadores',
      onClick: () => router.push('/explorar')
    }
  },

  noConversations: {
    icon: <MessageIcon />,
    title: 'Aún no tienes conversaciones',
    description: 'Comienza a hacer preguntas sobre economía peruana',
    action: {
      label: 'Iniciar chat',
      onClick: () => startNewChat()
    }
  },

  apiError: {
    icon: <AlertIcon />,
    title: 'Error al cargar datos',
    description: 'No pudimos conectar con el servidor. Intenta nuevamente.',
    action: {
      label: 'Reintentar',
      onClick: () => refetch()
    }
  },
}
```

---

## 6. Performance Optimization

### 6.1 Core Web Vitals Targets

```typescript
const performanceTargets = {
  // Largest Contentful Paint
  LCP: '< 2.5s',

  // First Input Delay
  FID: '< 100ms',

  // Cumulative Layout Shift
  CLS: '< 0.1',

  // First Contentful Paint
  FCP: '< 1.8s',

  // Time to Interactive
  TTI: '< 3.5s',

  // API Response Times
  apiP50: '< 200ms',
  apiP95: '< 500ms',

  // LLM Response Times
  llmP50: '< 2s',
  llmP95: '< 5s',
}
```

### 6.2 Optimization Strategies

```typescript
// 1. Code Splitting
const DynamicImports = {
  // Lazy load heavy components
  Dashboard: dynamic(() => import('@/components/dashboard')),
  AdvancedChart: dynamic(() => import('@/components/charts/advanced')),
  PDFExport: dynamic(() => import('@/lib/pdf-export')),
}

// 2. Data Caching Strategy
const CacheStrategy = {
  // Browser cache (React Query)
  indicators: {
    staleTime: 5 * 60 * 1000, // 5 minutes
    cacheTime: 30 * 60 * 1000, // 30 minutes
  },

  // Redis cache
  apiResponses: {
    ttl: 60 * 60, // 1 hour
    invalidateOn: ['data-update-event'],
  },

  // CDN cache (Vercel Edge)
  staticAssets: {
    maxAge: 31536000, // 1 year
    immutable: true,
  },
}

// 3. Database Query Optimization
const QueryOptimization = {
  // Use indexes
  indexes: [
    'CREATE INDEX idx_indicator_code ON indicators(code)',
    'CREATE INDEX idx_data_date ON indicator_data(date DESC)',
  ],

  // Pagination
  pagination: {
    defaultLimit: 50,
    maxLimit: 1000,
  },

  // Connection pooling
  pool: {
    min: 2,
    max: 10,
  },
}

// 4. Image Optimization
const ImageConfig = {
  formats: ['image/avif', 'image/webp'],
  deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
  imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
  minimumCacheTTL: 60 * 60 * 24 * 365, // 1 year
}
```

### 6.3 Monitoring & Analytics

```typescript
// Real-time performance monitoring

interface MonitoringSetup {
  // Error tracking
  sentry: {
    dsn: process.env.SENTRY_DSN,
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
  },

  // Analytics
  analytics: {
    vercel: true,
    customEvents: [
      'indicator_selected',
      'chat_message_sent',
      'analysis_generated',
      'pdf_exported',
    ],
  },

  // Real User Monitoring
  rum: {
    enabled: true,
    sampleRate: 0.1, // 10% of users
  },

  // Custom metrics
  metrics: [
    'llm_response_time',
    'api_cache_hit_rate',
    'user_session_duration',
    'feature_usage_distribution',
  ],
}
```

---

## 7. Implementation Roadmap

### Phase 1: Foundation (Weeks 1-2)
```typescript
const phase1 = {
  goals: [
    'Set up new database schema',
    'Implement vector embeddings infrastructure',
    'Set up multi-LLM service layer',
    'Create design system foundation',
  ],

  deliverables: [
    'Database migrations complete',
    'Embedding pipeline functional',
    'LLM routing working',
    'Design tokens + Tailwind config',
    'Component library v1 (10 core components)',
  ],

  tasks: [
    {
      name: 'Database Schema Migration',
      files: [
        'supabase/migrations/003_rag_infrastructure.sql',
        'supabase/migrations/004_user_features.sql',
      ],
      effort: '3 days',
    },
    {
      name: 'Vector Embedding Service',
      files: [
        'lib/services/embedding-service.ts',
        'lib/services/vector-search.ts',
      ],
      effort: '4 days',
    },
    {
      name: 'Multi-LLM Integration',
      files: [
        'lib/services/llm-service.ts',
        'lib/services/providers/anthropic.ts',
        'lib/services/providers/openai.ts',
        'lib/services/providers/google.ts',
      ],
      effort: '5 days',
    },
    {
      name: 'Design System Setup',
      files: [
        'tailwind.config.ts',
        'app/globals.css',
        'lib/design-tokens.ts',
      ],
      effort: '2 days',
    },
  ],
}
```

### Phase 2: RAG System (Weeks 3-4)
```typescript
const phase2 = {
  goals: [
    'Build hybrid search system',
    'Implement data ingestion pipeline',
    'Create context optimization logic',
    'Add conversation persistence',
  ],

  deliverables: [
    'Vector search working',
    'Knowledge base populated',
    'Context-aware responses',
    'Conversation history saved',
  ],

  tasks: [
    {
      name: 'Hybrid Search Implementation',
      files: [
        'lib/services/hybrid-search.ts',
        'lib/utils/reranking.ts',
      ],
      effort: '5 days',
    },
    {
      name: 'Data Ingestion Pipeline',
      files: [
        'lib/jobs/ingest-indicators.ts',
        'lib/jobs/generate-embeddings.ts',
      ],
      effort: '4 days',
    },
    {
      name: 'Context Builder',
      files: [
        'lib/services/context-builder.ts',
        'lib/utils/token-counter.ts',
      ],
      effort: '3 days',
    },
  ],
}
```

### Phase 3: UI/UX Rebuild (Weeks 5-6)
```typescript
const phase3 = {
  goals: [
    'Rebuild all components with new design system',
    'Implement responsive layouts',
    'Add animations and micro-interactions',
    'Create onboarding flow',
  ],

  deliverables: [
    'All pages redesigned',
    'Mobile-responsive',
    'Accessibility compliance',
    'User onboarding complete',
  ],

  tasks: [
    {
      name: 'Component Library Rebuild',
      files: [
        'components/ui/button.tsx',
        'components/ui/input.tsx',
        'components/ui/card.tsx',
        // ... 30+ components
      ],
      effort: '7 days',
    },
    {
      name: 'Page Layouts',
      files: [
        'app/(protected)/dashboard/page.tsx',
        'app/(protected)/chatbot/page.tsx',
        'app/(protected)/explorar/page.tsx',
        'app/(protected)/playground/page.tsx',
      ],
      effort: '5 days',
    },
  ],
}
```

### Phase 4: Advanced Features (Weeks 7-8)
```typescript
const phase4 = {
  goals: [
    'Add saved analyses',
    'Implement sharing functionality',
    'Create user preferences',
    'Add collaboration features',
  ],

  deliverables: [
    'Save/load analyses',
    'Public sharing links',
    'User settings page',
    'Team workspaces (enterprise)',
  ],
}
```

### Phase 5: Testing & Optimization (Weeks 9-10)
```typescript
const phase5 = {
  goals: [
    'Performance optimization',
    'Load testing',
    'Security audit',
    'User testing',
  ],

  deliverables: [
    'Core Web Vitals pass',
    'Load test report (1000+ concurrent users)',
    'Security audit complete',
    'Bug fixes from user testing',
  ],
}
```

---

## 8. Success Metrics

### 8.1 Technical KPIs
```typescript
const technicalKPIs = {
  performance: {
    lcp: { target: '< 2.5s', current: 'TBD' },
    fid: { target: '< 100ms', current: 'TBD' },
    cls: { target: '< 0.1', current: 'TBD' },
    apiP95: { target: '< 500ms', current: 'TBD' },
  },

  reliability: {
    uptime: { target: '99.9%', current: 'TBD' },
    errorRate: { target: '< 0.1%', current: 'TBD' },
    llmSuccessRate: { target: '> 99%', current: 'TBD' },
  },

  scalability: {
    concurrentUsers: { target: '1000+', current: 'TBD' },
    requestsPerSecond: { target: '100+', current: 'TBD' },
    databaseConnections: { target: '< 50% pool', current: 'TBD' },
  },
}
```

### 8.2 User Experience KPIs
```typescript
const userKPIs = {
  engagement: {
    dailyActiveUsers: { target: '100+' },
    avgSessionDuration: { target: '> 5 min' },
    queriesPerSession: { target: '> 3' },
    returnRate: { target: '> 40%' },
  },

  satisfaction: {
    nps: { target: '> 50' },
    taskCompletionRate: { target: '> 85%' },
    errorRecoveryRate: { target: '> 95%' },
  },

  adoption: {
    onboardingCompletion: { target: '> 70%' },
    featureDiscovery: { target: '> 60%' },
    powerUserGrowth: { target: '+10% monthly' },
  },
}
```

### 8.3 Business KPIs
```typescript
const businessKPIs = {
  costs: {
    llmCostPerUser: { target: '< $0.50/month' },
    infrastructureCost: { target: '< $500/month' },
    supportTickets: { target: '< 5/week' },
  },

  growth: {
    monthlySignups: { target: '> 50' },
    conversionToProTier: { target: '> 10%' },
    churnRate: { target: '< 5%' },
  },
}
```

---

## 9. Risk Mitigation

### 9.1 Technical Risks
```typescript
const technicalRisks = {
  llmProviderOutage: {
    probability: 'Medium',
    impact: 'High',
    mitigation: [
      'Multi-provider fallback system',
      'Offline response generation',
      'Graceful degradation',
    ],
  },

  vectorSearchPerformance: {
    probability: 'Low',
    impact: 'Medium',
    mitigation: [
      'Index optimization',
      'Query result caching',
      'Pagination for large result sets',
    ],
  },

  databaseScaling: {
    probability: 'Medium',
    impact: 'High',
    mitigation: [
      'Connection pooling',
      'Read replicas',
      'Supabase auto-scaling',
    ],
  },
}
```

### 9.2 UX Risks
```typescript
const uxRisks = {
  complexInterface: {
    probability: 'Medium',
    impact: 'High',
    mitigation: [
      'User testing with target audience',
      'Iterative design improvements',
      'Comprehensive onboarding',
    ],
  },

  slowLlmResponses: {
    probability: 'High',
    impact: 'Medium',
    mitigation: [
      'Streaming responses',
      'Loading states with progress',
      'Model selection based on complexity',
    ],
  },
}
```

---

## 10. Next Steps

### Immediate Actions (This Week)
1. **Stakeholder Review** - Present this document for feedback
2. **Design Mockups** - Create Figma prototypes of key screens
3. **Technical Spike** - Test vector search performance with sample data
4. **Cost Analysis** - Calculate monthly LLM costs for different usage scenarios

### Week 1 Priorities
1. Set up new development branch
2. Begin database migrations
3. Start design system implementation
4. Set up monitoring and analytics

### Decision Points
- [ ] Approve color palette and typography
- [ ] Confirm LLM provider priorities
- [ ] Review feature prioritization
- [ ] Set launch timeline

---

## Appendix

### A. Technology Stack Summary
```typescript
const techStack = {
  frontend: {
    framework: 'Next.js 15 (App Router)',
    language: 'TypeScript 5',
    styling: 'Tailwind CSS 4',
    components: 'Radix UI + Custom',
    state: 'React Query + Zustand',
    charts: 'Recharts + D3.js',
  },

  backend: {
    runtime: 'Node.js 20 (Vercel Edge)',
    database: 'Supabase (PostgreSQL + pgvector)',
    cache: 'Redis (Upstash)',
    queue: 'Inngest',
    storage: 'Supabase Storage',
  },

  ai: {
    primary: 'Claude 3.5 Sonnet',
    secondary: 'GPT-4o',
    tertiary: 'Gemini 2.0 Flash',
    embeddings: 'text-embedding-3-large',
  },

  infrastructure: {
    hosting: 'Vercel',
    monitoring: 'Sentry',
    analytics: 'Vercel Analytics',
    cdn: 'Vercel Edge Network',
  },
}
```

### B. Estimated Costs (Monthly)
```typescript
const monthlyCosts = {
  infrastructure: {
    vercel: '$20 (Pro plan)',
    supabase: '$25 (Pro plan)',
    upstash: '$10 (Redis cache)',
  },

  ai: {
    claude: '$150 (estimated)',
    openai: '$100 (estimated)',
    gemini: '$50 (estimated)',
    embeddings: '$30 (estimated)',
  },

  monitoring: {
    sentry: '$26 (Team plan)',
  },

  total: '$411/month (for 100 active users)',
  perUser: '$4.11/month',
}
```

### C. Resources Required
```typescript
const resources = {
  developers: {
    fullstack: 2,
    frontend: 1,
    backend: 1,
  },

  design: {
    uiuxDesigner: 1,
  },

  timeline: '10 weeks to MVP',
}
```

---

**Document Status:** Ready for Review
**Next Review Date:** After stakeholder feedback
**Owner:** Development Team
**Last Updated:** 2025-10-22

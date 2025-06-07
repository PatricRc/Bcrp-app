-- This migration sets up the initial database schema for the BCRP app
-- It creates tables for storing indicators, indicator data, query logs, and embedding documents
-- All tables have Row Level Security (RLS) enabled for proper access control

-- Create indicators table
create table public.indicators (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  code text not null unique,
  description text,
  frequency text not null,
  unit text not null,
  source text not null,
  created_at timestamp with time zone default now() not null,
  updated_at timestamp with time zone default now() not null
);
comment on table public.indicators is 'Stores metadata about economic indicators from BCRP';

-- Create indicator_data table for storing the actual values
create table public.indicator_data (
  id uuid primary key default gen_random_uuid(),
  indicator_id uuid not null references public.indicators(id) on delete cascade,
  date timestamp with time zone not null,
  value numeric not null,
  created_at timestamp with time zone default now() not null,
  -- Create a unique constraint to prevent duplicate entries for the same indicator and date
  unique(indicator_id, date)
);
comment on table public.indicator_data is 'Stores the actual values for indicators at specific points in time';

-- Create query_logs table for tracking user queries
create table public.query_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id),
  query text not null,
  created_at timestamp with time zone default now() not null
);
comment on table public.query_logs is 'Logs user queries for analytics and history purposes';

-- Create embedding_docs table for storing document embeddings for the RAG pipeline
create table public.embedding_docs (
  id uuid primary key default gen_random_uuid(),
  content text not null,
  embedding vector(1536), -- For OpenAI embeddings
  metadata jsonb,
  created_at timestamp with time zone default now() not null
);
comment on table public.embedding_docs is 'Stores document content and embeddings for RAG retrieval';

-- Enable Row Level Security on all tables
alter table public.indicators enable row level security;
alter table public.indicator_data enable row level security;
alter table public.query_logs enable row level security;
alter table public.embedding_docs enable row level security;

-- Create RLS policies for indicators table
create policy "Indicators are viewable by everyone" 
on public.indicators
for select 
to authenticated, anon
using (true);

create policy "Indicators can be inserted by authenticated users only" 
on public.indicators
for insert 
to authenticated
with check (true);

create policy "Indicators can be updated by authenticated users only" 
on public.indicators
for update 
to authenticated
using (true)
with check (true);

create policy "Indicators can be deleted by authenticated users only" 
on public.indicators
for delete 
to authenticated
using (true);

-- Create RLS policies for indicator_data table
create policy "Indicator data is viewable by everyone" 
on public.indicator_data
for select 
to authenticated, anon
using (true);

create policy "Indicator data can be inserted by authenticated users only" 
on public.indicator_data
for insert 
to authenticated
with check (true);

create policy "Indicator data can be updated by authenticated users only" 
on public.indicator_data
for update 
to authenticated
using (true)
with check (true);

create policy "Indicator data can be deleted by authenticated users only" 
on public.indicator_data
for delete 
to authenticated
using (true);

-- Create RLS policies for query_logs table
create policy "Query logs are viewable by the user who created them" 
on public.query_logs
for select 
to authenticated
using (auth.uid() = user_id or user_id is null);

create policy "Query logs can be inserted by anyone" 
on public.query_logs
for insert 
to authenticated, anon
with check (true);

create policy "Query logs can be updated by the user who created them" 
on public.query_logs
for update 
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Query logs can be deleted by the user who created them" 
on public.query_logs
for delete 
to authenticated
using (auth.uid() = user_id);

-- Create RLS policies for embedding_docs table
create policy "Embedding docs are viewable by everyone" 
on public.embedding_docs
for select 
to authenticated, anon
using (true);

create policy "Embedding docs can be inserted by authenticated users only" 
on public.embedding_docs
for insert 
to authenticated
with check (true);

create policy "Embedding docs can be updated by authenticated users only" 
on public.embedding_docs
for update 
to authenticated
using (true)
with check (true);

create policy "Embedding docs can be deleted by authenticated users only" 
on public.embedding_docs
for delete 
to authenticated
using (true);

-- Create a function to update the updated_at field automatically
create or replace function public.update_updated_at()
returns trigger
language plpgsql
security invoker
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- Set up triggers for automatic timestamp updates
create trigger update_indicators_updated_at
before update on public.indicators
for each row
execute function public.update_updated_at(); 
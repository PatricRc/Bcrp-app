import { supabase } from './supabase-service';
import type { Database } from '../types/database.types';

type Indicator = Database['public']['Tables']['indicators']['Row'];
type IndicatorData = Database['public']['Tables']['indicator_data']['Row'];
type QueryLog = Database['public']['Tables']['query_logs']['Row'];
type EmbeddingDoc = Database['public']['Tables']['embedding_docs']['Row'];

// Indicators API
export const getIndicators = async (): Promise<Indicator[]> => {
  const { data, error } = await supabase
    .from('indicators')
    .select('*')
    .order('name');

  if (error) {
    console.error('Error fetching indicators:', error);
    throw error;
  }

  return data || [];
};

export const getIndicatorByCode = async (code: string): Promise<Indicator | null> => {
  const { data, error } = await supabase
    .from('indicators')
    .select('*')
    .eq('code', code)
    .single();

  if (error) {
    console.error(`Error fetching indicator with code ${code}:`, error);
    throw error;
  }

  return data;
};

// Indicator Data API
export const getIndicatorData = async (
  indicatorId: string,
  startDate?: string,
  endDate?: string
): Promise<IndicatorData[]> => {
  let query = supabase
    .from('indicator_data')
    .select('*')
    .eq('indicator_id', indicatorId)
    .order('date');

  if (startDate) {
    query = query.gte('date', startDate);
  }

  if (endDate) {
    query = query.lte('date', endDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error(`Error fetching data for indicator ${indicatorId}:`, error);
    throw error;
  }

  return data || [];
};

// Query Logs API
export const logQuery = async (query: string, userId?: string): Promise<void> => {
  const { error } = await supabase
    .from('query_logs')
    .insert([{ query, user_id: userId }]);

  if (error) {
    console.error('Error logging query:', error);
    throw error;
  }
};

export const getUserQueryHistory = async (userId: string): Promise<QueryLog[]> => {
  const { data, error } = await supabase
    .from('query_logs')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error(`Error fetching query history for user ${userId}:`, error);
    throw error;
  }

  return data || [];
};

// Embedding Docs API
export const getEmbeddingDocs = async (): Promise<EmbeddingDoc[]> => {
  const { data, error } = await supabase
    .from('embedding_docs')
    .select('*');

  if (error) {
    console.error('Error fetching embedding docs:', error);
    throw error;
  }

  return data || [];
};

export const createEmbeddingDoc = async (
  content: string,
  embedding: string | object,
  metadata?: object
): Promise<EmbeddingDoc> => {
  const { data, error } = await supabase
    .from('embedding_docs')
    .insert([{ content, embedding, metadata }])
    .select()
    .single();

  if (error) {
    console.error('Error creating embedding doc:', error);
    throw error;
  }

  return data;
}; 
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      indicators: {
        Row: {
          id: string
          name: string
          code: string
          description: string | null
          frequency: string
          unit: string
          source: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          code: string
          description?: string | null
          frequency: string
          unit: string
          source: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          code?: string
          description?: string | null
          frequency?: string
          unit?: string
          source?: string
          created_at?: string
          updated_at?: string
        }
      }
      indicator_data: {
        Row: {
          id: string
          indicator_id: string
          date: string
          value: number
          created_at: string
        }
        Insert: {
          id?: string
          indicator_id: string
          date: string
          value: number
          created_at?: string
        }
        Update: {
          id?: string
          indicator_id?: string
          date?: string
          value?: number
          created_at?: string
        }
      }
      query_logs: {
        Row: {
          id: string
          user_id: string | null
          query: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          query: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          query?: string
          created_at?: string
        }
      }
      embedding_docs: {
        Row: {
          id: string
          content: string
          embedding: string | Json
          metadata: Json | null
          created_at: string
        }
        Insert: {
          id?: string
          content: string
          embedding: string | Json
          metadata?: Json | null
          created_at?: string
        }
        Update: {
          id?: string
          content?: string
          embedding?: string | Json
          metadata?: Json | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 
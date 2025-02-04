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
      daily_words: {
        Row: {
          date: string
          id: string
          word: string
          user_guesses?: Array<{
            session_id: string
            temperature: number
          }>
        }
        Insert: {
          date: string
          id?: string
          word: string
        }
        Update: {
          date?: string
          id?: string
          word?: string
        }
      }
      valid_words: {
        Row: {
          id: string
          word: string
        }
        Insert: {
          id?: string
          word: string
        }
        Update: {
          id?: string
          word?: string
        }
      }
      word_similarities: {
        Row: {
          id: string
          similarity_score: number
          word1: string
          word2: string
        }
        Insert: {
          id?: string
          similarity_score: number
          word1: string
          word2: string
        }
        Update: {
          id?: string
          similarity_score?: number
          word1?: string
          word2?: string
        }
      }
      user_guesses: {
        Row: {
          id: string
          session_id: string
          word: string
          daily_word_id: string
          temperature: number
          created_at: string
        }
        Insert: {
          id?: string
          session_id: string
          word: string
          daily_word_id: string
          temperature: number
          created_at?: string
        }
        Update: {
          id?: string
          session_id?: string
          word?: string
          daily_word_id?: string
          temperature?: number
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_todays_word: {
        Args: Record<string, never>
        Returns: {
          word: string
          total_players: number
          found_today: number
        }
      }
      check_word: {
        Args: {
          input_word: string
        }
        Returns: {
          word: string
          similarity_score: number
        }
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

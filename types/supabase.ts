export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          created_at: string
          updated_at: string
          role: string
          avatar_url: string | null
          email: string | null
          display_name: string | null
        }
        Insert: {
          id: string
          created_at?: string
          updated_at?: string
          role?: string
          avatar_url?: string | null
          email?: string | null
          display_name?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          updated_at?: string
          role?: string
          avatar_url?: string | null
          email?: string | null
          display_name?: string | null
        }
      }
    }
    Functions: {
      safe_check_email_exists: {
        Args: {
          check_email: string
        }
        Returns: boolean
      }
    }
  }
}

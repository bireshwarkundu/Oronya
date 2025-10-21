export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      admin_activity_log: {
        Row: {
          action: string
          admin_role: Database["public"]["Enums"]["user_role"]
          admin_user_id: string
          created_at: string
          details: Json | null
          id: string
          target_user_id: string
        }
        Insert: {
          action: string
          admin_role: Database["public"]["Enums"]["user_role"]
          admin_user_id: string
          created_at?: string
          details?: Json | null
          id?: string
          target_user_id: string
        }
        Update: {
          action?: string
          admin_role?: Database["public"]["Enums"]["user_role"]
          admin_user_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_user_id?: string
        }
        Relationships: []
      }
      otp_verifications: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          otp_code: string
          verified: boolean
        }
        Insert: {
          created_at?: string
          email: string
          expires_at: string
          id?: string
          otp_code: string
          verified?: boolean
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          otp_code?: string
          verified?: boolean
        }
        Relationships: []
      }
      password_change_requests: {
        Row: {
          created_at: string
          email: string
          expires_at: string
          id: string
          otp_code: string
          used: boolean
          user_id: string
          verified: boolean
        }
        Insert: {
          created_at?: string
          email: string
          expires_at: string
          id?: string
          otp_code: string
          used?: boolean
          user_id: string
          verified?: boolean
        }
        Update: {
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          otp_code?: string
          used?: boolean
          user_id?: string
          verified?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          admin_notes: string | null
          avatar_url: string | null
          created_at: string
          custom_user_id: string | null
          display_name: string | null
          email: string | null
          government_id: string | null
          id: string
          is_verified: boolean | null
          last_login: string | null
          location: string | null
          managed_by: string | null
          organization: string | null
          phone_number: string | null
          qr_code_data: string | null
          status: string | null
          team_name: string | null
          updated_at: string
          user_id: string
          user_type: string | null
          verification_notes: string | null
          verified_at: string | null
          verified_by: string | null
        }
        Insert: {
          admin_notes?: string | null
          avatar_url?: string | null
          created_at?: string
          custom_user_id?: string | null
          display_name?: string | null
          email?: string | null
          government_id?: string | null
          id?: string
          is_verified?: boolean | null
          last_login?: string | null
          location?: string | null
          managed_by?: string | null
          organization?: string | null
          phone_number?: string | null
          qr_code_data?: string | null
          status?: string | null
          team_name?: string | null
          updated_at?: string
          user_id: string
          user_type?: string | null
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Update: {
          admin_notes?: string | null
          avatar_url?: string | null
          created_at?: string
          custom_user_id?: string | null
          display_name?: string | null
          email?: string | null
          government_id?: string | null
          id?: string
          is_verified?: boolean | null
          last_login?: string | null
          location?: string | null
          managed_by?: string | null
          organization?: string | null
          phone_number?: string | null
          qr_code_data?: string | null
          status?: string | null
          team_name?: string | null
          updated_at?: string
          user_id?: string
          user_type?: string | null
          verification_notes?: string | null
          verified_at?: string | null
          verified_by?: string | null
        }
        Relationships: []
      }
      tree_image_analysis_cache: {
        Row: {
          analysis_notes: string
          confidence: string
          created_at: string
          estimated_area_hectares: number
          id: string
          image_hash: string
          land_cover_class: string
          last_accessed_at: string
          tree_count: number
        }
        Insert: {
          analysis_notes: string
          confidence: string
          created_at?: string
          estimated_area_hectares: number
          id?: string
          image_hash: string
          land_cover_class: string
          last_accessed_at?: string
          tree_count: number
        }
        Update: {
          analysis_notes?: string
          confidence?: string
          created_at?: string
          estimated_area_hectares?: number
          id?: string
          image_hash?: string
          land_cover_class?: string
          last_accessed_at?: string
          tree_count?: number
        }
        Relationships: []
      }
      tree_uploads: {
        Row: {
          co2_offset: number | null
          created_at: string
          id: string
          image_url: string
          location: string | null
          status: string
          tree_count: number | null
          updated_at: string | null
          user_id: string
          verification_notes: string | null
          verified_at: string | null
        }
        Insert: {
          co2_offset?: number | null
          created_at?: string
          id?: string
          image_url: string
          location?: string | null
          status?: string
          tree_count?: number | null
          updated_at?: string | null
          user_id: string
          verification_notes?: string | null
          verified_at?: string | null
        }
        Update: {
          co2_offset?: number | null
          created_at?: string
          id?: string
          image_url?: string
          location?: string | null
          status?: string
          tree_count?: number | null
          updated_at?: string | null
          user_id?: string
          verification_notes?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: []
      }
      verification_history: {
        Row: {
          created_at: string
          id: string
          user_id: string
          verification_notes: string | null
          verification_status: boolean
          verified_by: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
          verification_notes?: string | null
          verification_status: boolean
          verified_by: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
          verification_notes?: string | null
          verification_status?: boolean
          verified_by?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      assign_government_role: {
        Args: { _user_id: string }
        Returns: undefined
      }
      generate_qr_data_for_user: {
        Args: { _user_id: string }
        Returns: string
      }
      generate_unique_user_id: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      has_admin_role: {
        Args: {
          _role: Database["public"]["Enums"]["user_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin_user: {
        Args: { _user_id: string }
        Returns: boolean
      }
      is_government_admin: {
        Args: { _user_id: string }
        Returns: boolean
      }
      log_admin_activity: {
        Args: {
          _action: string
          _admin_role: Database["public"]["Enums"]["user_role"]
          _admin_user_id: string
          _details?: Json
          _target_user_id: string
        }
        Returns: undefined
      }
    }
    Enums: {
      user_role: "user" | "user_admin" | "company_admin" | "government_admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: ["user", "user_admin", "company_admin", "government_admin"],
    },
  },
} as const

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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      bioimpedance: {
        Row: {
          bmr: number | null
          body_fat_pct: number | null
          body_water_pct: number | null
          bone_mass: number | null
          created_at: string
          id: string
          measured_at: string
          muscle_mass: number | null
          notes: string | null
          report_url: string | null
          student_id: string
          trainer_id: string
          visceral_fat: number | null
          weight: number | null
        }
        Insert: {
          bmr?: number | null
          body_fat_pct?: number | null
          body_water_pct?: number | null
          bone_mass?: number | null
          created_at?: string
          id?: string
          measured_at?: string
          muscle_mass?: number | null
          notes?: string | null
          report_url?: string | null
          student_id: string
          trainer_id: string
          visceral_fat?: number | null
          weight?: number | null
        }
        Update: {
          bmr?: number | null
          body_fat_pct?: number | null
          body_water_pct?: number | null
          bone_mass?: number | null
          created_at?: string
          id?: string
          measured_at?: string
          muscle_mass?: number | null
          notes?: string | null
          report_url?: string | null
          student_id?: string
          trainer_id?: string
          visceral_fat?: number | null
          weight?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "bioimpedance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          created_at: string
          id: string
          notes: string | null
          paid_at: string | null
          payment_method: string | null
          reference_month: string
          status: string | null
          student_id: string
          trainer_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          reference_month: string
          status?: string | null
          student_id: string
          trainer_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          notes?: string | null
          paid_at?: string | null
          payment_method?: string | null
          reference_month?: string
          status?: string | null
          student_id?: string
          trainer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          role: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          role?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      progress_photos: {
        Row: {
          created_at: string
          id: string
          notes: string | null
          photo_type: string | null
          photo_url: string
          student_id: string
          taken_at: string
          trainer_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          notes?: string | null
          photo_type?: string | null
          photo_url: string
          student_id: string
          taken_at?: string
          trainer_id: string
        }
        Update: {
          created_at?: string
          id?: string
          notes?: string | null
          photo_type?: string | null
          photo_url?: string
          student_id?: string
          taken_at?: string
          trainer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "progress_photos_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          created_at: string
          duration_minutes: number | null
          id: string
          location: string | null
          muscle_groups: string[] | null
          notes: string | null
          scheduled_date: string
          scheduled_time: string
          status: string | null
          student_id: string
          trainer_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          duration_minutes?: number | null
          id?: string
          location?: string | null
          muscle_groups?: string[] | null
          notes?: string | null
          scheduled_date: string
          scheduled_time: string
          status?: string | null
          student_id: string
          trainer_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          duration_minutes?: number | null
          id?: string
          location?: string | null
          muscle_groups?: string[] | null
          notes?: string | null
          scheduled_date?: string
          scheduled_time?: string
          status?: string | null
          student_id?: string
          trainer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sessions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
      students: {
        Row: {
          access_code: string | null
          avatar_url: string | null
          color: string | null
          created_at: string
          email: string | null
          goal: string | null
          id: string
          is_consulting: boolean | null
          name: string
          needs_reminder: boolean | null
          notes: string | null
          package_total_sessions: number | null
          package_used_sessions: number | null
          payment_due_day: number | null
          phone: string | null
          plan_type: string | null
          plan_value: number | null
          schedule_config: Json | null
          sessions_per_week: number | null
          status: string | null
          trainer_id: string
          updated_at: string
        }
        Insert: {
          access_code?: string | null
          avatar_url?: string | null
          color?: string | null
          created_at?: string
          email?: string | null
          goal?: string | null
          id?: string
          is_consulting?: boolean | null
          name: string
          needs_reminder?: boolean | null
          notes?: string | null
          package_total_sessions?: number | null
          package_used_sessions?: number | null
          payment_due_day?: number | null
          phone?: string | null
          plan_type?: string | null
          plan_value?: number | null
          schedule_config?: Json | null
          sessions_per_week?: number | null
          status?: string | null
          trainer_id: string
          updated_at?: string
        }
        Update: {
          access_code?: string | null
          avatar_url?: string | null
          color?: string | null
          created_at?: string
          email?: string | null
          goal?: string | null
          id?: string
          is_consulting?: boolean | null
          name?: string
          needs_reminder?: boolean | null
          notes?: string | null
          package_total_sessions?: number | null
          package_used_sessions?: number | null
          payment_due_day?: number | null
          phone?: string | null
          plan_type?: string | null
          plan_value?: number | null
          schedule_config?: Json | null
          sessions_per_week?: number | null
          status?: string | null
          trainer_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_student_by_code: {
        Args: { _code: string }
        Returns: {
          access_code: string | null
          avatar_url: string | null
          color: string | null
          created_at: string
          email: string | null
          goal: string | null
          id: string
          is_consulting: boolean | null
          name: string
          needs_reminder: boolean | null
          notes: string | null
          package_total_sessions: number | null
          package_used_sessions: number | null
          payment_due_day: number | null
          phone: string | null
          plan_type: string | null
          plan_value: number | null
          schedule_config: Json | null
          sessions_per_week: number | null
          status: string | null
          trainer_id: string
          updated_at: string
        }[]
        SetofOptions: {
          from: "*"
          to: "students"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "trainer"
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
      app_role: ["admin", "trainer"],
    },
  },
} as const

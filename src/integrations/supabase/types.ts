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
      assessments: {
        Row: {
          age: number
          body_density: number | null
          body_fat_pct: number | null
          created_at: string
          fat_mass_kg: number | null
          id: string
          lean_mass_kg: number | null
          measured_at: string
          notes: string | null
          perim_abdomen: number | null
          perim_arm_contracted: number | null
          perim_arm_relaxed: number | null
          perim_calf: number | null
          perim_chest: number | null
          perim_forearm: number | null
          perim_hip: number | null
          perim_neck: number | null
          perim_shoulder: number | null
          perim_thigh_mid: number | null
          perim_thigh_proximal: number | null
          perim_waist: number | null
          sex: string
          skinfold_abdominal: number | null
          skinfold_axillary: number | null
          skinfold_chest: number | null
          skinfold_subscapular: number | null
          skinfold_suprailiac: number | null
          skinfold_thigh: number | null
          skinfold_triceps: number | null
          student_id: string
          sum_skinfolds: number | null
          trainer_id: string
          weight: number
        }
        Insert: {
          age: number
          body_density?: number | null
          body_fat_pct?: number | null
          created_at?: string
          fat_mass_kg?: number | null
          id?: string
          lean_mass_kg?: number | null
          measured_at?: string
          notes?: string | null
          perim_abdomen?: number | null
          perim_arm_contracted?: number | null
          perim_arm_relaxed?: number | null
          perim_calf?: number | null
          perim_chest?: number | null
          perim_forearm?: number | null
          perim_hip?: number | null
          perim_neck?: number | null
          perim_shoulder?: number | null
          perim_thigh_mid?: number | null
          perim_thigh_proximal?: number | null
          perim_waist?: number | null
          sex: string
          skinfold_abdominal?: number | null
          skinfold_axillary?: number | null
          skinfold_chest?: number | null
          skinfold_subscapular?: number | null
          skinfold_suprailiac?: number | null
          skinfold_thigh?: number | null
          skinfold_triceps?: number | null
          student_id: string
          sum_skinfolds?: number | null
          trainer_id: string
          weight: number
        }
        Update: {
          age?: number
          body_density?: number | null
          body_fat_pct?: number | null
          created_at?: string
          fat_mass_kg?: number | null
          id?: string
          lean_mass_kg?: number | null
          measured_at?: string
          notes?: string | null
          perim_abdomen?: number | null
          perim_arm_contracted?: number | null
          perim_arm_relaxed?: number | null
          perim_calf?: number | null
          perim_chest?: number | null
          perim_forearm?: number | null
          perim_hip?: number | null
          perim_neck?: number | null
          perim_shoulder?: number | null
          perim_thigh_mid?: number | null
          perim_thigh_proximal?: number | null
          perim_waist?: number | null
          sex?: string
          skinfold_abdominal?: number | null
          skinfold_axillary?: number | null
          skinfold_chest?: number | null
          skinfold_subscapular?: number | null
          skinfold_suprailiac?: number | null
          skinfold_thigh?: number | null
          skinfold_triceps?: number | null
          student_id?: string
          sum_skinfolds?: number | null
          trainer_id?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "assessments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "students"
            referencedColumns: ["id"]
          },
        ]
      }
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
      push_subscriptions: {
        Row: {
          auth: string
          created_at: string
          daily_summary_hour: number
          endpoint: string
          id: string
          p256dh: string
          trainer_id: string
          updated_at: string
        }
        Insert: {
          auth: string
          created_at?: string
          daily_summary_hour?: number
          endpoint: string
          id?: string
          p256dh: string
          trainer_id: string
          updated_at?: string
        }
        Update: {
          auth?: string
          created_at?: string
          daily_summary_hour?: number
          endpoint?: string
          id?: string
          p256dh?: string
          trainer_id?: string
          updated_at?: string
        }
        Relationships: []
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
      trainer_subscriptions: {
        Row: {
          created_at: string | null
          expires_at: string | null
          id: string
          plan: string
          price: number | null
          started_at: string | null
          status: string
          trainer_id: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          plan?: string
          price?: number | null
          started_at?: string | null
          status?: string
          trainer_id: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          expires_at?: string | null
          id?: string
          plan?: string
          price?: number | null
          started_at?: string | null
          status?: string
          trainer_id?: string
          updated_at?: string | null
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
      admin_trainer_overview: {
        Args: never
        Returns: {
          active_students: number
          created_at: string
          email: string
          expires_at: string
          full_name: string
          plan: string
          role: string
          sub_status: string
          user_id: string
        }[]
      }
      delete_trainer_complete: { Args: { t_id: string }; Returns: undefined }
      get_student_bio: {
        Args: { _student_id: string }
        Returns: {
          bmr: number
          body_fat_pct: number
          body_water_pct: number
          bone_mass: number
          id: string
          measured_at: string
          muscle_mass: number
          visceral_fat: number
          weight: number
        }[]
      }
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
      get_student_photos: {
        Args: { _student_id: string }
        Returns: {
          id: string
          notes: string
          photo_type: string
          photo_url: string
          taken_at: string
        }[]
      }
      get_student_sessions: {
        Args: { _student_id: string }
        Returns: {
          duration_minutes: number
          id: string
          muscle_groups: string[]
          notes: string
          scheduled_date: string
          scheduled_time: string
          status: string
        }[]
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

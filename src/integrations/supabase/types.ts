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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      additional_vaccines: {
        Row: {
          category: string
          created_at: string
          date: string | null
          id: string
          notes: string | null
          updated_at: string
          user_id: string
          vaccine_name: string | null
          year: string | null
        }
        Insert: {
          category: string
          created_at?: string
          date?: string | null
          id?: string
          notes?: string | null
          updated_at?: string
          user_id: string
          vaccine_name?: string | null
          year?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          date?: string | null
          id?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
          vaccine_name?: string | null
          year?: string | null
        }
        Relationships: []
      }
      audit_log: {
        Row: {
          action: string
          created_at: string
          id: string
          table_name: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          table_name: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          table_name?: string
          user_id?: string
        }
        Relationships: []
      }
      consents: {
        Row: {
          created_at: string
          health_data_accepted_at: string | null
          id: string
          ip_address: string | null
          terms_accepted_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          health_data_accepted_at?: string | null
          id?: string
          ip_address?: string | null
          terms_accepted_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          health_data_accepted_at?: string | null
          id?: string
          ip_address?: string | null
          terms_accepted_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      drug_intolerances: {
        Row: {
          created_at: string
          id: string
          intolerances_text: string | null
          nothing_to_report: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          intolerances_text?: string | null
          nothing_to_report?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          intolerances_text?: string | null
          nothing_to_report?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      hospital_stays: {
        Row: {
          created_at: string
          event: string | null
          hospital_country: string | null
          id: string
          notes: string | null
          updated_at: string
          user_id: string
          year: string | null
        }
        Insert: {
          created_at?: string
          event?: string | null
          hospital_country?: string | null
          id?: string
          notes?: string | null
          updated_at?: string
          user_id: string
          year?: string | null
        }
        Update: {
          created_at?: string
          event?: string | null
          hospital_country?: string | null
          id?: string
          notes?: string | null
          updated_at?: string
          user_id?: string
          year?: string | null
        }
        Relationships: []
      }
      lifestyle_risk: {
        Row: {
          alcohol_drinks_per_week: number | null
          alcohol_frequency: string | null
          alcohol_type: string | null
          created_at: string
          currently_in_treatment: boolean | null
          diet_other: string | null
          diet_restrictions: string[] | null
          exercise_duration: string | null
          exercise_frequency: string | null
          exercise_other: string | null
          exercise_types: string[] | null
          height_cm: number | null
          id: string
          mental_health_conditions: string[] | null
          mental_health_other: string | null
          mental_health_treated: boolean | null
          nothing_to_report: boolean
          sleep_issues: string[] | null
          sleep_status: string | null
          substances: string[] | null
          substances_other: string | null
          tobacco_amount: string | null
          tobacco_duration: string | null
          tobacco_products: string[] | null
          tobacco_status: string | null
          tobacco_year_stopped: string | null
          treatment_type: string[] | null
          updated_at: string
          user_id: string
          uses_cpap: boolean | null
          weight_kg: number | null
        }
        Insert: {
          alcohol_drinks_per_week?: number | null
          alcohol_frequency?: string | null
          alcohol_type?: string | null
          created_at?: string
          currently_in_treatment?: boolean | null
          diet_other?: string | null
          diet_restrictions?: string[] | null
          exercise_duration?: string | null
          exercise_frequency?: string | null
          exercise_other?: string | null
          exercise_types?: string[] | null
          height_cm?: number | null
          id?: string
          mental_health_conditions?: string[] | null
          mental_health_other?: string | null
          mental_health_treated?: boolean | null
          nothing_to_report?: boolean
          sleep_issues?: string[] | null
          sleep_status?: string | null
          substances?: string[] | null
          substances_other?: string | null
          tobacco_amount?: string | null
          tobacco_duration?: string | null
          tobacco_products?: string[] | null
          tobacco_status?: string | null
          tobacco_year_stopped?: string | null
          treatment_type?: string[] | null
          updated_at?: string
          user_id: string
          uses_cpap?: boolean | null
          weight_kg?: number | null
        }
        Update: {
          alcohol_drinks_per_week?: number | null
          alcohol_frequency?: string | null
          alcohol_type?: string | null
          created_at?: string
          currently_in_treatment?: boolean | null
          diet_other?: string | null
          diet_restrictions?: string[] | null
          exercise_duration?: string | null
          exercise_frequency?: string | null
          exercise_other?: string | null
          exercise_types?: string[] | null
          height_cm?: number | null
          id?: string
          mental_health_conditions?: string[] | null
          mental_health_other?: string | null
          mental_health_treated?: boolean | null
          nothing_to_report?: boolean
          sleep_issues?: string[] | null
          sleep_status?: string | null
          substances?: string[] | null
          substances_other?: string | null
          tobacco_amount?: string | null
          tobacco_duration?: string | null
          tobacco_products?: string[] | null
          tobacco_status?: string | null
          tobacco_year_stopped?: string | null
          treatment_type?: string[] | null
          updated_at?: string
          user_id?: string
          uses_cpap?: boolean | null
          weight_kg?: number | null
        }
        Relationships: []
      }
      medical_conditions: {
        Row: {
          conditions_text: string | null
          created_at: string
          id: string
          nothing_to_report: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          conditions_text?: string | null
          created_at?: string
          id?: string
          nothing_to_report?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          conditions_text?: string | null
          created_at?: string
          id?: string
          nothing_to_report?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      obstetric_history: {
        Row: {
          assisted_reproduction: boolean | null
          complications: string | null
          created_at: string
          gave_birth: boolean | null
          id: string
          not_applicable: boolean
          notes: string | null
          num_children: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          assisted_reproduction?: boolean | null
          complications?: string | null
          created_at?: string
          gave_birth?: boolean | null
          id?: string
          not_applicable?: boolean
          notes?: string | null
          num_children?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          assisted_reproduction?: boolean | null
          complications?: string | null
          created_at?: string
          gave_birth?: boolean | null
          id?: string
          not_applicable?: boolean
          notes?: string | null
          num_children?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      otc_supplements: {
        Row: {
          created_at: string
          dose: string | null
          frequency: string | null
          id: string
          product: string | null
          reason: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dose?: string | null
          frequency?: string | null
          id?: string
          product?: string | null
          reason?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dose?: string | null
          frequency?: string | null
          id?: string
          product?: string | null
          reason?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pairing_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          used: boolean
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          expires_at: string
          id?: string
          used?: boolean
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          used?: boolean
          user_id?: string
        }
        Relationships: []
      }
      past_conditions: {
        Row: {
          conditions_text: string | null
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          conditions_text?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          conditions_text?: string | null
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      prescription_medications: {
        Row: {
          brand_name: string | null
          created_at: string
          dose_form: string | null
          drug_generic: string | null
          frequency: string | null
          id: string
          prescriber: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          brand_name?: string | null
          created_at?: string
          dose_form?: string | null
          drug_generic?: string | null
          frequency?: string | null
          id?: string
          prescriber?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          brand_name?: string | null
          created_at?: string
          dose_form?: string | null
          drug_generic?: string | null
          frequency?: string | null
          id?: string
          prescriber?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          biological_sex: string | null
          blood_group: string | null
          country_of_residence: string | null
          created_at: string
          date_of_birth: string | null
          first_name: string | null
          id: string
          language: string
          last_name: string | null
          nationality: string | null
          phone: string | null
          setup_dismissed_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          biological_sex?: string | null
          blood_group?: string | null
          country_of_residence?: string | null
          created_at?: string
          date_of_birth?: string | null
          first_name?: string | null
          id?: string
          language?: string
          last_name?: string | null
          nationality?: string | null
          phone?: string | null
          setup_dismissed_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          biological_sex?: string | null
          blood_group?: string | null
          country_of_residence?: string | null
          created_at?: string
          date_of_birth?: string | null
          first_name?: string | null
          id?: string
          language?: string
          last_name?: string | null
          nationality?: string | null
          phone?: string | null
          setup_dismissed_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      standard_vaccines: {
        Row: {
          created_at: string
          date: string | null
          id: string
          received: boolean
          updated_at: string
          user_id: string
          vaccine_name: string
        }
        Insert: {
          created_at?: string
          date?: string | null
          id?: string
          received?: boolean
          updated_at?: string
          user_id: string
          vaccine_name: string
        }
        Update: {
          created_at?: string
          date?: string | null
          id?: string
          received?: boolean
          updated_at?: string
          user_id?: string
          vaccine_name?: string
        }
        Relationships: []
      }
      stopped_medications: {
        Row: {
          created_at: string
          dose: string | null
          drug_generic: string | null
          id: string
          period: string | null
          reason_stopped: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dose?: string | null
          drug_generic?: string | null
          id?: string
          period?: string | null
          reason_stopped?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dose?: string | null
          drug_generic?: string | null
          id?: string
          period?: string | null
          reason_stopped?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      travel_vaccines: {
        Row: {
          created_at: string
          date: string | null
          destination: string | null
          id: string
          updated_at: string
          user_id: string
          vaccine: string | null
          valid_until: string | null
        }
        Insert: {
          created_at?: string
          date?: string | null
          destination?: string | null
          id?: string
          updated_at?: string
          user_id: string
          vaccine?: string | null
          valid_until?: string | null
        }
        Update: {
          created_at?: string
          date?: string | null
          destination?: string | null
          id?: string
          updated_at?: string
          user_id?: string
          vaccine?: string | null
          valid_until?: string | null
        }
        Relationships: []
      }
      vaccination_certificates: {
        Row: {
          contraindication_notes: string | null
          created_at: string
          id: string
          ihr_card: string | null
          nothing_to_report: boolean
          other_vaccine_text: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          contraindication_notes?: string | null
          created_at?: string
          id?: string
          ihr_card?: string | null
          nothing_to_report?: boolean
          other_vaccine_text?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          contraindication_notes?: string | null
          created_at?: string
          id?: string
          ihr_card?: string | null
          nothing_to_report?: boolean
          other_vaccine_text?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vaccination_records: {
        Row: {
          batch_number: string | null
          created_at: string
          date: string | null
          id: string
          provider: string | null
          updated_at: string
          user_id: string
          vaccine: string | null
        }
        Insert: {
          batch_number?: string | null
          created_at?: string
          date?: string | null
          id?: string
          provider?: string | null
          updated_at?: string
          user_id: string
          vaccine?: string | null
        }
        Update: {
          batch_number?: string | null
          created_at?: string
          date?: string | null
          id?: string
          provider?: string | null
          updated_at?: string
          user_id?: string
          vaccine?: string | null
        }
        Relationships: []
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
    Enums: {},
  },
} as const

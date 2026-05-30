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
      allergies_summary: {
        Row: {
          created_at: string
          id: string
          nothing_to_report: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nothing_to_report?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nothing_to_report?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      allergy_drug_intolerances: {
        Row: {
          created_at: string
          drug_name: string
          id: string
          is_preset: boolean
          symptom: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          drug_name: string
          id?: string
          is_preset?: boolean
          symptom?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          drug_name?: string
          id?: string
          is_preset?: boolean
          symptom?: string | null
          updated_at?: string
          user_id?: string
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
      childhood_vaccines: {
        Row: {
          created_at: string
          id: string
          status: string
          updated_at: string
          user_id: string
          vaccine_name: string
          year_received: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_id: string
          vaccine_name: string
          year_received?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          status?: string
          updated_at?: string
          user_id?: string
          vaccine_name?: string
          year_received?: string | null
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
      contrast_allergies: {
        Row: {
          agent: string
          carry_epipen: boolean
          created_at: string
          id: string
          is_preset: boolean
          reaction: string | null
          reaction_type: string | null
          severity: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          agent: string
          carry_epipen?: boolean
          created_at?: string
          id?: string
          is_preset?: boolean
          reaction?: string | null
          reaction_type?: string | null
          severity?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          agent?: string
          carry_epipen?: boolean
          created_at?: string
          id?: string
          is_preset?: boolean
          reaction?: string | null
          reaction_type?: string | null
          severity?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      drug_allergies: {
        Row: {
          carry_epipen: boolean
          created_at: string
          drug_name: string
          id: string
          is_preset: boolean
          reaction: string | null
          reaction_type: string | null
          severity: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          carry_epipen?: boolean
          created_at?: string
          drug_name: string
          id?: string
          is_preset?: boolean
          reaction?: string | null
          reaction_type?: string | null
          severity?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          carry_epipen?: boolean
          created_at?: string
          drug_name?: string
          id?: string
          is_preset?: boolean
          reaction?: string | null
          reaction_type?: string | null
          severity?: string | null
          updated_at?: string
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
      environmental_allergies: {
        Row: {
          allergen: string
          carry_epipen: boolean
          created_at: string
          id: string
          is_preset: boolean
          reaction: string | null
          reaction_type: string | null
          severity: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          allergen: string
          carry_epipen?: boolean
          created_at?: string
          id?: string
          is_preset?: boolean
          reaction?: string | null
          reaction_type?: string | null
          severity?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          allergen?: string
          carry_epipen?: boolean
          created_at?: string
          id?: string
          is_preset?: boolean
          reaction?: string | null
          reaction_type?: string | null
          severity?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      food_allergies: {
        Row: {
          carry_epipen: boolean
          created_at: string
          food_item: string
          id: string
          is_preset: boolean
          reaction: string | null
          reaction_type: string | null
          severity: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          carry_epipen?: boolean
          created_at?: string
          food_item: string
          id?: string
          is_preset?: boolean
          reaction?: string | null
          reaction_type?: string | null
          severity?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          carry_epipen?: boolean
          created_at?: string
          food_item?: string
          id?: string
          is_preset?: boolean
          reaction?: string | null
          reaction_type?: string | null
          severity?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      heredity_conditions: {
        Row: {
          condition_name: string
          created_at: string
          id: string
          other_specify: string | null
          updated_at: string
          user_id: string
          which_relative: string | null
        }
        Insert: {
          condition_name: string
          created_at?: string
          id?: string
          other_specify?: string | null
          updated_at?: string
          user_id: string
          which_relative?: string | null
        }
        Update: {
          condition_name?: string
          created_at?: string
          id?: string
          other_specify?: string | null
          updated_at?: string
          user_id?: string
          which_relative?: string | null
        }
        Relationships: []
      }
      heredity_genetic_testing: {
        Row: {
          created_at: string
          dna_file_name: string | null
          dna_file_path: string | null
          dna_other: string | null
          dna_tests: string[] | null
          findings: string | null
          id: string
          tested: boolean | null
          under_counselling: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dna_file_name?: string | null
          dna_file_path?: string | null
          dna_other?: string | null
          dna_tests?: string[] | null
          findings?: string | null
          id?: string
          tested?: boolean | null
          under_counselling?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dna_file_name?: string | null
          dna_file_path?: string | null
          dna_other?: string | null
          dna_tests?: string[] | null
          findings?: string | null
          id?: string
          tested?: boolean | null
          under_counselling?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      heredity_parents: {
        Row: {
          age_at_death: number | null
          cause_of_death: string | null
          created_at: string
          current_age: number | null
          id: string
          known_conditions: string | null
          living_status: string | null
          parent_type: string
          unknown: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          age_at_death?: number | null
          cause_of_death?: string | null
          created_at?: string
          current_age?: number | null
          id?: string
          known_conditions?: string | null
          living_status?: string | null
          parent_type: string
          unknown?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          age_at_death?: number | null
          cause_of_death?: string | null
          created_at?: string
          current_age?: number | null
          id?: string
          known_conditions?: string | null
          living_status?: string | null
          parent_type?: string
          unknown?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      heredity_siblings: {
        Row: {
          created_at: string
          has_siblings: boolean | null
          id: string
          sibling_conditions: string | null
          sibling_count: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          has_siblings?: boolean | null
          id?: string
          sibling_conditions?: string | null
          sibling_count?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          has_siblings?: boolean | null
          id?: string
          sibling_conditions?: string | null
          sibling_count?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      heredity_summary: {
        Row: {
          created_at: string
          id: string
          nothing_to_report: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nothing_to_report?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
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
          alcohol_type: string[] | null
          alcohol_units_per_week: string | null
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
          narcotics_ever_injected: boolean | null
          narcotics_status: string | null
          narcotics_substances: string[] | null
          narcotics_substances_other: string | null
          narcotics_use_status: string | null
          nothing_to_report: boolean
          sleep_issues: string[] | null
          sleep_other: string | null
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
          alcohol_type?: string[] | null
          alcohol_units_per_week?: string | null
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
          narcotics_ever_injected?: boolean | null
          narcotics_status?: string | null
          narcotics_substances?: string[] | null
          narcotics_substances_other?: string | null
          narcotics_use_status?: string | null
          nothing_to_report?: boolean
          sleep_issues?: string[] | null
          sleep_other?: string | null
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
          alcohol_type?: string[] | null
          alcohol_units_per_week?: string | null
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
          narcotics_ever_injected?: boolean | null
          narcotics_status?: string | null
          narcotics_substances?: string[] | null
          narcotics_substances_other?: string | null
          narcotics_use_status?: string | null
          nothing_to_report?: boolean
          sleep_issues?: string[] | null
          sleep_other?: string | null
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
          condition_name: string
          created_at: string
          id: string
          is_resolved: boolean
          updated_at: string
          user_id: string
          year: string | null
        }
        Insert: {
          condition_name: string
          created_at?: string
          id?: string
          is_resolved?: boolean
          updated_at?: string
          user_id: string
          year?: string | null
        }
        Update: {
          condition_name?: string
          created_at?: string
          id?: string
          is_resolved?: boolean
          updated_at?: string
          user_id?: string
          year?: string | null
        }
        Relationships: []
      }
      medical_conditions_summary: {
        Row: {
          created_at: string
          id: string
          nothing_to_report: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nothing_to_report?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
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
      other_vaccines: {
        Row: {
          booster_dates: Json
          created_at: string
          date_received: string | null
          id: string
          updated_at: string
          user_id: string
          vaccine_name: string
        }
        Insert: {
          booster_dates?: Json
          created_at?: string
          date_received?: string | null
          id?: string
          updated_at?: string
          user_id: string
          vaccine_name: string
        }
        Update: {
          booster_dates?: Json
          created_at?: string
          date_received?: string | null
          id?: string
          updated_at?: string
          user_id?: string
          vaccine_name?: string
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
          validity_minutes: number
        }
        Insert: {
          code: string
          created_at?: string
          expires_at: string
          id?: string
          used?: boolean
          user_id: string
          validity_minutes?: number
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          used?: boolean
          user_id?: string
          validity_minutes?: number
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
          indication: string | null
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
          indication?: string | null
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
          indication?: string | null
          prescriber?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pro_sessions: {
        Row: {
          access_level: string
          created_at: string
          expires_at: string
          id: string
          institution: string | null
          last_accessed_at: string | null
          paired_at: string
          pairing_code_id: string | null
          pro_name: string
          pro_title: string | null
          revoked_at: string | null
          session_token: string
          updated_at: string
          user_id: string
        }
        Insert: {
          access_level?: string
          created_at?: string
          expires_at: string
          id?: string
          institution?: string | null
          last_accessed_at?: string | null
          paired_at?: string
          pairing_code_id?: string | null
          pro_name: string
          pro_title?: string | null
          revoked_at?: string | null
          session_token: string
          updated_at?: string
          user_id: string
        }
        Update: {
          access_level?: string
          created_at?: string
          expires_at?: string
          id?: string
          institution?: string | null
          last_accessed_at?: string | null
          paired_at?: string
          pairing_code_id?: string | null
          pro_name?: string
          pro_title?: string | null
          revoked_at?: string | null
          session_token?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
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
          avatar_url?: string | null
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
          avatar_url?: string | null
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
      record_comments: {
        Row: {
          body: string
          created_at: string
          entry_id: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          entry_id: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          entry_id?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "record_comments_entry_id_fkey"
            columns: ["entry_id"]
            isOneToOne: false
            referencedRelation: "record_entries"
            referencedColumns: ["id"]
          },
        ]
      }
      record_entries: {
        Row: {
          author_name: string | null
          author_role: string | null
          body: string | null
          created_at: string
          entry_type: string
          file_mime: string | null
          file_name: string | null
          file_path: string | null
          file_size: number | null
          id: string
          pro_session_id: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          author_name?: string | null
          author_role?: string | null
          body?: string | null
          created_at?: string
          entry_type: string
          file_mime?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          pro_session_id?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          author_name?: string | null
          author_role?: string | null
          body?: string | null
          created_at?: string
          entry_type?: string
          file_mime?: string | null
          file_name?: string | null
          file_path?: string | null
          file_size?: number | null
          id?: string
          pro_session_id?: string | null
          title?: string
          updated_at?: string
          user_id?: string
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
          booster_dates: Json
          created_at: string
          date_received: string | null
          destination: string
          id: string
          updated_at: string
          user_id: string
          vaccine_name: string
        }
        Insert: {
          booster_dates?: Json
          created_at?: string
          date_received?: string | null
          destination: string
          id?: string
          updated_at?: string
          user_id: string
          vaccine_name: string
        }
        Update: {
          booster_dates?: Json
          created_at?: string
          date_received?: string | null
          destination?: string
          id?: string
          updated_at?: string
          user_id?: string
          vaccine_name?: string
        }
        Relationships: []
      }
      vaccination_contraindications: {
        Row: {
          contraindication_notes: string | null
          created_at: string
          id: string
          nothing_to_report: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          contraindication_notes?: string | null
          created_at?: string
          id?: string
          nothing_to_report?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          contraindication_notes?: string | null
          created_at?: string
          id?: string
          nothing_to_report?: boolean
          updated_at?: string
          user_id?: string
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

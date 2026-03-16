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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      answer_votes: {
        Row: {
          answer_id: string
          voter_id: string
        }
        Insert: {
          answer_id: string
          voter_id: string
        }
        Update: {
          answer_id?: string
          voter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "answer_votes_answer_id_fkey"
            columns: ["answer_id"]
            isOneToOne: false
            referencedRelation: "answers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answer_votes_voter_id_fkey"
            columns: ["voter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      answers: {
        Row: {
          author_id: string | null
          body: string
          created_at: string | null
          id: string
          question_id: string | null
          upvotes: number | null
        }
        Insert: {
          author_id?: string | null
          body: string
          created_at?: string | null
          id?: string
          question_id?: string | null
          upvotes?: number | null
        }
        Update: {
          author_id?: string | null
          body?: string
          created_at?: string | null
          id?: string
          question_id?: string | null
          upvotes?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "answers_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_question_id_fkey"
            columns: ["question_id"]
            isOneToOne: false
            referencedRelation: "questions"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_progress: {
        Row: {
          completed_at: string | null
          id: string
          is_completed: boolean | null
          profile_id: string | null
          template_id: string | null
        }
        Insert: {
          completed_at?: string | null
          id?: string
          is_completed?: boolean | null
          profile_id?: string | null
          template_id?: string | null
        }
        Update: {
          completed_at?: string | null
          id?: string
          is_completed?: boolean | null
          profile_id?: string | null
          template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checklist_progress_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklist_progress_template_id_fkey"
            columns: ["template_id"]
            isOneToOne: false
            referencedRelation: "checklist_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_templates: {
        Row: {
          category: string
          deadline_description: string | null
          description: string | null
          id: string
          sort_order: number
          title: string
          university_id: string | null
          url: string | null
        }
        Insert: {
          category: string
          deadline_description?: string | null
          description?: string | null
          id?: string
          sort_order: number
          title: string
          university_id?: string | null
          url?: string | null
        }
        Update: {
          category?: string
          deadline_description?: string | null
          description?: string | null
          id?: string
          sort_order?: number
          title?: string
          university_id?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "checklist_templates_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      conversation_members: {
        Row: {
          conversation_id: string
          joined_at: string | null
          profile_id: string
        }
        Insert: {
          conversation_id: string
          joined_at?: string | null
          profile_id: string
        }
        Update: {
          conversation_id?: string
          joined_at?: string | null
          profile_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_members_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversation_members_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string | null
          faculty_id: string | null
          id: string
          last_message_at: string | null
          name: string | null
          type: string
        }
        Insert: {
          created_at?: string | null
          faculty_id?: string | null
          id?: string
          last_message_at?: string | null
          name?: string | null
          type?: string
        }
        Update: {
          created_at?: string | null
          faculty_id?: string | null
          id?: string
          last_message_at?: string | null
          name?: string | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "faculties"
            referencedColumns: ["id"]
          },
        ]
      }
      faculties: {
        Row: {
          id: string
          name: string
          short_name: string
          university_id: string | null
        }
        Insert: {
          id?: string
          name: string
          short_name: string
          university_id?: string | null
        }
        Update: {
          id?: string
          name?: string
          short_name?: string
          university_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "faculties_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      invite_codes: {
        Row: {
          code: string
          created_at: string | null
          expires_at: string | null
          id: string
          max_uses: number | null
          source: string
          university_id: string | null
          used_count: number | null
        }
        Insert: {
          code: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          source: string
          university_id?: string | null
          used_count?: number | null
        }
        Update: {
          code?: string
          created_at?: string | null
          expires_at?: string | null
          id?: string
          max_uses?: number | null
          source?: string
          university_id?: string | null
          used_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "invite_codes_university_id_fkey"
            columns: ["university_id"]
            isOneToOne: false
            referencedRelation: "universities"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string | null
          created_at: string | null
          id: string
          sender_id: string | null
        }
        Insert: {
          content: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          sender_id?: string | null
        }
        Update: {
          content?: string
          conversation_id?: string | null
          created_at?: string | null
          id?: string
          sender_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          faculty_id: string | null
          full_name: string
          home_city: string | null
          id: string
          invite_code_id: string | null
          is_active: boolean | null
          is_verified: boolean | null
          university_email: string | null
          updated_at: string | null
          year: number | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          faculty_id?: string | null
          full_name: string
          home_city?: string | null
          id: string
          invite_code_id?: string | null
          is_active?: boolean | null
          is_verified?: boolean | null
          university_email?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          faculty_id?: string | null
          full_name?: string
          home_city?: string | null
          id?: string
          invite_code_id?: string | null
          is_active?: boolean | null
          is_verified?: boolean | null
          university_email?: string | null
          updated_at?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "faculties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_invite_code_id_fkey"
            columns: ["invite_code_id"]
            isOneToOne: false
            referencedRelation: "invite_codes"
            referencedColumns: ["id"]
          },
        ]
      }
      questions: {
        Row: {
          author_id: string | null
          body: string | null
          created_at: string | null
          faculty_id: string | null
          id: string
          is_pinned: boolean | null
          title: string
        }
        Insert: {
          author_id?: string | null
          body?: string | null
          created_at?: string | null
          faculty_id?: string | null
          id?: string
          is_pinned?: boolean | null
          title: string
        }
        Update: {
          author_id?: string | null
          body?: string | null
          created_at?: string | null
          faculty_id?: string | null
          id?: string
          is_pinned?: boolean | null
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "questions_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "questions_faculty_id_fkey"
            columns: ["faculty_id"]
            isOneToOne: false
            referencedRelation: "faculties"
            referencedColumns: ["id"]
          },
        ]
      }
      quiz_answers: {
        Row: {
          cleanliness: number | null
          guests_frequency: number | null
          noise_tolerance: number | null
          pets: number | null
          profile_id: string
          sleep_schedule: number | null
          smoking: number | null
          study_vs_social: number | null
          updated_at: string | null
        }
        Insert: {
          cleanliness?: number | null
          guests_frequency?: number | null
          noise_tolerance?: number | null
          pets?: number | null
          profile_id: string
          sleep_schedule?: number | null
          smoking?: number | null
          study_vs_social?: number | null
          updated_at?: string | null
        }
        Update: {
          cleanliness?: number | null
          guests_frequency?: number | null
          noise_tolerance?: number | null
          pets?: number | null
          profile_id?: string
          sleep_schedule?: number | null
          smoking?: number | null
          study_vs_social?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "quiz_answers_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      roommate_preferences: {
        Row: {
          apartment_link: string | null
          budget_max: number | null
          budget_min: number | null
          gender_preference: string | null
          has_apartment: boolean | null
          looking_for_count: number | null
          move_in_month: string | null
          preferred_sectors: string[] | null
          profile_id: string
          updated_at: string | null
        }
        Insert: {
          apartment_link?: string | null
          budget_max?: number | null
          budget_min?: number | null
          gender_preference?: string | null
          has_apartment?: boolean | null
          looking_for_count?: number | null
          move_in_month?: string | null
          preferred_sectors?: string[] | null
          profile_id: string
          updated_at?: string | null
        }
        Update: {
          apartment_link?: string | null
          budget_max?: number | null
          budget_min?: number | null
          gender_preference?: string | null
          has_apartment?: boolean | null
          looking_for_count?: number | null
          move_in_month?: string | null
          preferred_sectors?: string[] | null
          profile_id?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "roommate_preferences_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      universities: {
        Row: {
          city: string | null
          email_domain: string | null
          id: string
          name: string
          short_name: string
        }
        Insert: {
          city?: string | null
          email_domain?: string | null
          id?: string
          name: string
          short_name: string
        }
        Update: {
          city?: string | null
          email_domain?: string | null
          id?: string
          name?: string
          short_name?: string
        }
        Relationships: []
      }
      university_email_verifications: {
        Row: {
          attempts: number | null
          code: string
          created_at: string | null
          email: string
          expires_at: string
          id: string
          profile_id: string | null
          verified: boolean | null
        }
        Insert: {
          attempts?: number | null
          code: string
          created_at?: string | null
          email: string
          expires_at: string
          id?: string
          profile_id?: string | null
          verified?: boolean | null
        }
        Update: {
          attempts?: number | null
          code?: string
          created_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          profile_id?: string | null
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "university_email_verifications_profile_id_fkey"
            columns: ["profile_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      find_direct_conversation: {
        Args: { user_a: string; user_b: string }
        Returns: string
      }
      get_or_create_dm: {
        Args: { user_a: string; user_b: string }
        Returns: string
      }
      join_faculty_group_chat: {
        Args: {
          p_faculty_id: string
          p_faculty_short_name: string
          p_profile_id: string
        }
        Returns: string
      }
      redeem_invite_code: { Args: { code_text: string }; Returns: string }
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

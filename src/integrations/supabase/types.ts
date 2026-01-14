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
      decisions: {
        Row: {
          created_at: string
          decision_date: string
          description: string | null
          id: string
          procedure_id: string | null
          project_id: string | null
          source_meeting: string | null
          status: Database["public"]["Enums"]["decision_status"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          decision_date?: string
          description?: string | null
          id?: string
          procedure_id?: string | null
          project_id?: string | null
          source_meeting?: string | null
          status?: Database["public"]["Enums"]["decision_status"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          decision_date?: string
          description?: string | null
          id?: string
          procedure_id?: string | null
          project_id?: string | null
          source_meeting?: string | null
          status?: Database["public"]["Enums"]["decision_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "decisions_procedure_id_fkey"
            columns: ["procedure_id"]
            isOneToOne: false
            referencedRelation: "procedures"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decisions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          created_at: string
          entity_id: string
          entity_type: string
          file_name: string
          file_path: string
          file_size: number | null
          file_type: string | null
          id: string
          uploaded_by: string | null
        }
        Insert: {
          created_at?: string
          entity_id: string
          entity_type: string
          file_name: string
          file_path: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          uploaded_by?: string | null
        }
        Update: {
          created_at?: string
          entity_id?: string
          entity_type?: string
          file_name?: string
          file_path?: string
          file_size?: number | null
          file_type?: string | null
          id?: string
          uploaded_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "documents_uploaded_by_fkey"
            columns: ["uploaded_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          phone: string | null
          role: string | null
          telegram_chat_id: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          role?: string | null
          telegram_chat_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          role?: string | null
          telegram_chat_id?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      procedures: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          status: Database["public"]["Enums"]["procedure_status"]
          title: string
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          status?: Database["public"]["Enums"]["procedure_status"]
          title: string
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          status?: Database["public"]["Enums"]["procedure_status"]
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string
          id: string
          theme_preference: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name: string
          id: string
          theme_preference?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string
          id?: string
          theme_preference?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          created_by: string | null
          description: string | null
          due_date: string | null
          id: string
          owner_id: string | null
          priority: Database["public"]["Enums"]["project_priority"]
          start_date: string | null
          status: Database["public"]["Enums"]["project_status"]
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          owner_id?: string | null
          priority?: Database["public"]["Enums"]["project_priority"]
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          description?: string | null
          due_date?: string | null
          id?: string
          owner_id?: string | null
          priority?: Database["public"]["Enums"]["project_priority"]
          start_date?: string | null
          status?: Database["public"]["Enums"]["project_status"]
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      security_documents: {
        Row: {
          category: Database["public"]["Enums"]["security_document_category"]
          created_at: string
          created_by: string | null
          description: string | null
          effective_date: string | null
          file_path: string | null
          id: string
          review_date: string | null
          status: Database["public"]["Enums"]["security_document_status"]
          title: string
          updated_at: string
          version: string | null
        }
        Insert: {
          category?: Database["public"]["Enums"]["security_document_category"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          effective_date?: string | null
          file_path?: string | null
          id?: string
          review_date?: string | null
          status?: Database["public"]["Enums"]["security_document_status"]
          title: string
          updated_at?: string
          version?: string | null
        }
        Update: {
          category?: Database["public"]["Enums"]["security_document_category"]
          created_at?: string
          created_by?: string | null
          description?: string | null
          effective_date?: string | null
          file_path?: string | null
          id?: string
          review_date?: string | null
          status?: Database["public"]["Enums"]["security_document_status"]
          title?: string
          updated_at?: string
          version?: string | null
        }
        Relationships: []
      }
      task_assignees: {
        Row: {
          created_at: string
          employee_id: string
          id: string
          task_id: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          id?: string
          task_id: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          id?: string
          task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_assignees_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_assignees_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      task_notes: {
        Row: {
          content: string
          created_at: string
          created_by: string | null
          id: string
          task_id: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          created_by?: string | null
          id?: string
          task_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          created_by?: string | null
          id?: string
          task_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_notes_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string | null
          deadline: string | null
          description: string | null
          id: string
          priority: Database["public"]["Enums"]["task_priority"]
          project_id: string | null
          status: Database["public"]["Enums"]["task_status"]
          title: string
          topic: string | null
          updated_at: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          description?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title: string
          topic?: string | null
          updated_at?: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string | null
          deadline?: string | null
          description?: string | null
          id?: string
          priority?: Database["public"]["Enums"]["task_priority"]
          project_id?: string | null
          status?: Database["public"]["Enums"]["task_status"]
          title?: string
          topic?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_assigned_to_fkey"
            columns: ["assigned_to"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
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
      get_user_role: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_admin: { Args: { _user_id: string }; Returns: boolean }
      is_ceo: { Args: { _user_id: string }; Returns: boolean }
      is_editor: { Args: { _user_id: string }; Returns: boolean }
      is_manager: { Args: { _user_id: string }; Returns: boolean }
    }
    Enums: {
      app_role:
        | "ceo"
        | "team_member"
        | "admin"
        | "manager"
        | "editor"
        | "viewer"
      decision_status: "active" | "cancelled" | "replaced"
      procedure_status: "draft" | "active" | "cancelled"
      project_priority: "low" | "medium" | "high"
      project_status: "planning" | "active" | "on_hold" | "completed"
      security_document_category: "policy" | "procedure" | "form" | "approval"
      security_document_status: "draft" | "active" | "archived"
      task_priority: "low" | "medium" | "high" | "urgent"
      task_status:
        | "new"
        | "approved"
        | "in_progress"
        | "stuck"
        | "done"
        | "partially_done"
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
      app_role: ["ceo", "team_member", "admin", "manager", "editor", "viewer"],
      decision_status: ["active", "cancelled", "replaced"],
      procedure_status: ["draft", "active", "cancelled"],
      project_priority: ["low", "medium", "high"],
      project_status: ["planning", "active", "on_hold", "completed"],
      security_document_category: ["policy", "procedure", "form", "approval"],
      security_document_status: ["draft", "active", "archived"],
      task_priority: ["low", "medium", "high", "urgent"],
      task_status: [
        "new",
        "approved",
        "in_progress",
        "stuck",
        "done",
        "partially_done",
      ],
    },
  },
} as const

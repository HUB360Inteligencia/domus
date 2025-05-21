export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      activities: {
        Row: {
          activity_type: string
          actual_cost: number | null
          completed_at: string | null
          contract_id: string | null
          created_at: string
          description: string | null
          due_date: string | null
          estimated_cost: number | null
          expense_id: string | null
          files: Json | null
          id: string
          priority: string
          property_id: string | null
          responsible_contact: string | null
          responsible_name: string | null
          responsible_notes: string | null
          start_date: string | null
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          activity_type: string
          actual_cost?: number | null
          completed_at?: string | null
          contract_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          estimated_cost?: number | null
          expense_id?: string | null
          files?: Json | null
          id?: string
          priority?: string
          property_id?: string | null
          responsible_contact?: string | null
          responsible_name?: string | null
          responsible_notes?: string | null
          start_date?: string | null
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          activity_type?: string
          actual_cost?: number | null
          completed_at?: string | null
          contract_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          estimated_cost?: number | null
          expense_id?: string | null
          files?: Json | null
          id?: string
          priority?: string
          property_id?: string | null
          responsible_contact?: string | null
          responsible_name?: string | null
          responsible_notes?: string | null
          start_date?: string | null
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activities_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_expense_id_fkey"
            columns: ["expense_id"]
            isOneToOne: false
            referencedRelation: "property_expenses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activities_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          is_default: boolean | null
          name: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean | null
          name: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          is_default?: boolean | null
          name?: string
          user_id?: string | null
        }
        Relationships: []
      }
      activity_category_relations: {
        Row: {
          activity_id: string
          category_id: string
        }
        Insert: {
          activity_id: string
          category_id: string
        }
        Update: {
          activity_id?: string
          category_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "activity_category_relations_activity_id_fkey"
            columns: ["activity_id"]
            isOneToOne: false
            referencedRelation: "activities"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_category_relations_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "activity_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      clauses: {
        Row: {
          category: string
          content: string
          created_at: string
          id: string
          is_standard: boolean | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          content: string
          created_at?: string
          id?: string
          is_standard?: boolean | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          content?: string
          created_at?: string
          id?: string
          is_standard?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      client_users: {
        Row: {
          client_id: string | null
          created_at: string
          id: string
          is_primary: boolean | null
          role: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean | null
          role?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          client_id?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean | null
          role?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "client_users_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          created_at: string
          document_number: string | null
          email: string
          id: string
          is_active: boolean
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          document_number?: string | null
          email: string
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          document_number?: string | null
          email?: string
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      contract_templates: {
        Row: {
          content: string
          created_at: string
          id: string
          is_default: boolean | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_default?: boolean | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      contracts: {
        Row: {
          client_id: string | null
          created_at: string
          deposit_value: number | null
          document_url: string | null
          end_date: string
          has_renewal_option: boolean | null
          id: string
          payment_day: number
          property_id: string | null
          renewal_terms: string | null
          signature_status: string | null
          special_conditions: string | null
          start_date: string
          status: string
          tenant_contact: string | null
          tenant_document: string | null
          tenant_name: string
          terms: string | null
          title: string
          updated_at: string
          user_id: string
          value: number
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          deposit_value?: number | null
          document_url?: string | null
          end_date: string
          has_renewal_option?: boolean | null
          id?: string
          payment_day: number
          property_id?: string | null
          renewal_terms?: string | null
          signature_status?: string | null
          special_conditions?: string | null
          start_date: string
          status: string
          tenant_contact?: string | null
          tenant_document?: string | null
          tenant_name: string
          terms?: string | null
          title: string
          updated_at?: string
          user_id: string
          value: number
        }
        Update: {
          client_id?: string | null
          created_at?: string
          deposit_value?: number | null
          document_url?: string | null
          end_date?: string
          has_renewal_option?: boolean | null
          id?: string
          payment_day?: number
          property_id?: string | null
          renewal_terms?: string | null
          signature_status?: string | null
          special_conditions?: string | null
          start_date?: string
          status?: string
          tenant_contact?: string | null
          tenant_document?: string | null
          tenant_name?: string
          terms?: string | null
          title?: string
          updated_at?: string
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "contracts_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "contracts_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      documents: {
        Row: {
          category: string
          client_id: string | null
          contract_id: string | null
          created_at: string
          file_path: string
          file_size: number
          file_type: string
          id: string
          is_encrypted: boolean | null
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          client_id?: string | null
          contract_id?: string | null
          created_at?: string
          file_path: string
          file_size: number
          file_type: string
          id?: string
          is_encrypted?: boolean | null
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          client_id?: string | null
          contract_id?: string | null
          created_at?: string
          file_path?: string
          file_size?: number
          file_type?: string
          id?: string
          is_encrypted?: boolean | null
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "documents_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "documents_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      invoices: {
        Row: {
          amount: number
          created_at: string
          due_date: string
          id: string
          paid_at: string | null
          payment_method: string | null
          status: string
          subscription_id: string
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          due_date: string
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          status: string
          subscription_id: string
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          due_date?: string
          id?: string
          paid_at?: string | null
          payment_method?: string | null
          status?: string
          subscription_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          app_notifications: boolean | null
          contract_expiration_alert: boolean | null
          contract_expiration_days: number[] | null
          contract_payment_alert: boolean | null
          contract_renewal_alert: boolean | null
          created_at: string
          email_notifications: boolean | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          app_notifications?: boolean | null
          contract_expiration_alert?: boolean | null
          contract_expiration_days?: number[] | null
          contract_payment_alert?: boolean | null
          contract_renewal_alert?: boolean | null
          created_at?: string
          email_notifications?: boolean | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          app_notifications?: boolean | null
          contract_expiration_alert?: boolean | null
          contract_expiration_days?: number[] | null
          contract_payment_alert?: boolean | null
          contract_renewal_alert?: boolean | null
          created_at?: string
          email_notifications?: boolean | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean | null
          message: string
          related_id: string | null
          related_to: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message: string
          related_id?: string | null
          related_to?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean | null
          message?: string
          related_id?: string | null
          related_to?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      permissions: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      plans: {
        Row: {
          created_at: string
          description: string | null
          features: Json | null
          id: string
          interval: string
          is_active: boolean
          max_properties: number | null
          max_users: number | null
          name: string
          price: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          interval: string
          is_active?: boolean
          max_properties?: number | null
          max_users?: number | null
          name: string
          price: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          interval?: string
          is_active?: boolean
          max_properties?: number | null
          max_users?: number | null
          name?: string
          price?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          activation_token: string | null
          activation_token_expires_at: string | null
          avatar_url: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          updated_at: string | null
        }
        Insert: {
          activation_token?: string | null
          activation_token_expires_at?: string | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          updated_at?: string | null
        }
        Update: {
          activation_token?: string | null
          activation_token_expires_at?: string | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string
          agency_contact: string | null
          agency_name: string | null
          agency_responsible: string | null
          area: number | null
          bathrooms: number | null
          bedrooms: number | null
          city: string
          client_id: string | null
          complement: string | null
          condo_fee: number | null
          created_at: string
          description: string | null
          features: Json | null
          floor_number: number | null
          furnished: string | null
          garage_spots: number | null
          id: string
          image_url: string | null
          latitude: number | null
          longitude: number | null
          neighborhood: string | null
          property_number: string | null
          purchase_date: string | null
          purchase_value: number | null
          square_meter_value: number | null
          state: string
          status: string
          tenant_contact: string | null
          tenant_name: string | null
          title: string
          type: string
          updated_at: string
          user_id: string
          value: number
          zip_code: string | null
        }
        Insert: {
          address: string
          agency_contact?: string | null
          agency_name?: string | null
          agency_responsible?: string | null
          area?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          city: string
          client_id?: string | null
          complement?: string | null
          condo_fee?: number | null
          created_at?: string
          description?: string | null
          features?: Json | null
          floor_number?: number | null
          furnished?: string | null
          garage_spots?: number | null
          id?: string
          image_url?: string | null
          latitude?: number | null
          longitude?: number | null
          neighborhood?: string | null
          property_number?: string | null
          purchase_date?: string | null
          purchase_value?: number | null
          square_meter_value?: number | null
          state: string
          status: string
          tenant_contact?: string | null
          tenant_name?: string | null
          title: string
          type: string
          updated_at?: string
          user_id: string
          value: number
          zip_code?: string | null
        }
        Update: {
          address?: string
          agency_contact?: string | null
          agency_name?: string | null
          agency_responsible?: string | null
          area?: number | null
          bathrooms?: number | null
          bedrooms?: number | null
          city?: string
          client_id?: string | null
          complement?: string | null
          condo_fee?: number | null
          created_at?: string
          description?: string | null
          features?: Json | null
          floor_number?: number | null
          furnished?: string | null
          garage_spots?: number | null
          id?: string
          image_url?: string | null
          latitude?: number | null
          longitude?: number | null
          neighborhood?: string | null
          property_number?: string | null
          purchase_date?: string | null
          purchase_value?: number | null
          square_meter_value?: number | null
          state?: string
          status?: string
          tenant_contact?: string | null
          tenant_name?: string | null
          title?: string
          type?: string
          updated_at?: string
          user_id?: string
          value?: number
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      property_expenses: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          expense_type: string
          id: string
          maintenance_details: string | null
          paid_at: string
          property_id: string
          receipt_url: string | null
          updated_at: string
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          expense_type: string
          id?: string
          maintenance_details?: string | null
          paid_at: string
          property_id: string
          receipt_url?: string | null
          updated_at?: string
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          expense_type?: string
          id?: string
          maintenance_details?: string | null
          paid_at?: string
          property_id?: string
          receipt_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_expenses_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string | null
          id: string
          permission_id: string
          role_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          permission_id: string
          role_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          permission_id?: string
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_permission_id_fkey"
            columns: ["permission_id"]
            isOneToOne: false
            referencedRelation: "permissions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
      roles: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          name: Database["public"]["Enums"]["app_role"]
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          name: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: string
          name?: Database["public"]["Enums"]["app_role"]
          updated_at?: string | null
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          client_id: string
          created_at: string
          ends_at: string | null
          id: string
          is_auto_renewal: boolean
          payment_status: string
          plan_id: string
          starts_at: string
          status: string
          updated_at: string
        }
        Insert: {
          client_id: string
          created_at?: string
          ends_at?: string | null
          id?: string
          is_auto_renewal?: boolean
          payment_status: string
          plan_id: string
          starts_at?: string
          status: string
          updated_at?: string
        }
        Update: {
          client_id?: string
          created_at?: string
          ends_at?: string | null
          id?: string
          is_auto_renewal?: boolean
          payment_status?: string
          plan_id?: string
          starts_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "roles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role: {
        Args: { user_id: string }
        Returns: Database["public"]["Enums"]["app_role"]
      }
      user_belongs_to_client: {
        Args: { user_id: string; client_id: string }
        Returns: boolean
      }
      user_has_permission: {
        Args: { user_id: string; permission_name: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "manager" | "user" | "viewer" | "system_admin"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "manager", "user", "viewer", "system_admin"],
    },
  },
} as const

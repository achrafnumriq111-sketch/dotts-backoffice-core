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
      dotts_admins: {
        Row: {
          created_at: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          role?: string
          user_id: string
        }
        Update: {
          created_at?: string
          role?: string
          user_id?: string
        }
        Relationships: []
      }
      invoices: {
        Row: {
          amount_cents: number
          created_at: string
          currency: string
          description: string | null
          due_at: string | null
          id: string
          kind: string
          org_id: string
          paid_at: string | null
          period_end: string | null
          period_start: string | null
          status: string
          stripe_invoice_id: string | null
          stripe_payment_intent: string | null
          updated_at: string
        }
        Insert: {
          amount_cents: number
          created_at?: string
          currency?: string
          description?: string | null
          due_at?: string | null
          id?: string
          kind: string
          org_id: string
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: string
          stripe_invoice_id?: string | null
          stripe_payment_intent?: string | null
          updated_at?: string
        }
        Update: {
          amount_cents?: number
          created_at?: string
          currency?: string
          description?: string | null
          due_at?: string | null
          id?: string
          kind?: string
          org_id?: string
          paid_at?: string | null
          period_end?: string | null
          period_start?: string | null
          status?: string
          stripe_invoice_id?: string | null
          stripe_payment_intent?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "invoices_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      locations: {
        Row: {
          address_city: string | null
          address_country: string | null
          address_postal_code: string | null
          address_street: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          is_primary: boolean
          name: string
          org_id: string
          phone: string | null
          timezone: string | null
          updated_at: string
        }
        Insert: {
          address_city?: string | null
          address_country?: string | null
          address_postal_code?: string | null
          address_street?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          is_primary?: boolean
          name: string
          org_id: string
          phone?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Update: {
          address_city?: string | null
          address_country?: string | null
          address_postal_code?: string | null
          address_street?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          is_primary?: boolean
          name?: string
          org_id?: string
          phone?: string | null
          timezone?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "locations_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_url: string | null
          body: string | null
          created_at: string
          dismissed_at: string | null
          expires_at: string | null
          id: string
          invoice_id: string | null
          kind: string
          org_id: string
          severity: string
          title: string
        }
        Insert: {
          action_url?: string | null
          body?: string | null
          created_at?: string
          dismissed_at?: string | null
          expires_at?: string | null
          id?: string
          invoice_id?: string | null
          kind: string
          org_id: string
          severity?: string
          title: string
        }
        Update: {
          action_url?: string | null
          body?: string | null
          created_at?: string
          dismissed_at?: string | null
          expires_at?: string | null
          id?: string
          invoice_id?: string | null
          kind?: string
          org_id?: string
          severity?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_invoice_id_fkey"
            columns: ["invoice_id"]
            isOneToOne: false
            referencedRelation: "invoices"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notifications_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_counters: {
        Row: {
          next_receipt_number: number
          org_id: string
        }
        Insert: {
          next_receipt_number?: number
          org_id: string
        }
        Update: {
          next_receipt_number?: number
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_counters_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_members: {
        Row: {
          created_at: string | null
          id: string
          org_id: string
          role: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          org_id: string
          role?: Database["public"]["Enums"]["org_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          org_id?: string
          role?: Database["public"]["Enums"]["org_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_members_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_settings: {
        Row: {
          address_city: string | null
          address_country: string | null
          address_postal_code: string | null
          address_street: string | null
          company_name: string | null
          created_at: string
          currency: string | null
          email: string | null
          kvk_number: string | null
          locale: string | null
          org_id: string
          phone: string | null
          receipt_footer: string | null
          receipt_logo_url: string | null
          timezone: string | null
          updated_at: string
          vat_number: string | null
          website: string | null
        }
        Insert: {
          address_city?: string | null
          address_country?: string | null
          address_postal_code?: string | null
          address_street?: string | null
          company_name?: string | null
          created_at?: string
          currency?: string | null
          email?: string | null
          kvk_number?: string | null
          locale?: string | null
          org_id: string
          phone?: string | null
          receipt_footer?: string | null
          receipt_logo_url?: string | null
          timezone?: string | null
          updated_at?: string
          vat_number?: string | null
          website?: string | null
        }
        Update: {
          address_city?: string | null
          address_country?: string | null
          address_postal_code?: string | null
          address_street?: string | null
          company_name?: string | null
          created_at?: string
          currency?: string | null
          email?: string | null
          kvk_number?: string | null
          locale?: string | null
          org_id?: string
          phone?: string | null
          receipt_footer?: string | null
          receipt_logo_url?: string | null
          timezone?: string | null
          updated_at?: string
          vat_number?: string | null
          website?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "org_settings_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          address: string | null
          country: string | null
          created_at: string | null
          id: string
          name: string
          phone: string | null
          slug: string
          stripe_customer_id: string | null
          subscription_status: string | null
          trial_ends_at: string | null
          updated_at: string | null
          vat_number: string | null
        }
        Insert: {
          address?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          name: string
          phone?: string | null
          slug: string
          stripe_customer_id?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          vat_number?: string | null
        }
        Update: {
          address?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          name?: string
          phone?: string | null
          slug?: string
          stripe_customer_id?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          vat_number?: string | null
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_cents: number
          change_cents: number | null
          created_at: string
          id: string
          method: string
          reference: string | null
          sale_id: string
          tendered_cents: number | null
        }
        Insert: {
          amount_cents: number
          change_cents?: number | null
          created_at?: string
          id?: string
          method: string
          reference?: string | null
          sale_id: string
          tendered_cents?: number | null
        }
        Update: {
          amount_cents?: number
          change_cents?: number | null
          created_at?: string
          id?: string
          method?: string
          reference?: string | null
          sale_id?: string
          tendered_cents?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string
          currency: string
          is_active: boolean
          key: string
          min_contract_months: number
          monthly_price_cents: number
          name: string
          setup_fee_cents: number
          updated_at: string
          yearly_price_cents: number
        }
        Insert: {
          created_at?: string
          currency?: string
          is_active?: boolean
          key: string
          min_contract_months?: number
          monthly_price_cents: number
          name: string
          setup_fee_cents?: number
          updated_at?: string
          yearly_price_cents: number
        }
        Update: {
          created_at?: string
          currency?: string
          is_active?: boolean
          key?: string
          min_contract_months?: number
          monthly_price_cents?: number
          name?: string
          setup_fee_cents?: number
          updated_at?: string
          yearly_price_cents?: number
        }
        Relationships: []
      }
      product_categories: {
        Row: {
          color: string | null
          created_at: string
          id: string
          is_active: boolean
          name: string
          org_id: string
          sort_order: number
        }
        Insert: {
          color?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name: string
          org_id: string
          sort_order?: number
        }
        Update: {
          color?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          org_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          barcode: string | null
          category_id: string | null
          created_at: string
          currency: string
          id: string
          is_active: boolean
          name: string
          org_id: string
          price_cents: number
          sku: string | null
          sort_order: number
          stock_quantity: number
          tax_rate_id: string | null
          track_stock: boolean
          updated_at: string
        }
        Insert: {
          barcode?: string | null
          category_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          name: string
          org_id: string
          price_cents: number
          sku?: string | null
          sort_order?: number
          stock_quantity?: number
          tax_rate_id?: string | null
          track_stock?: boolean
          updated_at?: string
        }
        Update: {
          barcode?: string | null
          category_id?: string | null
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          name?: string
          org_id?: string
          price_cents?: number
          sku?: string | null
          sort_order?: number
          stock_quantity?: number
          tax_rate_id?: string | null
          track_stock?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_tax_rate_id_fkey"
            columns: ["tax_rate_id"]
            isOneToOne: false
            referencedRelation: "tax_rates"
            referencedColumns: ["id"]
          },
        ]
      }
      register_closes: {
        Row: {
          closed_at: string | null
          closed_by: string | null
          closing_cash_cents: number | null
          created_at: string
          difference_cents: number | null
          expected_cash_cents: number | null
          id: string
          location_id: string | null
          notes: string | null
          opened_at: string
          opening_cash_cents: number
          org_id: string
          status: string
          total_card_cents: number | null
          total_cash_cents: number | null
          total_sales_cents: number | null
          transaction_count: number | null
          updated_at: string
        }
        Insert: {
          closed_at?: string | null
          closed_by?: string | null
          closing_cash_cents?: number | null
          created_at?: string
          difference_cents?: number | null
          expected_cash_cents?: number | null
          id?: string
          location_id?: string | null
          notes?: string | null
          opened_at: string
          opening_cash_cents?: number
          org_id: string
          status?: string
          total_card_cents?: number | null
          total_cash_cents?: number | null
          total_sales_cents?: number | null
          transaction_count?: number | null
          updated_at?: string
        }
        Update: {
          closed_at?: string | null
          closed_by?: string | null
          closing_cash_cents?: number | null
          created_at?: string
          difference_cents?: number | null
          expected_cash_cents?: number | null
          id?: string
          location_id?: string | null
          notes?: string | null
          opened_at?: string
          opening_cash_cents?: number
          org_id?: string
          status?: string
          total_card_cents?: number | null
          total_cash_cents?: number | null
          total_sales_cents?: number | null
          transaction_count?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "register_closes_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "register_closes_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sale_items: {
        Row: {
          created_at: string
          id: string
          line_discount_cents: number
          line_subtotal_cents: number
          line_tax_cents: number
          line_total_cents: number
          name_snapshot: string
          price_cents_snapshot: number
          product_id: string | null
          quantity: number
          sale_id: string
          tax_rate_bps_snapshot: number
        }
        Insert: {
          created_at?: string
          id?: string
          line_discount_cents?: number
          line_subtotal_cents: number
          line_tax_cents?: number
          line_total_cents: number
          name_snapshot: string
          price_cents_snapshot: number
          product_id?: string | null
          quantity?: number
          sale_id: string
          tax_rate_bps_snapshot?: number
        }
        Update: {
          created_at?: string
          id?: string
          line_discount_cents?: number
          line_subtotal_cents?: number
          line_tax_cents?: number
          line_total_cents?: number
          name_snapshot?: string
          price_cents_snapshot?: number
          product_id?: string | null
          quantity?: number
          sale_id?: string
          tax_rate_bps_snapshot?: number
        }
        Relationships: [
          {
            foreignKeyName: "sale_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sale_items_sale_id_fkey"
            columns: ["sale_id"]
            isOneToOne: false
            referencedRelation: "sales"
            referencedColumns: ["id"]
          },
        ]
      }
      sales: {
        Row: {
          created_at: string
          currency: string
          customer_email: string | null
          customer_name: string | null
          discount_cents: number
          id: string
          location_id: string | null
          notes: string | null
          org_id: string
          receipt_number: string
          status: string
          subtotal_cents: number
          tax_cents: number
          total_cents: number
          updated_at: string
          user_id: string | null
          voided_at: string | null
          voided_by: string | null
        }
        Insert: {
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_name?: string | null
          discount_cents?: number
          id?: string
          location_id?: string | null
          notes?: string | null
          org_id: string
          receipt_number: string
          status?: string
          subtotal_cents?: number
          tax_cents?: number
          total_cents?: number
          updated_at?: string
          user_id?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Update: {
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_name?: string | null
          discount_cents?: number
          id?: string
          location_id?: string | null
          notes?: string | null
          org_id?: string
          receipt_number?: string
          status?: string
          subtotal_cents?: number
          tax_cents?: number
          total_cents?: number
          updated_at?: string
          user_id?: string | null
          voided_at?: string | null
          voided_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sales_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sales_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          billing_cycle: string
          cancel_effective_at: string | null
          cancel_requested_at: string | null
          contract_min_end_at: string | null
          contract_start_at: string | null
          created_at: string
          currency: string
          current_period_end: string | null
          current_period_start: string | null
          org_id: string
          pending_price_cents: number | null
          pending_price_effective_at: string | null
          plan_key: string
          price_cents: number
          setup_fee_cents: number
          setup_fee_status: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          updated_at: string
        }
        Insert: {
          billing_cycle?: string
          cancel_effective_at?: string | null
          cancel_requested_at?: string | null
          contract_min_end_at?: string | null
          contract_start_at?: string | null
          created_at?: string
          currency?: string
          current_period_end?: string | null
          current_period_start?: string | null
          org_id: string
          pending_price_cents?: number | null
          pending_price_effective_at?: string | null
          plan_key?: string
          price_cents: number
          setup_fee_cents?: number
          setup_fee_status?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Update: {
          billing_cycle?: string
          cancel_effective_at?: string | null
          cancel_requested_at?: string | null
          contract_min_end_at?: string | null
          contract_start_at?: string | null
          created_at?: string
          currency?: string
          current_period_end?: string | null
          current_period_start?: string | null
          org_id?: string
          pending_price_cents?: number | null
          pending_price_effective_at?: string | null
          plan_key?: string
          price_cents?: number
          setup_fee_cents?: number
          setup_fee_status?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_plan_key_fkey"
            columns: ["plan_key"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["key"]
          },
        ]
      }
      tax_rates: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          is_default: boolean
          name: string
          org_id: string
          rate_bps: number
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          name: string
          org_id: string
          rate_bps: number
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          is_default?: boolean
          name?: string
          org_id?: string
          rate_bps?: number
        }
        Relationships: [
          {
            foreignKeyName: "tax_rates_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      is_dotts_admin: { Args: never; Returns: boolean }
      next_receipt_number: { Args: { p_org_id: string }; Returns: string }
      org_is_locked: { Args: { p_org_id: string }; Returns: boolean }
      process_overdue_invoices: { Args: never; Returns: undefined }
      user_org_ids: { Args: never; Returns: string[] }
    }
    Enums: {
      org_role: "owner" | "admin" | "manager" | "staff"
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
      org_role: ["owner", "admin", "manager", "staff"],
    },
  },
} as const

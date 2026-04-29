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
      availability_exceptions: {
        Row: {
          created_at: string
          employee_id: string
          end_time: string | null
          id: string
          is_available: boolean
          on_date: string
          org_id: string
          reason: string | null
          start_time: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          employee_id: string
          end_time?: string | null
          id?: string
          is_available?: boolean
          on_date: string
          org_id: string
          reason?: string | null
          start_time?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          employee_id?: string
          end_time?: string | null
          id?: string
          is_available?: boolean
          on_date?: string
          org_id?: string
          reason?: string | null
          start_time?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_exceptions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_exceptions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      availability_patterns: {
        Row: {
          created_at: string
          day_of_week: number
          employee_id: string
          end_time: string
          id: string
          is_available: boolean
          notes: string | null
          org_id: string
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          day_of_week: number
          employee_id: string
          end_time: string
          id?: string
          is_available?: boolean
          notes?: string | null
          org_id: string
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          day_of_week?: number
          employee_id?: string
          end_time?: string
          id?: string
          is_available?: boolean
          notes?: string | null
          org_id?: string
          start_time?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "availability_patterns_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "availability_patterns_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_envelope_sequences: {
        Row: {
          created_at: string
          current_value: number
          id: string
          org_id: string
          padding: number
          prefix: string
          updated_at: string
          year: number
        }
        Insert: {
          created_at?: string
          current_value?: number
          id?: string
          org_id: string
          padding?: number
          prefix?: string
          updated_at?: string
          year: number
        }
        Update: {
          created_at?: string
          current_value?: number
          id?: string
          org_id?: string
          padding?: number
          prefix?: string
          updated_at?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "cash_envelope_sequences_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
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
      employee_private: {
        Row: {
          birthdate: string | null
          bsn: string | null
          created_at: string
          emergency_contact_name: string | null
          emergency_contact_phone: string | null
          employee_id: string
          hourly_wage_cents: number | null
          iban: string | null
          org_id: string
          updated_at: string
        }
        Insert: {
          birthdate?: string | null
          bsn?: string | null
          created_at?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_id: string
          hourly_wage_cents?: number | null
          iban?: string | null
          org_id: string
          updated_at?: string
        }
        Update: {
          birthdate?: string | null
          bsn?: string | null
          created_at?: string
          emergency_contact_name?: string | null
          emergency_contact_phone?: string | null
          employee_id?: string
          hourly_wage_cents?: number | null
          iban?: string | null
          org_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employee_private_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: true
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employee_private_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      employees: {
        Row: {
          contract_file_name: string | null
          contract_file_url: string | null
          contract_hours_per_week: number | null
          created_at: string
          created_by: string | null
          display_name: string | null
          email: string | null
          employment_type: Database["public"]["Enums"]["employment_type"]
          end_date: string | null
          first_name: string
          id: string
          invited_at: string | null
          is_active: boolean
          last_name: string
          notes: string | null
          org_id: string
          phone: string | null
          position_id: string | null
          start_date: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          contract_file_name?: string | null
          contract_file_url?: string | null
          contract_hours_per_week?: number | null
          created_at?: string
          created_by?: string | null
          display_name?: string | null
          email?: string | null
          employment_type?: Database["public"]["Enums"]["employment_type"]
          end_date?: string | null
          first_name: string
          id?: string
          invited_at?: string | null
          is_active?: boolean
          last_name: string
          notes?: string | null
          org_id: string
          phone?: string | null
          position_id?: string | null
          start_date?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          contract_file_name?: string | null
          contract_file_url?: string | null
          contract_hours_per_week?: number | null
          created_at?: string
          created_by?: string | null
          display_name?: string | null
          email?: string | null
          employment_type?: Database["public"]["Enums"]["employment_type"]
          end_date?: string | null
          first_name?: string
          id?: string
          invited_at?: string | null
          is_active?: boolean
          last_name?: string
          notes?: string | null
          org_id?: string
          phone?: string | null
          position_id?: string | null
          start_date?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "employees_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "employees_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
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
      modifier_groups: {
        Row: {
          active: boolean
          created_at: string
          id: string
          max_select: number
          min_select: number
          name: string
          org_id: string
          required: boolean
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          max_select?: number
          min_select?: number
          name: string
          org_id: string
          required?: boolean
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          max_select?: number
          min_select?: number
          name?: string
          org_id?: string
          required?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "modifier_groups_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      modifiers: {
        Row: {
          active: boolean
          created_at: string
          group_id: string
          id: string
          name: string
          org_id: string
          price_delta_cents: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          group_id: string
          id?: string
          name: string
          org_id: string
          price_delta_cents?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          group_id?: string
          id?: string
          name?: string
          org_id?: string
          price_delta_cents?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "modifiers_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "modifier_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "modifiers_org_id_fkey"
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
          city: string | null
          country: string | null
          created_at: string | null
          email: string | null
          id: string
          kvk_number: string | null
          legal_name: string | null
          logo_url: string | null
          name: string
          phone: string | null
          postal_code: string | null
          primary_color: string | null
          receipt_footer: string | null
          receipt_header: string | null
          receipt_show_address: boolean | null
          receipt_show_contact: boolean | null
          receipt_show_kvk: boolean | null
          receipt_show_logo: boolean | null
          receipt_show_vat_number: boolean | null
          setup_fee_paid: boolean
          setup_fee_paid_at: string | null
          slug: string
          street: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_current_period_end: string | null
          subscription_status: string | null
          trial_ends_at: string | null
          updated_at: string | null
          vat_number: string | null
          website: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          kvk_number?: string | null
          legal_name?: string | null
          logo_url?: string | null
          name: string
          phone?: string | null
          postal_code?: string | null
          primary_color?: string | null
          receipt_footer?: string | null
          receipt_header?: string | null
          receipt_show_address?: boolean | null
          receipt_show_contact?: boolean | null
          receipt_show_kvk?: boolean | null
          receipt_show_logo?: boolean | null
          receipt_show_vat_number?: boolean | null
          setup_fee_paid?: boolean
          setup_fee_paid_at?: string | null
          slug: string
          street?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_current_period_end?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          vat_number?: string | null
          website?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          email?: string | null
          id?: string
          kvk_number?: string | null
          legal_name?: string | null
          logo_url?: string | null
          name?: string
          phone?: string | null
          postal_code?: string | null
          primary_color?: string | null
          receipt_footer?: string | null
          receipt_header?: string | null
          receipt_show_address?: boolean | null
          receipt_show_contact?: boolean | null
          receipt_show_kvk?: boolean | null
          receipt_show_logo?: boolean | null
          receipt_show_vat_number?: boolean | null
          setup_fee_paid?: boolean
          setup_fee_paid_at?: string | null
          slug?: string
          street?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_current_period_end?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
          updated_at?: string | null
          vat_number?: string | null
          website?: string | null
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
      positions: {
        Row: {
          color: string | null
          created_at: string
          default_hourly_wage_cents: number | null
          id: string
          is_active: boolean
          name: string
          org_id: string
          permissions: Json
          sort_order: number
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          default_hourly_wage_cents?: number | null
          id?: string
          is_active?: boolean
          name: string
          org_id: string
          permissions?: Json
          sort_order?: number
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          default_hourly_wage_cents?: number | null
          id?: string
          is_active?: boolean
          name?: string
          org_id?: string
          permissions?: Json
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "positions_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
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
      product_modifier_groups: {
        Row: {
          created_at: string
          group_id: string
          org_id: string
          product_id: string
          sort_order: number
        }
        Insert: {
          created_at?: string
          group_id: string
          org_id: string
          product_id: string
          sort_order?: number
        }
        Update: {
          created_at?: string
          group_id?: string
          org_id?: string
          product_id?: string
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "product_modifier_groups_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "modifier_groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_modifier_groups_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_modifier_groups_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          active: boolean
          created_at: string
          id: string
          name: string
          org_id: string
          price_cents: number
          product_id: string
          sku: string | null
          sort_order: number
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          name: string
          org_id: string
          price_cents: number
          product_id: string
          sku?: string | null
          sort_order?: number
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          name?: string
          org_id?: string
          price_cents?: number
          product_id?: string
          sku?: string | null
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
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
      register_sessions: {
        Row: {
          cash_sales_cents: number | null
          closed_at: string | null
          closed_by: string | null
          counted_cash_cents: number | null
          created_at: string
          envelope_assigned_at: string | null
          envelope_assigned_by: string | null
          envelope_number: string | null
          envelope_sequence: number | null
          envelope_year: number | null
          expected_cash_cents: number | null
          id: string
          location_id: string
          notes: string | null
          opened_at: string
          opened_by: string
          opening_float_cents: number
          org_id: string
          pin_sales_cents: number | null
          sale_count: number | null
          status: string
          total_sales_cents: number | null
          variance_cents: number | null
        }
        Insert: {
          cash_sales_cents?: number | null
          closed_at?: string | null
          closed_by?: string | null
          counted_cash_cents?: number | null
          created_at?: string
          envelope_assigned_at?: string | null
          envelope_assigned_by?: string | null
          envelope_number?: string | null
          envelope_sequence?: number | null
          envelope_year?: number | null
          expected_cash_cents?: number | null
          id?: string
          location_id: string
          notes?: string | null
          opened_at?: string
          opened_by: string
          opening_float_cents: number
          org_id: string
          pin_sales_cents?: number | null
          sale_count?: number | null
          status?: string
          total_sales_cents?: number | null
          variance_cents?: number | null
        }
        Update: {
          cash_sales_cents?: number | null
          closed_at?: string | null
          closed_by?: string | null
          counted_cash_cents?: number | null
          created_at?: string
          envelope_assigned_at?: string | null
          envelope_assigned_by?: string | null
          envelope_number?: string | null
          envelope_sequence?: number | null
          envelope_year?: number | null
          expected_cash_cents?: number | null
          id?: string
          location_id?: string
          notes?: string | null
          opened_at?: string
          opened_by?: string
          opening_float_cents?: number
          org_id?: string
          pin_sales_cents?: number | null
          sale_count?: number | null
          status?: string
          total_sales_cents?: number | null
          variance_cents?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "register_sessions_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "register_sessions_org_id_fkey"
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
          modifiers: Json
          name_snapshot: string
          price_cents_snapshot: number
          product_id: string | null
          quantity: number
          sale_id: string
          tax_rate_bps_snapshot: number
          variant_id: string | null
          variant_name: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          line_discount_cents?: number
          line_subtotal_cents: number
          line_tax_cents?: number
          line_total_cents: number
          modifiers?: Json
          name_snapshot: string
          price_cents_snapshot: number
          product_id?: string | null
          quantity?: number
          sale_id: string
          tax_rate_bps_snapshot?: number
          variant_id?: string | null
          variant_name?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          line_discount_cents?: number
          line_subtotal_cents?: number
          line_tax_cents?: number
          line_total_cents?: number
          modifiers?: Json
          name_snapshot?: string
          price_cents_snapshot?: number
          product_id?: string | null
          quantity?: number
          sale_id?: string
          tax_rate_bps_snapshot?: number
          variant_id?: string | null
          variant_name?: string | null
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
          {
            foreignKeyName: "sale_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
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
          receipt_emailed_at: string | null
          receipt_emailed_to: string | null
          receipt_number: string
          status: string
          subtotal_cents: number
          tax_cents: number
          total_cents: number
          updated_at: string
          user_id: string | null
          voided: boolean
          voided_at: string | null
          voided_by: string | null
          voided_reason: string | null
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
          receipt_emailed_at?: string | null
          receipt_emailed_to?: string | null
          receipt_number: string
          status?: string
          subtotal_cents?: number
          tax_cents?: number
          total_cents?: number
          updated_at?: string
          user_id?: string | null
          voided?: boolean
          voided_at?: string | null
          voided_by?: string | null
          voided_reason?: string | null
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
          receipt_emailed_at?: string | null
          receipt_emailed_to?: string | null
          receipt_number?: string
          status?: string
          subtotal_cents?: number
          tax_cents?: number
          total_cents?: number
          updated_at?: string
          user_id?: string | null
          voided?: boolean
          voided_at?: string | null
          voided_by?: string | null
          voided_reason?: string | null
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
      sensitive_data_access_log: {
        Row: {
          action: string
          actor_user_id: string | null
          at: string
          employee_id: string | null
          fields_changed: string[] | null
          id: string
          org_id: string
        }
        Insert: {
          action: string
          actor_user_id?: string | null
          at?: string
          employee_id?: string | null
          fields_changed?: string[] | null
          id?: string
          org_id: string
        }
        Update: {
          action?: string
          actor_user_id?: string | null
          at?: string
          employee_id?: string | null
          fields_changed?: string[] | null
          id?: string
          org_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sensitive_data_access_log_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sensitive_data_access_log_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      shift_assignments: {
        Row: {
          created_at: string
          created_by: string | null
          employee_id: string
          id: string
          org_id: string
          shift_id: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          employee_id: string
          id?: string
          org_id: string
          shift_id: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          employee_id?: string
          id?: string
          org_id?: string
          shift_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shift_assignments_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_assignments_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shift_assignments_shift_id_fkey"
            columns: ["shift_id"]
            isOneToOne: false
            referencedRelation: "shifts"
            referencedColumns: ["id"]
          },
        ]
      }
      shifts: {
        Row: {
          break_minutes: number
          created_at: string
          created_by: string | null
          ends_at: string
          id: string
          location_id: string
          notes: string | null
          org_id: string
          position_id: string | null
          published_at: string | null
          published_by: string | null
          starts_at: string
          status: string
          updated_at: string
        }
        Insert: {
          break_minutes?: number
          created_at?: string
          created_by?: string | null
          ends_at: string
          id?: string
          location_id: string
          notes?: string | null
          org_id: string
          position_id?: string | null
          published_at?: string | null
          published_by?: string | null
          starts_at: string
          status?: string
          updated_at?: string
        }
        Update: {
          break_minutes?: number
          created_at?: string
          created_by?: string | null
          ends_at?: string
          id?: string
          location_id?: string
          notes?: string | null
          org_id?: string
          position_id?: string | null
          published_at?: string | null
          published_by?: string | null
          starts_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "shifts_location_id_fkey"
            columns: ["location_id"]
            isOneToOne: false
            referencedRelation: "locations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shifts_position_id_fkey"
            columns: ["position_id"]
            isOneToOne: false
            referencedRelation: "positions"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_customers: {
        Row: {
          created_at: string
          email: string | null
          org_id: string
          stripe_customer_id: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          org_id: string
          stripe_customer_id: string
        }
        Update: {
          created_at?: string
          email?: string | null
          org_id?: string
          stripe_customer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stripe_customers_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      stripe_events: {
        Row: {
          id: string
          org_id: string | null
          payload: Json
          processed_at: string
          stripe_event_id: string
          type: string
        }
        Insert: {
          id?: string
          org_id?: string | null
          payload: Json
          processed_at?: string
          stripe_event_id: string
          type: string
        }
        Update: {
          id?: string
          org_id?: string | null
          payload?: Json
          processed_at?: string
          stripe_event_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "stripe_events_org_id_fkey"
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
      time_off_requests: {
        Row: {
          created_at: string
          decided_at: string | null
          decided_by: string | null
          decision_note: string | null
          employee_id: string
          end_date: string
          id: string
          note: string | null
          org_id: string
          requested_at: string
          requested_by: string | null
          start_date: string
          status: Database["public"]["Enums"]["time_off_status"]
          type: Database["public"]["Enums"]["time_off_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_note?: string | null
          employee_id: string
          end_date: string
          id?: string
          note?: string | null
          org_id: string
          requested_at?: string
          requested_by?: string | null
          start_date: string
          status?: Database["public"]["Enums"]["time_off_status"]
          type: Database["public"]["Enums"]["time_off_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          decided_by?: string | null
          decision_note?: string | null
          employee_id?: string
          end_date?: string
          id?: string
          note?: string | null
          org_id?: string
          requested_at?: string
          requested_by?: string | null
          start_date?: string
          status?: Database["public"]["Enums"]["time_off_status"]
          type?: Database["public"]["Enums"]["time_off_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "time_off_requests_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "time_off_requests_org_id_fkey"
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
      add_employee: {
        Args: {
          p_birthdate?: string
          p_bsn?: string
          p_contract_file_name?: string
          p_contract_file_url?: string
          p_contract_hours_per_week?: number
          p_email?: string
          p_emergency_contact_name?: string
          p_emergency_contact_phone?: string
          p_employment_type?: Database["public"]["Enums"]["employment_type"]
          p_end_date?: string
          p_first_name: string
          p_hourly_wage_cents?: number
          p_iban?: string
          p_last_name: string
          p_notes?: string
          p_org_id: string
          p_phone?: string
          p_position_id?: string
          p_start_date?: string
        }
        Returns: string
      }
      admin_link_employee: {
        Args: { p_employee_id: string; p_user_email: string }
        Returns: string
      }
      admin_unlink_employee: {
        Args: { p_employee_id: string }
        Returns: undefined
      }
      archive_employee: { Args: { p_employee_id: string }; Returns: undefined }
      assign_shift: {
        Args: { p_employee_id: string; p_shift_id: string }
        Returns: string
      }
      cancel_time_off: { Args: { p_request_id: string }; Returns: undefined }
      claim_my_employee: { Args: never; Returns: string }
      close_register_session: {
        Args: {
          p_counted_cash_cents: number
          p_notes?: string
          p_session_id: string
        }
        Returns: Json
      }
      configure_cash_envelope_sequence: {
        Args: {
          p_next_number?: number
          p_org_id: string
          p_padding?: number
          p_prefix?: string
          p_year?: number
        }
        Returns: undefined
      }
      copy_week:
        | {
            Args: {
              p_location_id: string
              p_source_week_start: string
              p_target_week_start: string
            }
            Returns: number
          }
        | {
            Args: {
              p_org_id: string
              p_source_week_start: string
              p_target_week_start: string
            }
            Returns: number
          }
      create_org_with_owner: {
        Args: { p_name: string; p_slug?: string }
        Returns: string
      }
      create_sale: {
        Args: {
          p_cash_received_cents?: number
          p_change_cents?: number
          p_discount_cents: number
          p_items: Json
          p_location_id: string
          p_payment_method: string
          p_subtotal_cents: number
          p_tax_cents: number
          p_total_cents: number
        }
        Returns: Json
      }
      create_shift:
        | {
            Args: {
              p_break_minutes?: number
              p_ends_at: string
              p_location_id: string
              p_notes?: string
              p_position_id?: string
              p_starts_at: string
            }
            Returns: string
          }
        | {
            Args: {
              p_break_minutes?: number
              p_ends_at: string
              p_location_id: string
              p_notes?: string
              p_org_id: string
              p_position_id: string
              p_starts_at: string
            }
            Returns: string
          }
      decide_time_off: {
        Args: {
          p_decision: Database["public"]["Enums"]["time_off_status"]
          p_decision_note?: string
          p_request_id: string
        }
        Returns: undefined
      }
      delete_availability_exception: {
        Args: { p_id: string }
        Returns: undefined
      }
      delete_availability_pattern: {
        Args: { p_id: string }
        Returns: undefined
      }
      delete_shift: { Args: { p_shift_id: string }; Returns: undefined }
      get_linked_email: { Args: { p_employee_id: string }; Returns: string }
      get_or_create_cash_envelope_number: {
        Args: { p_register_session_id: string }
        Returns: string
      }
      is_dotts_admin: { Args: never; Returns: boolean }
      my_employee_id: { Args: { p_org_id: string }; Returns: string }
      next_receipt_number: { Args: { p_org_id: string }; Returns: string }
      open_register_session: {
        Args: { p_location_id: string; p_opening_float_cents: number }
        Returns: string
      }
      org_is_locked: { Args: { p_org_id: string }; Returns: boolean }
      process_overdue_invoices: { Args: never; Returns: undefined }
      publish_shifts_range:
        | {
            Args: { p_from: string; p_location_id: string; p_to: string }
            Returns: number
          }
        | {
            Args: { p_from: string; p_org_id: string; p_to: string }
            Returns: number
          }
      request_time_off: {
        Args: {
          p_employee_id: string
          p_end_date: string
          p_note?: string
          p_start_date: string
          p_type: Database["public"]["Enums"]["time_off_type"]
        }
        Returns: string
      }
      set_employee_role: {
        Args: {
          p_employee_id: string
          p_role: Database["public"]["Enums"]["org_role"]
        }
        Returns: undefined
      }
      unassign_shift:
        | { Args: { p_assignment_id: string }; Returns: undefined }
        | {
            Args: { p_employee_id: string; p_shift_id: string }
            Returns: undefined
          }
      update_employee: {
        Args: {
          p_clear_contract?: boolean
          p_contract_file_name?: string
          p_contract_file_url?: string
          p_contract_hours_per_week?: number
          p_email?: string
          p_employee_id: string
          p_employment_type?: Database["public"]["Enums"]["employment_type"]
          p_end_date?: string
          p_first_name?: string
          p_is_active?: boolean
          p_last_name?: string
          p_notes?: string
          p_phone?: string
          p_position_id?: string
          p_start_date?: string
        }
        Returns: undefined
      }
      update_employee_sensitive: {
        Args: {
          p_birthdate?: string
          p_bsn?: string
          p_emergency_contact_name?: string
          p_emergency_contact_phone?: string
          p_employee_id: string
          p_hourly_wage_cents?: number
          p_iban?: string
        }
        Returns: undefined
      }
      update_shift:
        | {
            Args: {
              p_break_minutes?: number
              p_ends_at: string
              p_id: string
              p_notes?: string
              p_position_id?: string
              p_starts_at: string
            }
            Returns: undefined
          }
        | {
            Args: {
              p_break_minutes?: number
              p_ends_at?: string
              p_location_id?: string
              p_notes?: string
              p_position_id?: string
              p_shift_id: string
              p_starts_at?: string
            }
            Returns: undefined
          }
      upsert_availability_exception: {
        Args: {
          p_employee_id: string
          p_end_time?: string
          p_id?: string
          p_is_available?: boolean
          p_on_date: string
          p_reason?: string
          p_start_time?: string
        }
        Returns: string
      }
      upsert_availability_pattern: {
        Args: {
          p_day_of_week: number
          p_employee_id: string
          p_end_time: string
          p_id?: string
          p_is_available?: boolean
          p_notes?: string
          p_start_time: string
        }
        Returns: string
      }
      upsert_position: {
        Args: {
          p_color?: string
          p_default_hourly_wage_cents?: number
          p_id?: string
          p_name: string
          p_org_id: string
          p_permissions?: Json
          p_sort_order?: number
        }
        Returns: string
      }
      user_org_ids: {
        Args: never
        Returns: {
          org_id: string
        }[]
      }
      void_sale: {
        Args: { p_reason: string; p_sale_id: string }
        Returns: undefined
      }
    }
    Enums: {
      employment_type: "vast" | "flex" | "oproep" | "stagiair" | "zzp"
      org_role: "owner" | "admin" | "manager" | "staff"
      time_off_status: "pending" | "approved" | "rejected" | "cancelled"
      time_off_type:
        | "vakantie"
        | "ziekte"
        | "bijzonder"
        | "onbetaald"
        | "overig"
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
      employment_type: ["vast", "flex", "oproep", "stagiair", "zzp"],
      org_role: ["owner", "admin", "manager", "staff"],
      time_off_status: ["pending", "approved", "rejected", "cancelled"],
      time_off_type: ["vakantie", "ziekte", "bijzonder", "onbetaald", "overig"],
    },
  },
} as const

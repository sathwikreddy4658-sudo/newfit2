export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      blogs: {
        Row: {
          content: string
          created_at: string
          id: string
          image_url: string | null
          subheadline: string | null
          title: string
          updated_at: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          subheadline?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          subheadline?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          created_at: string
          customer_email: string
          customer_name: string
          customer_phone: string
          id: string
          items: Json
          order_number: string
          paid: boolean
          status: string
          total_amount: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          customer_email: string
          customer_name: string
          customer_phone: string
          id?: string
          items: Json
          order_number: string
          paid?: boolean
          status?: string
          total_amount: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_email?: string
          customer_name?: string
          customer_phone?: string
          id?: string
          items?: Json
          order_number?: string
          paid?: boolean
          status?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          id: string
          order_id: string
          merchant_transaction_id: string
          amount: number
          status: 'INITIATED' | 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED' | 'CANCELLED'
          phonepe_transaction_id: string | null
          payment_method: string | null
          response_code: string | null
          response_message: string | null
          phonepe_response: Json | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          order_id: string
          merchant_transaction_id: string
          amount: number
          status?: 'INITIATED' | 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED' | 'CANCELLED'
          phonepe_transaction_id?: string | null
          payment_method?: string | null
          response_code?: string | null
          response_message?: string | null
          phonepe_response?: Json | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          merchant_transaction_id?: string
          amount?: number
          status?: 'INITIATED' | 'PENDING' | 'SUCCESS' | 'FAILED' | 'REFUNDED' | 'CANCELLED'
          phonepe_transaction_id?: string | null
          payment_method?: string | null
          response_code?: string | null
          response_message?: string | null
          phonepe_response?: Json | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_transactions_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          }
        ]
      }
      product_ratings: {
        Row: {
          id: string
          product_id: string
          user_id: string
          rating: number
          comment: string | null
          created_at: string
          approved: boolean | null
        }
        Insert: {
          id?: string
          product_id: string
          user_id: string
          rating: number
          comment?: string | null
          created_at?: string
          approved?: boolean | null
        }
        Update: {
          id?: string
          product_id?: string
          user_id?: string
          rating?: number
          comment?: string | null
          created_at?: string
          approved?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "product_ratings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_ratings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      products: {
        Row: {
          allergens: string | null
          calories: string | null
          category: string
          created_at: string
          description: string
          id: string
          images: string[] | null
          is_hidden: boolean | null
          min_order_quantity: number | null
          name: string
          nutrition: string | null
          price: number | null
          price_15g: number | null
          price_20g: number | null
          products_page_image: string | null
          protein: string | null
          shelf_life: string | null
          stock: number | null
          stock_status_15g: boolean | null
          stock_status_20g: boolean | null
          sugar: string | null
          updated_at: string
          weight: string | null
          cart_image: string | null
          combo_3_discount: number | null
          combo_6_discount: number | null
        }
        Insert: {
          allergens?: string | null
          calories?: string | null
          category: string
          created_at?: string
          description: string
          id?: string
          images?: string[] | null
          is_hidden?: boolean | null
          min_order_quantity?: number | null
          name: string
          nutrition?: string | null
          price?: number | null
          price_15g?: number | null
          price_20g?: number | null
          products_page_image?: string | null
          protein?: string | null
          shelf_life?: string | null
          stock?: number | null
          stock_status_15g?: boolean | null
          stock_status_20g?: boolean | null
          sugar?: string | null
          updated_at?: string
          weight?: string | null
          cart_image?: string | null
          combo_3_discount?: number | null
          combo_6_discount?: number | null
        }
        Update: {
          allergens?: string | null
          calories?: string | null
          category?: string
          created_at?: string
          description?: string
          id?: string
          images?: string[] | null
          is_hidden?: boolean | null
          min_order_quantity?: number | null
          name?: string
          nutrition?: string | null
          price?: number | null
          price_15g?: number | null
          price_20g?: number | null
          products_page_image?: string | null
          protein?: string | null
          shelf_life?: string | null
          stock?: number | null
          stock_status_15g?: boolean | null
          stock_status_20g?: boolean | null
          sugar?: string | null
          updated_at?: string
          weight?: string | null
          cart_image?: string | null
          combo_3_discount?: number | null
          combo_6_discount?: number | null
        }
        Relationships: []
      }
      promo_codes: {
        Row: {
          active: boolean
          code: string
          created_at: string
          discount_percentage: number
          id: string
          updated_at: string
          max_uses: number | null
          current_uses: number
          valid_from: string | null
          valid_until: string | null
          free_shipping: boolean | null
          min_order_amount: number | null
          description: string | null
          max_discount_amount: number | null
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          discount_percentage: number
          id?: string
          updated_at?: string
          max_uses?: number | null
          current_uses?: number
          valid_from?: string | null
          valid_until?: string | null
          free_shipping?: boolean | null
          min_order_amount?: number | null
          description?: string | null
          max_discount_amount?: number | null
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          discount_percentage?: number
          id?: string
          updated_at?: string
          max_uses?: number | null
          current_uses?: number
          valid_from?: string | null
          valid_until?: string | null
          free_shipping?: boolean | null
          min_order_amount?: number | null
          description?: string | null
          max_discount_amount?: number | null
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          name: string | null
          email: string
          address: string | null
          favorites: string[] | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name?: string | null
          email: string
          address?: string | null
          favorites?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string | null
          email?: string
          address?: string | null
          favorites?: string[] | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      lab_reports: {
        Row: {
          id: string
          product_id: string
          file_url: string
          file_name: string
          file_size: number | null
          test_type: string | null
          test_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          file_url: string
          file_name: string
          file_size?: number | null
          test_type?: string | null
          test_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          file_url?: string
          file_name?: string
          file_size?: number | null
          test_type?: string | null
          test_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "lab_reports_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          }
        ]
      }
      product_faqs: {
        Row: {
          id: string
          product_id: string
          question: string
          answer: string
          display_order: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_id: string
          question: string
          answer: string
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_id?: string
          question?: string
          answer?: string
          display_order?: number
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_faqs_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          }
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
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

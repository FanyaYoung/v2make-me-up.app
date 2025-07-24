export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      brand_referral_codes: {
        Row: {
          affiliate_code: string | null
          brand_id: string
          commission_rate: number | null
          created_at: string
          id: string
          is_active: boolean | null
          promo_code: string | null
          referral_url: string | null
          updated_at: string
        }
        Insert: {
          affiliate_code?: string | null
          brand_id: string
          commission_rate?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          promo_code?: string | null
          referral_url?: string | null
          updated_at?: string
        }
        Update: {
          affiliate_code?: string | null
          brand_id?: string
          commission_rate?: number | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          promo_code?: string | null
          referral_url?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "brand_referral_codes_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: true
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          brand_tier: string | null
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          website_url: string | null
        }
        Insert: {
          brand_tier?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          website_url?: string | null
        }
        Update: {
          brand_tier?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name?: string
          website_url?: string | null
        }
        Relationships: []
      }
      cosmetics_product_attributes: {
        Row: {
          attribute_name: string
          attribute_value: string | null
          created_at: string
          id: string
          product_id: string
        }
        Insert: {
          attribute_name: string
          attribute_value?: string | null
          created_at?: string
          id?: string
          product_id: string
        }
        Update: {
          attribute_name?: string
          attribute_value?: string | null
          created_at?: string
          id?: string
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cosmetics_product_attributes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "cosmetics_products"
            referencedColumns: ["id"]
          },
        ]
      }
      cosmetics_products: {
        Row: {
          brand_id: string | null
          category: string | null
          created_at: string
          dataset_name: string
          description: string | null
          id: string
          image_url: string | null
          ingredients: string | null
          metadata: Json | null
          price: number | null
          product_name: string
          product_type: string | null
          product_url: string | null
          rating: number | null
          subcategory: string | null
          total_reviews: number | null
          updated_at: string
        }
        Insert: {
          brand_id?: string | null
          category?: string | null
          created_at?: string
          dataset_name: string
          description?: string | null
          id?: string
          image_url?: string | null
          ingredients?: string | null
          metadata?: Json | null
          price?: number | null
          product_name: string
          product_type?: string | null
          product_url?: string | null
          rating?: number | null
          subcategory?: string | null
          total_reviews?: number | null
          updated_at?: string
        }
        Update: {
          brand_id?: string | null
          category?: string | null
          created_at?: string
          dataset_name?: string
          description?: string | null
          id?: string
          image_url?: string | null
          ingredients?: string | null
          metadata?: Json | null
          price?: number | null
          product_name?: string
          product_type?: string | null
          product_url?: string | null
          rating?: number | null
          subcategory?: string | null
          total_reviews?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "cosmetics_products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      face_regions: {
        Row: {
          avg_lab_values: Json | null
          avg_rgb_values: Json | null
          confidence_score: number | null
          created_at: string | null
          depth_level: number | null
          hex_color: string | null
          id: string
          region_coordinates: Json | null
          region_name: string
          session_id: string | null
          undertone: string | null
        }
        Insert: {
          avg_lab_values?: Json | null
          avg_rgb_values?: Json | null
          confidence_score?: number | null
          created_at?: string | null
          depth_level?: number | null
          hex_color?: string | null
          id?: string
          region_coordinates?: Json | null
          region_name: string
          session_id?: string | null
          undertone?: string | null
        }
        Update: {
          avg_lab_values?: Json | null
          avg_rgb_values?: Json | null
          confidence_score?: number | null
          created_at?: string | null
          depth_level?: number | null
          hex_color?: string | null
          id?: string
          region_coordinates?: Json | null
          region_name?: string
          session_id?: string | null
          undertone?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "face_regions_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "scan_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      foundation_feedback: {
        Row: {
          comment: string | null
          created_at: string
          feedback_category: string | null
          feedback_type: string
          foundation_id: string
          id: string
          rating: string
          user_id: string | null
        }
        Insert: {
          comment?: string | null
          created_at?: string
          feedback_category?: string | null
          feedback_type: string
          foundation_id: string
          id?: string
          rating: string
          user_id?: string | null
        }
        Update: {
          comment?: string | null
          created_at?: string
          feedback_category?: string | null
          feedback_type?: string
          foundation_id?: string
          id?: string
          rating?: string
          user_id?: string | null
        }
        Relationships: []
      }
      foundation_matches: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          delta_e_value: number | null
          id: string
          match_type: string | null
          price: number | null
          product_id: string | null
          purchase_url: string | null
          region_id: string | null
          session_id: string | null
          shade_id: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          delta_e_value?: number | null
          id?: string
          match_type?: string | null
          price?: number | null
          product_id?: string | null
          purchase_url?: string | null
          region_id?: string | null
          session_id?: string | null
          shade_id?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          delta_e_value?: number | null
          id?: string
          match_type?: string | null
          price?: number | null
          product_id?: string | null
          purchase_url?: string | null
          region_id?: string | null
          session_id?: string | null
          shade_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "foundation_matches_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "foundation_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "foundation_matches_region_id_fkey"
            columns: ["region_id"]
            isOneToOne: false
            referencedRelation: "face_regions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "foundation_matches_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "scan_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "foundation_matches_shade_id_fkey"
            columns: ["shade_id"]
            isOneToOne: false
            referencedRelation: "foundation_shades"
            referencedColumns: ["id"]
          },
        ]
      }
      foundation_products: {
        Row: {
          brand_id: string | null
          coverage: Database["public"]["Enums"]["coverage_level"] | null
          created_at: string | null
          description: string | null
          finish: Database["public"]["Enums"]["finish_type"] | null
          id: string
          image_url: string | null
          ingredients: string[] | null
          is_active: boolean | null
          name: string
          price: number | null
          product_url: string | null
          updated_at: string | null
        }
        Insert: {
          brand_id?: string | null
          coverage?: Database["public"]["Enums"]["coverage_level"] | null
          created_at?: string | null
          description?: string | null
          finish?: Database["public"]["Enums"]["finish_type"] | null
          id?: string
          image_url?: string | null
          ingredients?: string[] | null
          is_active?: boolean | null
          name: string
          price?: number | null
          product_url?: string | null
          updated_at?: string | null
        }
        Update: {
          brand_id?: string | null
          coverage?: Database["public"]["Enums"]["coverage_level"] | null
          created_at?: string | null
          description?: string | null
          finish?: Database["public"]["Enums"]["finish_type"] | null
          id?: string
          image_url?: string | null
          ingredients?: string[] | null
          is_active?: boolean | null
          name?: string
          price?: number | null
          product_url?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "foundation_products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      foundation_shades: {
        Row: {
          created_at: string | null
          depth_level: number | null
          hex_color: string | null
          id: string
          is_available: boolean | null
          product_id: string | null
          rgb_values: number[] | null
          shade_code: string | null
          shade_name: string
          undertone: Database["public"]["Enums"]["skin_undertone"] | null
        }
        Insert: {
          created_at?: string | null
          depth_level?: number | null
          hex_color?: string | null
          id?: string
          is_available?: boolean | null
          product_id?: string | null
          rgb_values?: number[] | null
          shade_code?: string | null
          shade_name: string
          undertone?: Database["public"]["Enums"]["skin_undertone"] | null
        }
        Update: {
          created_at?: string | null
          depth_level?: number | null
          hex_color?: string | null
          id?: string
          is_available?: boolean | null
          product_id?: string | null
          rgb_values?: number[] | null
          shade_code?: string | null
          shade_name?: string
          undertone?: Database["public"]["Enums"]["skin_undertone"] | null
        }
        Relationships: [
          {
            foreignKeyName: "foundation_shades_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "foundation_products"
            referencedColumns: ["id"]
          },
        ]
      }
      makeup_brands: {
        Row: {
          country_of_origin: string | null
          created_at: string | null
          description: string | null
          founded_year: number | null
          id: number
          is_cruelty_free: boolean | null
          is_vegan: boolean | null
          logo_url: string | null
          name: string
          updated_at: string | null
          website: string | null
        }
        Insert: {
          country_of_origin?: string | null
          created_at?: string | null
          description?: string | null
          founded_year?: number | null
          id?: never
          is_cruelty_free?: boolean | null
          is_vegan?: boolean | null
          logo_url?: string | null
          name: string
          updated_at?: string | null
          website?: string | null
        }
        Update: {
          country_of_origin?: string | null
          created_at?: string | null
          description?: string | null
          founded_year?: number | null
          id?: never
          is_cruelty_free?: boolean | null
          is_vegan?: boolean | null
          logo_url?: string | null
          name?: string
          updated_at?: string | null
          website?: string | null
        }
        Relationships: []
      }
      product_availability: {
        Row: {
          id: string
          is_available: boolean | null
          last_updated: string | null
          price: number | null
          product_id: string | null
          sale_price: number | null
          shade_id: string | null
          stock_level: string | null
          store_id: string | null
        }
        Insert: {
          id?: string
          is_available?: boolean | null
          last_updated?: string | null
          price?: number | null
          product_id?: string | null
          sale_price?: number | null
          shade_id?: string | null
          stock_level?: string | null
          store_id?: string | null
        }
        Update: {
          id?: string
          is_available?: boolean | null
          last_updated?: string | null
          price?: number | null
          product_id?: string | null
          sale_price?: number | null
          shade_id?: string | null
          stock_level?: string | null
          store_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_availability_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "foundation_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_availability_shade_id_fkey"
            columns: ["shade_id"]
            isOneToOne: false
            referencedRelation: "foundation_shades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_availability_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          created_at: string | null
          description: string | null
          id: number
          name: string
          parent_category_id: number | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: never
          name: string
          parent_category_id?: number | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          id?: never
          name?: string
          parent_category_id?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      product_ingredients: {
        Row: {
          created_at: string | null
          id: number
          ingredient_name: string
          is_active_ingredient: boolean | null
          potential_concerns: string[] | null
          product_id: number
          purpose: string | null
        }
        Insert: {
          created_at?: string | null
          id?: never
          ingredient_name: string
          is_active_ingredient?: boolean | null
          potential_concerns?: string[] | null
          product_id: number
          purpose?: string | null
        }
        Update: {
          created_at?: string | null
          id?: never
          ingredient_name?: string
          is_active_ingredient?: boolean | null
          potential_concerns?: string[] | null
          product_id?: number
          purpose?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_ingredients_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          additional_price: number | null
          barcode: string | null
          color: string | null
          created_at: string | null
          id: number
          product_id: number
          size: string | null
          sku: string | null
          stock_quantity: number | null
        }
        Insert: {
          additional_price?: number | null
          barcode?: string | null
          color?: string | null
          created_at?: string | null
          id?: never
          product_id: number
          size?: string | null
          sku?: string | null
          stock_quantity?: number | null
        }
        Update: {
          additional_price?: number | null
          barcode?: string | null
          color?: string | null
          created_at?: string | null
          id?: never
          product_id?: number
          size?: string | null
          sku?: string | null
          stock_quantity?: number | null
        }
        Relationships: [
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
          average_rating: number | null
          brand_id: number
          category_id: number
          created_at: string | null
          currency: string | null
          description: string | null
          id: number
          is_bestseller: boolean | null
          is_new_arrival: boolean | null
          name: string
          price: number | null
          total_reviews: number | null
          updated_at: string | null
        }
        Insert: {
          average_rating?: number | null
          brand_id: number
          category_id: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: never
          is_bestseller?: boolean | null
          is_new_arrival?: boolean | null
          name: string
          price?: number | null
          total_reviews?: number | null
          updated_at?: string | null
        }
        Update: {
          average_rating?: number | null
          brand_id?: number
          category_id?: number
          created_at?: string | null
          currency?: string | null
          description?: string | null
          id?: never
          is_bestseller?: boolean | null
          is_new_arrival?: boolean | null
          name?: string
          price?: number | null
          total_reviews?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "makeup_brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          age_range: string | null
          avatar_url: string | null
          bio: string | null
          birth_date: string | null
          created_at: string | null
          email: string | null
          ethnicity: Json | null
          face_shape: string | null
          first_name: string | null
          gender: string | null
          id: string
          language: string | null
          last_name: string | null
          lineage: Json | null
          location: string | null
          notification_preferences: Json | null
          phone: string | null
          preferences: Json | null
          preferred_coverage: string | null
          preferred_finish: string | null
          skin_concerns: string[] | null
          skin_tone: string | null
          skin_type: Database["public"]["Enums"]["skin_type"] | null
          timezone: string | null
          undertone: Database["public"]["Enums"]["skin_undertone"] | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          age_range?: string | null
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          created_at?: string | null
          email?: string | null
          ethnicity?: Json | null
          face_shape?: string | null
          first_name?: string | null
          gender?: string | null
          id: string
          language?: string | null
          last_name?: string | null
          lineage?: Json | null
          location?: string | null
          notification_preferences?: Json | null
          phone?: string | null
          preferences?: Json | null
          preferred_coverage?: string | null
          preferred_finish?: string | null
          skin_concerns?: string[] | null
          skin_tone?: string | null
          skin_type?: Database["public"]["Enums"]["skin_type"] | null
          timezone?: string | null
          undertone?: Database["public"]["Enums"]["skin_undertone"] | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          age_range?: string | null
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          created_at?: string | null
          email?: string | null
          ethnicity?: Json | null
          face_shape?: string | null
          first_name?: string | null
          gender?: string | null
          id?: string
          language?: string | null
          last_name?: string | null
          lineage?: Json | null
          location?: string | null
          notification_preferences?: Json | null
          phone?: string | null
          preferences?: Json | null
          preferred_coverage?: string | null
          preferred_finish?: string | null
          skin_concerns?: string[] | null
          skin_tone?: string | null
          skin_type?: Database["public"]["Enums"]["skin_type"] | null
          timezone?: string | null
          undertone?: Database["public"]["Enums"]["skin_undertone"] | null
          updated_at?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      purchase_options: {
        Row: {
          base_url: string | null
          brand_id: string
          created_at: string
          id: string
          is_active: boolean | null
          option_name: string
          option_type: string
          requires_referral_code: boolean | null
        }
        Insert: {
          base_url?: string | null
          brand_id: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          option_name: string
          option_type: string
          requires_referral_code?: boolean | null
        }
        Update: {
          base_url?: string | null
          brand_id?: string
          created_at?: string
          id?: string
          is_active?: boolean | null
          option_name?: string
          option_type?: string
          requires_referral_code?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_options_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      scan_sessions: {
        Row: {
          analysis_complete: boolean | null
          analysis_data: Json | null
          calibration_completed: boolean | null
          calibration_data: Json | null
          created_at: string | null
          environment_lighting: string | null
          id: string
          photo_urls: string[] | null
          session_date: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          analysis_complete?: boolean | null
          analysis_data?: Json | null
          calibration_completed?: boolean | null
          calibration_data?: Json | null
          created_at?: string | null
          environment_lighting?: string | null
          id?: string
          photo_urls?: string[] | null
          session_date?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          analysis_complete?: boolean | null
          analysis_data?: Json | null
          calibration_completed?: boolean | null
          calibration_data?: Json | null
          created_at?: string | null
          environment_lighting?: string | null
          id?: string
          photo_urls?: string[] | null
          session_date?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      search_history: {
        Row: {
          created_at: string | null
          id: string
          results_count: number | null
          search_filters: Json | null
          search_query: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          results_count?: number | null
          search_filters?: Json | null
          search_query?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          results_count?: number | null
          search_filters?: Json | null
          search_query?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      shade_matches: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          id: string
          match_percentage: number | null
          shade_1_id: string | null
          shade_2_id: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          match_percentage?: number | null
          shade_1_id?: string | null
          shade_2_id?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          match_percentage?: number | null
          shade_1_id?: string | null
          shade_2_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shade_matches_shade_1_id_fkey"
            columns: ["shade_1_id"]
            isOneToOne: false
            referencedRelation: "foundation_shades"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shade_matches_shade_2_id_fkey"
            columns: ["shade_2_id"]
            isOneToOne: false
            referencedRelation: "foundation_shades"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          address: string | null
          chain_name: string | null
          city: string | null
          country: string | null
          created_at: string | null
          id: string
          is_active: boolean | null
          name: string
          phone: string | null
          state: string | null
          store_type: string | null
          website_url: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          chain_name?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name: string
          phone?: string | null
          state?: string | null
          store_type?: string | null
          website_url?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          chain_name?: string | null
          city?: string | null
          country?: string | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string
          phone?: string | null
          state?: string | null
          store_type?: string | null
          website_url?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      subscribers: {
        Row: {
          created_at: string
          email: string
          id: string
          stripe_customer_id: string | null
          subscribed: boolean
          subscription_end: string | null
          subscription_tier: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          stripe_customer_id?: string | null
          subscribed?: boolean
          subscription_end?: string | null
          subscription_tier?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      test_updated_at: {
        Row: {
          created_at: string | null
          id: number
          name: string | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: never
          name?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: never
          name?: string | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      "Ulta Makeup Reviews": {
        Row: {
          average_rating: number | null
          best_uses: string | null
          brand: string
          category: string
          cons: string | null
          describe_yourself: string | null
          description: string | null
          faceoff_negative: Json | null
          faceoff_positive: Json | null
          item_id: string
          native_community_content_review_count: string | null
          native_review_count: string | null
          native_sampling_review_count: string | null
          num_reviews: number | null
          num_shades: string | null
          price: string | null
          product_link: string
          product_link_id: number
          product_name: string
          pros: string | null
          rating: string | null
          rating_count: number | null
          rating_star_1: string | null
          rating_star_2: number | null
          rating_star_3: number | null
          rating_star_4: string | null
          rating_star_5: number | null
          recommended_ratio: string | null
          review_count: number | null
          review_star_1: string | null
          review_star_2: number | null
          review_star_3: number | null
          review_star_4: string | null
          review_star_5: number | null
          syndicated_review_count: string | null
        }
        Insert: {
          average_rating?: number | null
          best_uses?: string | null
          brand: string
          category: string
          cons?: string | null
          describe_yourself?: string | null
          description?: string | null
          faceoff_negative?: Json | null
          faceoff_positive?: Json | null
          item_id: string
          native_community_content_review_count?: string | null
          native_review_count?: string | null
          native_sampling_review_count?: string | null
          num_reviews?: number | null
          num_shades?: string | null
          price?: string | null
          product_link: string
          product_link_id: number
          product_name: string
          pros?: string | null
          rating?: string | null
          rating_count?: number | null
          rating_star_1?: string | null
          rating_star_2?: number | null
          rating_star_3?: number | null
          rating_star_4?: string | null
          rating_star_5?: number | null
          recommended_ratio?: string | null
          review_count?: number | null
          review_star_1?: string | null
          review_star_2?: number | null
          review_star_3?: number | null
          review_star_4?: string | null
          review_star_5?: number | null
          syndicated_review_count?: string | null
        }
        Update: {
          average_rating?: number | null
          best_uses?: string | null
          brand?: string
          category?: string
          cons?: string | null
          describe_yourself?: string | null
          description?: string | null
          faceoff_negative?: Json | null
          faceoff_positive?: Json | null
          item_id?: string
          native_community_content_review_count?: string | null
          native_review_count?: string | null
          native_sampling_review_count?: string | null
          num_reviews?: number | null
          num_shades?: string | null
          price?: string | null
          product_link?: string
          product_link_id?: number
          product_name?: string
          pros?: string | null
          rating?: string | null
          rating_count?: number | null
          rating_star_1?: string | null
          rating_star_2?: number | null
          rating_star_3?: number | null
          rating_star_4?: string | null
          rating_star_5?: number | null
          recommended_ratio?: string | null
          review_count?: number | null
          review_star_1?: string | null
          review_star_2?: number | null
          review_star_3?: number | null
          review_star_4?: string | null
          review_star_5?: number | null
          syndicated_review_count?: string | null
        }
        Relationships: []
      }
      user_activity: {
        Row: {
          activity_data: Json | null
          activity_type: string
          created_at: string
          id: string
          ip_address: unknown | null
          session_id: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          activity_data?: Json | null
          activity_type: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          session_id?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          activity_data?: Json | null
          activity_type?: string
          created_at?: string
          id?: string
          ip_address?: unknown | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_analytics: {
        Row: {
          created_at: string
          date_recorded: string
          id: string
          metric_data: Json | null
          metric_name: string
          metric_value: number
          user_id: string
        }
        Insert: {
          created_at?: string
          date_recorded?: string
          id?: string
          metric_data?: Json | null
          metric_name: string
          metric_value: number
          user_id: string
        }
        Update: {
          created_at?: string
          date_recorded?: string
          id?: string
          metric_data?: Json | null
          metric_name?: string
          metric_value?: number
          user_id?: string
        }
        Relationships: []
      }
      user_favorites: {
        Row: {
          created_at: string | null
          id: string
          notes: string | null
          product_id: string | null
          shade_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          notes?: string | null
          product_id?: string | null
          shade_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          notes?: string | null
          product_id?: string | null
          shade_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "foundation_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_favorites_shade_id_fkey"
            columns: ["shade_id"]
            isOneToOne: false
            referencedRelation: "foundation_shades"
            referencedColumns: ["id"]
          },
        ]
      }
      user_ideas: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          inspiration_source: string | null
          is_public: boolean | null
          products_used: Json | null
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          inspiration_source?: string | null
          is_public?: boolean | null
          products_used?: Json | null
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          inspiration_source?: string | null
          is_public?: boolean | null
          products_used?: Json | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_match_usage: {
        Row: {
          created_at: string
          id: string
          match_type: string
          metadata: Json | null
          session_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          match_type: string
          metadata?: Json | null
          session_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          match_type?: string
          metadata?: Json | null
          session_id?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          category: string
          created_at: string
          id: string
          preference_key: string
          preference_value: Json
          updated_at: string
          user_id: string
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          preference_key: string
          preference_value: Json
          updated_at?: string
          user_id: string
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          preference_key?: string
          preference_value?: Json
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_reviews: {
        Row: {
          coverage_rating: number | null
          created_at: string | null
          helpful_votes: number | null
          id: string
          is_verified_purchase: boolean | null
          longevity_rating: number | null
          product_id: string | null
          rating: number | null
          review_text: string | null
          shade_id: string | null
          skin_match_rating: number | null
          updated_at: string | null
          user_id: string | null
        }
        Insert: {
          coverage_rating?: number | null
          created_at?: string | null
          helpful_votes?: number | null
          id?: string
          is_verified_purchase?: boolean | null
          longevity_rating?: number | null
          product_id?: string | null
          rating?: number | null
          review_text?: string | null
          shade_id?: string | null
          skin_match_rating?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Update: {
          coverage_rating?: number | null
          created_at?: string | null
          helpful_votes?: number | null
          id?: string
          is_verified_purchase?: boolean | null
          longevity_rating?: number | null
          product_id?: string | null
          rating?: number | null
          review_text?: string | null
          shade_id?: string | null
          skin_match_rating?: number | null
          updated_at?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "foundation_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_reviews_shade_id_fkey"
            columns: ["shade_id"]
            isOneToOne: false
            referencedRelation: "foundation_shades"
            referencedColumns: ["id"]
          },
        ]
      }
      user_social_profiles: {
        Row: {
          created_at: string
          follower_count: number | null
          id: string
          is_public: boolean | null
          is_verified: boolean | null
          platform: string
          profile_url: string | null
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          created_at?: string
          follower_count?: number | null
          id?: string
          is_public?: boolean | null
          is_verified?: boolean | null
          platform: string
          profile_url?: string | null
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          created_at?: string
          follower_count?: number | null
          id?: string
          is_public?: boolean | null
          is_verified?: boolean | null
          platform?: string
          profile_url?: string | null
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      virtual_try_on_sessions: {
        Row: {
          created_at: string | null
          id: string
          match_confidence: number | null
          photo_url: string | null
          product_id: string | null
          result_photo_url: string | null
          session_data: Json | null
          shade_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          match_confidence?: number | null
          photo_url?: string | null
          product_id?: string | null
          result_photo_url?: string | null
          session_data?: Json | null
          shade_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          match_confidence?: number | null
          photo_url?: string | null
          product_id?: string | null
          result_photo_url?: string | null
          session_data?: Json | null
          shade_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "virtual_try_on_sessions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "foundation_products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "virtual_try_on_sessions_shade_id_fkey"
            columns: ["shade_id"]
            isOneToOne: false
            referencedRelation: "foundation_shades"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      add_makeup_brand: {
        Args: {
          p_name: string
          p_country?: string
          p_founded_year?: number
          p_description?: string
          p_website?: string
          p_is_cruelty_free?: boolean
          p_is_vegan?: boolean
        }
        Returns: {
          country_of_origin: string | null
          created_at: string | null
          description: string | null
          founded_year: number | null
          id: number
          is_cruelty_free: boolean | null
          is_vegan: boolean | null
          logo_url: string | null
          name: string
          updated_at: string | null
          website: string | null
        }
      }
      add_product: {
        Args: {
          p_brand_name: string
          p_category_name: string
          p_name: string
          p_description?: string
          p_price?: number
        }
        Returns: {
          average_rating: number | null
          brand_id: number
          category_id: number
          created_at: string | null
          currency: string | null
          description: string | null
          id: number
          is_bestseller: boolean | null
          is_new_arrival: boolean | null
          name: string
          price: number | null
          total_reviews: number | null
          updated_at: string | null
        }
      }
      get_cosmetics_import_stats: {
        Args: Record<PropertyKey, never>
        Returns: {
          dataset_name: string
          total_products: number
          brands_count: number
          product_types_count: number
          categories_count: number
          avg_price: number
          avg_rating: number
        }[]
      }
      get_user_match_stats: {
        Args: { user_uuid: string }
        Returns: Json
      }
      link_foundation_products: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      match_cosmetics_brands: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      coverage_level: "light" | "medium" | "full" | "buildable"
      finish_type: "matte" | "satin" | "natural" | "dewy" | "radiant"
      skin_type: "dry" | "oily" | "combination" | "sensitive" | "normal"
      skin_undertone: "cool" | "warm" | "neutral" | "olive"
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
      coverage_level: ["light", "medium", "full", "buildable"],
      finish_type: ["matte", "satin", "natural", "dewy", "radiant"],
      skin_type: ["dry", "oily", "combination", "sensitive", "normal"],
      skin_undertone: ["cool", "warm", "neutral", "olive"],
    },
  },
} as const

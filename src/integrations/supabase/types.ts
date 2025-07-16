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
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          birth_date: string | null
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          language: string | null
          last_name: string | null
          location: string | null
          notification_preferences: Json | null
          phone: string | null
          preferences: Json | null
          skin_tone: string | null
          skin_type: Database["public"]["Enums"]["skin_type"] | null
          timezone: string | null
          undertone: Database["public"]["Enums"]["skin_undertone"] | null
          updated_at: string | null
          website_url: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          language?: string | null
          last_name?: string | null
          location?: string | null
          notification_preferences?: Json | null
          phone?: string | null
          preferences?: Json | null
          skin_tone?: string | null
          skin_type?: Database["public"]["Enums"]["skin_type"] | null
          timezone?: string | null
          undertone?: Database["public"]["Enums"]["skin_undertone"] | null
          updated_at?: string | null
          website_url?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          birth_date?: string | null
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          language?: string | null
          last_name?: string | null
          location?: string | null
          notification_preferences?: Json | null
          phone?: string | null
          preferences?: Json | null
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
        }
        Insert: {
          created_at?: string | null
          id?: never
          name?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: never
          name?: string | null
          updated_at?: string | null
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

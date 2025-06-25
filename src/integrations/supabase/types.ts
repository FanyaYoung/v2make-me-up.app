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
      brands: {
        Row: {
          created_at: string | null
          description: string | null
          id: string
          is_active: boolean | null
          logo_url: string | null
          name: string
          website_url: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          logo_url?: string | null
          name: string
          website_url?: string | null
        }
        Update: {
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
          created_at: string | null
          email: string | null
          first_name: string | null
          id: string
          last_name: string | null
          preferences: Json | null
          skin_tone: string | null
          skin_type: Database["public"]["Enums"]["skin_type"] | null
          undertone: Database["public"]["Enums"]["skin_undertone"] | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          preferences?: Json | null
          skin_tone?: string | null
          skin_type?: Database["public"]["Enums"]["skin_type"] | null
          undertone?: Database["public"]["Enums"]["skin_undertone"] | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          preferences?: Json | null
          skin_tone?: string | null
          skin_type?: Database["public"]["Enums"]["skin_type"] | null
          undertone?: Database["public"]["Enums"]["skin_undertone"] | null
          updated_at?: string | null
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
      [_ in never]: never
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
      coverage_level: ["light", "medium", "full", "buildable"],
      finish_type: ["matte", "satin", "natural", "dewy", "radiant"],
      skin_type: ["dry", "oily", "combination", "sensitive", "normal"],
      skin_undertone: ["cool", "warm", "neutral", "olive"],
    },
  },
} as const

/**
 * Database types for supabase/migrations/20261121000000_week1_core_schema.sql.
 *
 * Hand-written to match the migration until the project is linked. Once it
 * is, regenerate with:
 *   npx supabase gen types typescript --linked > apps/web/src/lib/supabase/database.types.ts
 */
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

type Timestamp = string

export type Region = "us" | "eu" | "in"
export type MemberRole = "owner" | "shooter" | "editor"
export type GalleryStatus = "draft" | "culling" | "delivered" | "archived"
export type PhotoStatus = "uploading" | "uploaded" | "processing" | "ready" | "failed"
export type PlanInterest = "solo" | "studio" | "collective"

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          full_name: string
          avatar_path: string | null
          plan_interest: PlanInterest | null
          created_at: Timestamp
          updated_at: Timestamp
        }
        Insert: {
          id: string
          full_name?: string
          avatar_path?: string | null
          plan_interest?: PlanInterest | null
        }
        Update: {
          full_name?: string
          avatar_path?: string | null
          plan_interest?: PlanInterest | null
        }
        Relationships: []
      }
      studios: {
        Row: {
          id: string
          owner_id: string
          name: string
          slug: string
          logo_path: string | null
          brand_color: string
          region: Region
          plan: string
          trial_ends_at: Timestamp
          created_at: Timestamp
          updated_at: Timestamp
        }
        Insert: {
          id?: string
          owner_id: string
          name: string
          slug: string
          logo_path?: string | null
          brand_color?: string
          region?: Region
          plan?: string
        }
        Update: {
          name?: string
          slug?: string
          logo_path?: string | null
          brand_color?: string
        }
        Relationships: []
      }
      studio_members: {
        Row: { studio_id: string; user_id: string; role: MemberRole; created_at: Timestamp }
        Insert: { studio_id: string; user_id: string; role?: MemberRole }
        Update: { role?: MemberRole }
        Relationships: [
          { foreignKeyName: "studio_members_studio_id_fkey"; columns: ["studio_id"]; isOneToOne: false; referencedRelation: "studios"; referencedColumns: ["id"] },
        ]
      }
      galleries: {
        Row: {
          id: string
          studio_id: string
          title: string
          slug: string
          event_date: string | null
          status: GalleryStatus
          cover_photo_id: string | null
          created_by: string | null
          created_at: Timestamp
          updated_at: Timestamp
        }
        Insert: {
          id?: string
          studio_id: string
          title: string
          slug: string
          event_date?: string | null
          status?: GalleryStatus
          cover_photo_id?: string | null
        }
        Update: {
          title?: string
          slug?: string
          event_date?: string | null
          status?: GalleryStatus
          cover_photo_id?: string | null
        }
        Relationships: []
      }
      sections: {
        Row: { id: string; gallery_id: string; name: string; sort_order: number; created_at: Timestamp }
        Insert: { id?: string; gallery_id: string; name: string; sort_order?: number }
        Update: { name?: string; sort_order?: number }
        Relationships: []
      }
      photos: {
        Row: {
          id: string
          gallery_id: string
          section_id: string | null
          original_name: string
          r2_key: string
          bytes: number
          mime: string
          width: number | null
          height: number | null
          taken_at: Timestamp | null
          camera: string | null
          status: PhotoStatus
          error: string | null
          created_at: Timestamp
        }
        Insert: {
          id?: string
          gallery_id: string
          section_id?: string | null
          original_name: string
          r2_key: string
          bytes: number
          mime: string
          status?: PhotoStatus
        }
        Update: {
          section_id?: string | null
          status?: PhotoStatus
          error?: string | null
          width?: number | null
          height?: number | null
          taken_at?: Timestamp | null
          camera?: string | null
        }
        Relationships: []
      }
      renditions: {
        Row: { photo_id: string; kind: "thumb" | "web" | "full"; r2_key: string; width: number; height: number; bytes: number }
        Insert: { photo_id: string; kind: "thumb" | "web" | "full"; r2_key: string; width: number; height: number; bytes: number }
        Update: { r2_key?: string; width?: number; height?: number; bytes?: number }
        Relationships: []
      }
      site_photos: {
        Row: {
          key: string
          file: string
          width: number
          height: number
          alt: string
          credit: string
          sort_order: number
          is_active: boolean
          created_at: Timestamp
          updated_at: Timestamp
        }
        Insert: {
          key: string
          file: string
          width: number
          height: number
          alt: string
          credit?: string
          sort_order?: number
          is_active?: boolean
        }
        Update: { file?: string; width?: number; height?: number; alt?: string; credit?: string; sort_order?: number; is_active?: boolean }
        Relationships: []
      }
    }
    Views: {
      gallery_overview: {
        Row: {
          id: string
          studio_id: string
          title: string
          slug: string
          event_date: string | null
          status: GalleryStatus
          cover_photo_id: string | null
          created_at: Timestamp
          photo_count: number
          ready_count: number
          failed_count: number
          section_count: number
        }
        Relationships: []
      }
    }
    Functions: {
      slug_available: { Args: { p_slug: string }; Returns: boolean }
      create_studio: {
        Args: { p_name: string; p_slug: string; p_region?: string; p_brand_color?: string }
        Returns: Database["public"]["Tables"]["studios"]["Row"]
      }
      create_gallery: {
        Args: { p_studio_id: string; p_title: string; p_event_date?: string | null; p_sections?: string[] }
        Returns: string
      }
      is_member: { Args: { p_studio_id: string }; Returns: boolean }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"]
export type Studio = Tables<"studios">
export type Profile = Tables<"profiles">
export type GalleryOverview = Database["public"]["Views"]["gallery_overview"]["Row"]

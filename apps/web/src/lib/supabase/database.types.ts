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
          /** Client link name, unique across all studios: framesly.app/g/<public_slug> */
          public_slug: string | null
          /** null = draft (clients can't open it) */
          published_at: Timestamp | null
          expires_at: Timestamp | null
          /** Display hint only; the password hash itself is in gallery_secrets (server-only) */
          has_password: boolean
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
          web_key: string | null
          bytes: number
          mime: string
          width: number | null
          height: number | null
          taken_at: Timestamp | null
          camera: string | null
          status: PhotoStatus
          error: string | null
          sort_order: number | null
          created_at: Timestamp
        }
        Insert: {
          id?: string
          gallery_id: string
          section_id?: string | null
          original_name: string
          r2_key: string
          web_key?: string | null
          bytes: number
          mime: string
          status?: PhotoStatus
        }
        Update: {
          web_key?: string | null
          section_id?: string | null
          status?: PhotoStatus
          error?: string | null
          width?: number | null
          height?: number | null
          taken_at?: Timestamp | null
          camera?: string | null
          sort_order?: number | null
        }
        Relationships: []
      }
      renditions: {
        Row: { photo_id: string; kind: "thumb" | "web" | "full"; r2_key: string; width: number; height: number; bytes: number }
        Insert: { photo_id: string; kind: "thumb" | "web" | "full"; r2_key: string; width: number; height: number; bytes: number }
        Update: { r2_key?: string; width?: number; height?: number; bytes?: number }
        Relationships: []
      }
      /** bcrypt hashes of gallery passwords. Service role only; no API role can read it. */
      gallery_secrets: {
        Row: { gallery_id: string; password_hash: string; password_cipher: string | null; updated_at: Timestamp }
        Insert: { gallery_id: string; password_hash: string; password_cipher?: string | null; updated_at?: Timestamp }
        Update: { password_hash?: string; password_cipher?: string | null; updated_at?: Timestamp }
        Relationships: []
      }
      /** Client favourites. Written only by the server (service role); members of the studio can read. */
      selections: {
        Row: { id: string; gallery_id: string; photo_id: string; visitor_id: string; client_name: string | null; created_at: Timestamp }
        Insert: { id?: string; gallery_id: string; photo_id: string; visitor_id: string; client_name?: string | null }
        Update: { client_name?: string | null }
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
      public_slug_available: { Args: { p_slug: string; p_gallery_id?: string }; Returns: boolean }
      publish_gallery: {
        Args: {
          p_gallery_id: string
          p_slug: string
          p_password_hash?: string | null
          p_remove_password?: boolean
          p_expires_at?: string | null
          p_password_cipher?: string | null
        }
        Returns: { public_slug: string; published_at: Timestamp; expires_at: Timestamp | null; has_password: boolean }[]
      }
      unpublish_gallery: { Args: { p_gallery_id: string }; Returns: undefined }
      gallery_key_cipher: { Args: { p_gallery_id: string }; Returns: string | null }
      create_studio: {
        Args: { p_name: string; p_slug: string; p_region?: string; p_brand_color?: string }
        Returns: Database["public"]["Tables"]["studios"]["Row"]
      }
      create_gallery: {
        Args: { p_studio_id: string; p_title: string; p_event_date?: string | null; p_sections?: string[] }
        Returns: string
      }
      is_member: { Args: { p_studio_id: string }; Returns: boolean }
      reorder_photos: { Args: { p_gallery_id: string; p_photo_ids: string[] }; Returns: undefined }
    }
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}

export type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"]
export type Studio = Tables<"studios">
export type Profile = Tables<"profiles">
export type GalleryOverview = Database["public"]["Views"]["gallery_overview"]["Row"]

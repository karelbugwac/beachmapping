export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'user' | 'beach_owner' | 'beach_manager' | 'admin';

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          full_name: string;
          email: string | null;
          profile_image_url: string | null;
          location: string | null;
          pin: string | null;
          role: UserRole;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          full_name: string;
          email?: string | null;
          profile_image_url?: string | null;
          location?: string | null;
          pin?: string | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string;
          email?: string | null;
          profile_image_url?: string | null;
          location?: string | null;
          pin?: string | null;
          role?: UserRole;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      beaches: {
        Row: {
          id: string;
          owner_id: string | null;
          slug: string;
          name: string;
          description: string;
          location: string;
          latitude: number;
          longitude: number;
          cover_image: string | null;
          images: { category: string; caption: string; photo_url: string }[] | null;
          virtual_tour_url: string | null;
          contact_phone: string | null;
          contact_email: string | null;
          opening_hours: string;
          entrance_fee: string | null;
          cottage_fee: string | null;
          rules: string | null;
          status: 'active' | 'suspended';
          average_rating: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          owner_id?: string | null;
          slug: string;
          name: string;
          description: string;
          location: string;
          latitude: number;
          longitude: number;
          cover_image?: string | null;
          images?: { category: string; caption: string; photo_url: string }[] | null;
          virtual_tour_url?: string | null;
          contact_phone?: string | null;
          contact_email?: string | null;
          opening_hours?: string;
          entrance_fee?: string | null;
          cottage_fee?: string | null;
          rules?: string | null;
          status?: 'active' | 'suspended';
          average_rating?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          owner_id?: string | null;
          slug?: string;
          name?: string;
          description?: string;
          location?: string;
          latitude?: number;
          longitude?: number;
          cover_image?: string | null;
          images?: { category: string; caption: string; photo_url: string }[] | null;
          virtual_tour_url?: string | null;
          contact_phone?: string | null;
          contact_email?: string | null;
          opening_hours?: string;
          entrance_fee?: string | null;
          cottage_fee?: string | null;
          rules?: string | null;
          status?: 'active' | 'suspended';
          average_rating?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      activities: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      beach_activity: {
        Row: {
          beach_id: string;
          activity_id: string;
        };
        Insert: {
          beach_id: string;
          activity_id: string;
        };
        Update: {
          beach_id?: string;
          activity_id?: string;
        };
        Relationships: [];
      };
      amenities: {
        Row: {
          id: string;
          name: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      beach_amenity: {
        Row: {
          beach_id: string;
          amenity_id: string;
        };
        Insert: {
          beach_id: string;
          amenity_id: string;
        };
        Update: {
          beach_id?: string;
          amenity_id?: string;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          beach_id: string;
          user_id: string;
          rating: number;
          comment: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          beach_id: string;
          user_id: string;
          rating: number;
          comment: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          beach_id?: string;
          user_id?: string;
          rating?: number;
          comment?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      review_photos: {
        Row: {
          id: string;
          review_id: string;
          photo_path: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          review_id: string;
          photo_path: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          review_id?: string;
          photo_path?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      owner_applications: {
        Row: {
          id: string;
          applicant_user_id: string | null;
          applicant_full_name: string;
          applicant_email: string;
          applicant_location: string | null;
          contact_phone: string;
          business_name: string;
          beach_name: string;
          beach_description: string | null;
          beach_location: string;
          latitude: number | null;
          longitude: number | null;
          business_permit_path: string;
          proof_of_ownership_path: string;
          profile_image_path: string | null;
          cover_image_path: string | null;
          virtual_tour_url: string | null;
          status: 'pending' | 'approved' | 'rejected';
          rejection_reason: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          applicant_user_id?: string | null;
          applicant_full_name: string;
          applicant_email: string;
          applicant_location?: string | null;
          contact_phone: string;
          business_name: string;
          beach_name: string;
          beach_description?: string | null;
          beach_location: string;
          latitude?: number | null;
          longitude?: number | null;
          business_permit_path: string;
          proof_of_ownership_path: string;
          profile_image_path?: string | null;
          cover_image_path?: string | null;
          virtual_tour_url?: string | null;
          status?: 'pending' | 'approved' | 'rejected';
          rejection_reason?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          applicant_user_id?: string | null;
          applicant_full_name?: string;
          applicant_email?: string;
          applicant_location?: string | null;
          contact_phone?: string;
          business_name?: string;
          beach_name?: string;
          beach_description?: string | null;
          beach_location?: string;
          latitude?: number | null;
          longitude?: number | null;
          business_permit_path?: string;
          proof_of_ownership_path?: string;
          profile_image_path?: string | null;
          cover_image_path?: string | null;
          virtual_tour_url?: string | null;
          status?: 'pending' | 'approved' | 'rejected';
          rejection_reason?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      beach_external_links: {
        Row: {
          id: string;
          beach_id: string;
          label: string;
          url: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          beach_id: string;
          label: string;
          url: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          beach_id?: string;
          label?: string;
          url?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      beach_weather_snapshots: {
        Row: {
          id: string;
          beach_id: string;
          tide_extremes: Json;
          synced_at: string;
        };
        Insert: {
          id?: string;
          beach_id: string;
          tide_extremes: Json;
          synced_at?: string;
        };
        Update: {
          id?: string;
          beach_id?: string;
          tide_extremes?: Json;
          synced_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Beach = Database['public']['Tables']['beaches']['Row'];
export type Activity = Database['public']['Tables']['activities']['Row'];
export type Amenity = Database['public']['Tables']['amenities']['Row'];
export type Review = Database['public']['Tables']['reviews']['Row'];
export type ReviewPhoto = Database['public']['Tables']['review_photos']['Row'];
export type OwnerApplication = Database['public']['Tables']['owner_applications']['Row'];
export type BeachExternalLink = Database['public']['Tables']['beach_external_links']['Row'];
export type BeachWeatherSnapshot = Database['public']['Tables']['beach_weather_snapshots']['Row'];

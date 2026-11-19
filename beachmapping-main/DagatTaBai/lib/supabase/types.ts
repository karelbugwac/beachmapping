export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type UserRole = 'user' | 'beach_owner' | 'beach_manager' | 'admin';
export type ApplicationStatus =
  | 'draft'
  | 'pending'
  | 'under_review'
  | 'needs_changes'
  | 'approved'
  | 'rejected';

export type Database = {
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
          status: 'active' | 'suspended';
          suspension_reason: string | null;
          suspended_at: string | null;
          suspension_ends_at: string | null;
          account_status: 'active' | 'under_review' | 'suspended';
          status_reason: string | null;
          status_reason_type: string | null;
          suspended_until: string | null;
          status_changed_by: string | null;
          status_changed_at: string | null;
          pin_reset_required: boolean;
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
          status?: 'active' | 'suspended';
          suspension_reason?: string | null;
          suspended_at?: string | null;
          suspension_ends_at?: string | null;
          account_status?: 'active' | 'under_review' | 'suspended';
          status_reason?: string | null;
          status_reason_type?: string | null;
          suspended_until?: string | null;
          status_changed_by?: string | null;
          status_changed_at?: string | null;
          pin_reset_required?: boolean;
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
          status?: 'active' | 'suspended';
          suspension_reason?: string | null;
          suspended_at?: string | null;
          suspension_ends_at?: string | null;
          account_status?: 'active' | 'under_review' | 'suspended';
          status_reason?: string | null;
          status_reason_type?: string | null;
          suspended_until?: string | null;
          status_changed_by?: string | null;
          status_changed_at?: string | null;
          pin_reset_required?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      platform_reviews: {
        Row: {
          id: string;
          user_id: string | null;
          rating: number;
          comment: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id?: string | null;
          rating: number;
          comment: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string | null;
          rating?: number;
          comment?: string;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [{
          foreignKeyName: 'platform_reviews_user_id_fkey';
          columns: ['user_id'];
          isOneToOne: false;
          referencedRelation: 'profiles';
          referencedColumns: ['id'];
        }];
      };
      admin_audit_log: {
        Row: {
          id: string;
          admin_id: string | null;
          target_user_id: string;
          action: 'status_change' | 'reason_edit' | 'reset_password' | 'reset_pin';
          from_status: 'active' | 'under_review' | 'suspended' | null;
          to_status: 'active' | 'under_review' | 'suspended' | null;
          reason: string | null;
          reason_type: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_id?: string | null;
          target_user_id: string;
          action: 'status_change' | 'reason_edit' | 'reset_password' | 'reset_pin';
          from_status?: 'active' | 'under_review' | 'suspended' | null;
          to_status?: 'active' | 'under_review' | 'suspended' | null;
          reason?: string | null;
          reason_type?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          admin_id?: string | null;
          target_user_id?: string;
          action?: 'status_change' | 'reason_edit' | 'reset_password' | 'reset_pin';
          from_status?: 'active' | 'under_review' | 'suspended' | null;
          to_status?: 'active' | 'under_review' | 'suspended' | null;
          reason?: string | null;
          reason_type?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      login_devices: {
        Row: {
          id: string;
          user_id: string;
          device_id: string;
          browser: string;
          platform: string;
          first_seen_at: string;
          last_seen_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          device_id: string;
          browser: string;
          platform: string;
          first_seen_at?: string;
          last_seen_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          device_id?: string;
          browser?: string;
          platform?: string;
          first_seen_at?: string;
          last_seen_at?: string;
        };
        Relationships: [];
      };
      user_notifications: {
        Row: {
          id: string;
          user_id: string;
          login_device_id: string | null;
          type: 'new_device_login' | 'tour_status' | 'account_status' | 'pin_reset';
          title: string | null;
          message: string | null;
          action_url: string | null;
          created_at: string;
          read_at: string | null;
          response: 'confirmed' | 'unrecognized' | null;
          responded_at: string | null;
        };
        Insert: {
          id?: string;
          user_id: string;
          login_device_id?: string | null;
          type: 'new_device_login' | 'tour_status' | 'account_status' | 'pin_reset';
          title?: string | null;
          message?: string | null;
          action_url?: string | null;
          created_at?: string;
          read_at?: string | null;
          response?: 'confirmed' | 'unrecognized' | null;
          responded_at?: string | null;
        };
        Update: {
          id?: string;
          user_id?: string;
          login_device_id?: string | null;
          type?: 'new_device_login' | 'tour_status' | 'account_status' | 'pin_reset';
          title?: string | null;
          message?: string | null;
          action_url?: string | null;
          created_at?: string;
          read_at?: string | null;
          response?: 'confirmed' | 'unrecognized' | null;
          responded_at?: string | null;
        };
        Relationships: [{
          foreignKeyName: 'user_notifications_login_device_id_fkey';
          columns: ['login_device_id'];
          isOneToOne: false;
          referencedRelation: 'login_devices';
          referencedColumns: ['id'];
        }];
      };
      beach_tour_requests: {
        Row: {
          id: string;
          beach_id: string;
          owner_id: string | null;
          requested_tour_url: string;
          requester_note: string | null;
          status: 'in_progress' | 'review' | 'approved';
          rejection_reason: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          status_updated_at: string;
          status_note: string | null;
          approved_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          beach_id: string;
          owner_id?: string | null;
          requested_tour_url: string;
          requester_note?: string | null;
          status?: 'in_progress' | 'review' | 'approved';
          rejection_reason?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          status_updated_at?: string;
          status_note?: string | null;
          approved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          beach_id?: string;
          owner_id?: string | null;
          requested_tour_url?: string;
          requester_note?: string | null;
          status?: 'in_progress' | 'review' | 'approved';
          rejection_reason?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          status_updated_at?: string;
          status_note?: string | null;
          approved_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      beach_tour_status_history: {
        Row: {
          id: string;
          tour_id: string;
          from_status: 'in_progress' | 'review' | 'approved' | null;
          to_status: 'in_progress' | 'review' | 'approved';
          note: string | null;
          changed_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          tour_id: string;
          from_status?: 'in_progress' | 'review' | 'approved' | null;
          to_status: 'in_progress' | 'review' | 'approved';
          note?: string | null;
          changed_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tour_id?: string;
          from_status?: 'in_progress' | 'review' | 'approved' | null;
          to_status: 'in_progress' | 'review' | 'approved';
          note?: string | null;
          changed_by?: string | null;
          created_at?: string;
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
          latitude: number | null;
          longitude: number | null;
          cover_image: string | null;
          images: { category: string; caption: string; photo_url: string }[] | null;
          virtual_tour_url: string | null;
          contact_phone: string | null;
          contact_email: string | null;
          facebook_url: string | null;
          instagram_url: string | null;
          peak_days: string | null;
          peak_hours: string | null;
          best_visiting_time: string | null;
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
          latitude: number | null;
          longitude: number | null;
          cover_image?: string | null;
          images?: { category: string; caption: string; photo_url: string }[] | null;
          virtual_tour_url?: string | null;
          contact_phone?: string | null;
          contact_email?: string | null;
          facebook_url?: string | null;
          instagram_url?: string | null;
          peak_days?: string | null;
          peak_hours?: string | null;
          best_visiting_time?: string | null;
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
          latitude?: number | null;
          longitude?: number | null;
          cover_image?: string | null;
          images?: { category: string; caption: string; photo_url: string }[] | null;
          virtual_tour_url?: string | null;
          contact_phone?: string | null;
          contact_email?: string | null;
          facebook_url?: string | null;
          instagram_url?: string | null;
          peak_days?: string | null;
          peak_hours?: string | null;
          best_visiting_time?: string | null;
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
          status: ApplicationStatus;
          rejection_reason: string | null;
          status_note: string | null;
          status_updated_at: string;
          decided_at: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          liveness_status: 'passed' | 'failed' | 'flagged' | 'pending';
          liveness_checked_at: string | null;
          liveness_attempts: number;
          liveness_snapshot_path: string | null;
          liveness_flagged_reasons: Json;
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
          status?: ApplicationStatus;
          rejection_reason?: string | null;
          status_note?: string | null;
          status_updated_at?: string;
          decided_at?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          liveness_status?: 'passed' | 'failed' | 'flagged' | 'pending';
          liveness_checked_at?: string | null;
          liveness_attempts?: number;
          liveness_snapshot_path?: string | null;
          liveness_flagged_reasons?: Json;
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
          status?: ApplicationStatus;
          rejection_reason?: string | null;
          status_note?: string | null;
          status_updated_at?: string;
          decided_at?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          liveness_status?: 'passed' | 'failed' | 'flagged' | 'pending';
          liveness_checked_at?: string | null;
          liveness_attempts?: number;
          liveness_snapshot_path?: string | null;
          liveness_flagged_reasons?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      application_status_history: {
        Row: {
          id: string;
          application_id: string;
          from_status: ApplicationStatus | null;
          to_status: ApplicationStatus;
          note: string | null;
          changed_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          application_id: string;
          from_status?: ApplicationStatus | null;
          to_status: ApplicationStatus;
          note?: string | null;
          changed_by?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          application_id?: string;
          from_status?: ApplicationStatus | null;
          to_status?: ApplicationStatus;
          note?: string | null;
          changed_by?: string | null;
          created_at?: string;
        };
        Relationships: [];
      };
      owner_liveness_sessions: {
        Row: {
          id: string;
          nonce_hash: string;
          ip_hash: string;
          user_agent_hash: string;
          user_id: string | null;
          challenges: Json;
          status: 'pending' | 'passed' | 'failed' | 'flagged';
          attempts: number;
          snapshot_path: string | null;
          flagged_reasons: Json;
          created_at: string;
          expires_at: string;
          completed_at: string | null;
          consumed_at: string | null;
        };
        Insert: {
          id?: string;
          nonce_hash: string;
          ip_hash: string;
          user_agent_hash: string;
          user_id?: string | null;
          challenges: Json;
          status?: 'pending' | 'passed' | 'failed' | 'flagged';
          attempts?: number;
          snapshot_path?: string | null;
          flagged_reasons?: Json;
          created_at?: string;
          expires_at: string;
          completed_at?: string | null;
          consumed_at?: string | null;
        };
        Update: {
          id?: string;
          nonce_hash?: string;
          ip_hash?: string;
          user_agent_hash?: string;
          user_id?: string | null;
          challenges?: Json;
          status?: 'pending' | 'passed' | 'failed' | 'flagged';
          attempts?: number;
          snapshot_path?: string | null;
          flagged_reasons?: Json;
          created_at?: string;
          expires_at?: string;
          completed_at?: string | null;
          consumed_at?: string | null;
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
      beach_general_information: {
        Row: {
          id: string;
          beach_id: string;
          entrance_fee: number | null;
          child_entrance_fee: number | null;
          senior_entrance_fee: number | null;
          entrance_fee_notes: string | null;
          general_information: string | null;
          updated_at: string;
        };
        Insert: {
          id?: string;
          beach_id: string;
          entrance_fee?: number | null;
          child_entrance_fee?: number | null;
          senior_entrance_fee?: number | null;
          entrance_fee_notes?: string | null;
          general_information?: string | null;
          updated_at?: string;
        };
        Update: {
          id?: string;
          beach_id?: string;
          entrance_fee?: number | null;
          child_entrance_fee?: number | null;
          senior_entrance_fee?: number | null;
          entrance_fee_notes?: string | null;
          general_information?: string | null;
          updated_at?: string;
        };
        Relationships: [{
          foreignKeyName: 'beach_general_information_beach_id_fkey';
          columns: ['beach_id'];
          isOneToOne: true;
          referencedRelation: 'beaches';
          referencedColumns: ['id'];
        }];
      };
      beach_opening_hours: {
        Row: {
          id: string;
          beach_id: string;
          day_of_week: number;
          is_open: boolean;
          opening_time: string | null;
          closing_time: string | null;
        };
        Insert: {
          id?: string;
          beach_id: string;
          day_of_week: number;
          is_open?: boolean;
          opening_time?: string | null;
          closing_time?: string | null;
        };
        Update: {
          id?: string;
          beach_id?: string;
          day_of_week?: number;
          is_open?: boolean;
          opening_time?: string | null;
          closing_time?: string | null;
        };
        Relationships: [{
          foreignKeyName: 'beach_opening_hours_beach_id_fkey';
          columns: ['beach_id'];
          isOneToOne: false;
          referencedRelation: 'beaches';
          referencedColumns: ['id'];
        }];
      };
      beach_cottages: {
        Row: {
          id: string;
          beach_id: string;
          name: string;
          description: string | null;
          price: number | null;
          price_unit: string;
          capacity: number | null;
          capacity_label: string | null;
          images: string[];
          is_available: boolean;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          beach_id: string;
          name: string;
          description?: string | null;
          price?: number | null;
          price_unit?: string;
          capacity?: number | null;
          capacity_label?: string | null;
          images?: string[];
          is_available?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          beach_id?: string;
          name?: string;
          description?: string | null;
          price?: number | null;
          price_unit?: string;
          capacity?: number | null;
          capacity_label?: string | null;
          images?: string[];
          is_available?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [{
          foreignKeyName: 'beach_cottages_beach_id_fkey';
          columns: ['beach_id'];
          isOneToOne: false;
          referencedRelation: 'beaches';
          referencedColumns: ['id'];
        }];
      };
      beach_cottage_photos: {
        Row: {
          id: string;
          cottage_id: string;
          image_url: string;
          storage_path: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          cottage_id: string;
          image_url: string;
          storage_path: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          cottage_id?: string;
          image_url?: string;
          storage_path?: string;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [{
          foreignKeyName: 'beach_cottage_photos_cottage_id_fkey';
          columns: ['cottage_id'];
          isOneToOne: false;
          referencedRelation: 'beach_cottages';
          referencedColumns: ['id'];
        }];
      };
      beach_facilities: {
        Row: {
          id: string;
          beach_id: string;
          name: string;
          description: string | null;
          price: number | null;
          price_unit: string | null;
          price_label: string | null;
          category: string | null;
          rates: Json;
          images: string[];
          is_available: boolean;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          beach_id: string;
          name: string;
          description?: string | null;
          price?: number | null;
          price_unit?: string | null;
          price_label?: string | null;
          category?: string | null;
          rates?: Json;
          images?: string[];
          is_available?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          beach_id?: string;
          name?: string;
          description?: string | null;
          price?: number | null;
          price_unit?: string | null;
          price_label?: string | null;
          category?: string | null;
          rates?: Json;
          images?: string[];
          is_available?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [{
          foreignKeyName: 'beach_facilities_beach_id_fkey';
          columns: ['beach_id'];
          isOneToOne: false;
          referencedRelation: 'beaches';
          referencedColumns: ['id'];
        }];
      };
      beach_facility_photos: {
        Row: {
          id: string;
          facility_id: string;
          image_url: string;
          storage_path: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          facility_id: string;
          image_url: string;
          storage_path: string;
          sort_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          facility_id?: string;
          image_url?: string;
          storage_path?: string;
          sort_order?: number;
          created_at?: string;
        };
        Relationships: [{
          foreignKeyName: 'beach_facility_photos_facility_id_fkey';
          columns: ['facility_id'];
          isOneToOne: false;
          referencedRelation: 'beach_facilities';
          referencedColumns: ['id'];
        }];
      };
      beach_posts: {
        Row: {
          id: string;
          beach_id: string;
          author_id: string | null;
          caption: string | null;
          image_path: string | null;
          status: 'draft' | 'published' | 'hidden';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          beach_id: string;
          author_id?: string | null;
          caption?: string | null;
          image_path?: string | null;
          status?: 'draft' | 'published' | 'hidden';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          beach_id?: string;
          author_id?: string | null;
          caption?: string | null;
          image_path?: string | null;
          status?: 'draft' | 'published' | 'hidden';
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [{
          foreignKeyName: 'beach_posts_beach_id_fkey';
          columns: ['beach_id'];
          isOneToOne: false;
          referencedRelation: 'beaches';
          referencedColumns: ['id'];
        }];
      };
      beach_caretaker_invitations: {
        Row: {
          id: string;
          beach_id: string;
          invited_by: string;
          invited_user_id: string | null;
          full_name: string;
          email: string;
          role_title: string;
          permissions: Json;
          status: 'invited' | 'accepted' | 'revoked';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          beach_id: string;
          invited_by: string;
          invited_user_id?: string | null;
          full_name: string;
          email: string;
          role_title: string;
          permissions?: Json;
          status?: 'invited' | 'accepted' | 'revoked';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          beach_id?: string;
          invited_by?: string;
          invited_user_id?: string | null;
          full_name?: string;
          email?: string;
          role_title?: string;
          permissions?: Json;
          status?: 'invited' | 'accepted' | 'revoked';
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [{
          foreignKeyName: 'beach_caretaker_invitations_beach_id_fkey';
          columns: ['beach_id'];
          isOneToOne: false;
          referencedRelation: 'beaches';
          referencedColumns: ['id'];
        }];
      };
      beach_coordinate_requests: {
        Row: {
          id: string;
          beach_id: string;
          owner_id: string | null;
          requested_latitude: number;
          requested_longitude: number;
          requested_location: string;
          requester_note: string | null;
          status: 'pending' | 'approved' | 'rejected';
          rejection_reason: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          beach_id: string;
          owner_id?: string | null;
          requested_latitude: number;
          requested_longitude: number;
          requested_location: string;
          requester_note?: string | null;
          status?: 'pending' | 'approved' | 'rejected';
          rejection_reason?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          beach_id?: string;
          owner_id?: string | null;
          requested_latitude?: number;
          requested_longitude?: number;
          requested_location?: string;
          requester_note?: string | null;
          status?: 'pending' | 'approved' | 'rejected';
          rejection_reason?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [{
          foreignKeyName: 'beach_coordinate_requests_beach_id_fkey';
          columns: ['beach_id'];
          isOneToOne: false;
          referencedRelation: 'beaches';
          referencedColumns: ['id'];
        }];
      };
      beach_reviews: {
        Row: {
          id: string;
          beach_id: string;
          user_id: string;
          rating: number;
          comment: string;
          photos: string[];
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          beach_id: string;
          user_id: string;
          rating: number;
          comment: string;
          photos?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          beach_id?: string;
          user_id?: string;
          rating?: number;
          comment?: string;
          photos?: string[];
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'beach_reviews_beach_id_fkey';
            columns: ['beach_id'];
            isOneToOne: false;
            referencedRelation: 'beaches';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'beach_reviews_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      beach_review_reports: {
        Row: {
          id: string;
          review_id: string;
          beach_id: string;
          reporter_user_id: string;
          reason: string;
          status: 'pending' | 'removed' | 'dismissed';
          created_at: string;
          reviewed_at: string | null;
        };
        Insert: {
          id?: string;
          review_id: string;
          beach_id: string;
          reporter_user_id: string;
          reason: string;
          status?: 'pending' | 'removed' | 'dismissed';
          created_at?: string;
          reviewed_at?: string | null;
        };
        Update: {
          id?: string;
          review_id?: string;
          beach_id?: string;
          reporter_user_id?: string;
          reason?: string;
          status?: 'pending' | 'removed' | 'dismissed';
          created_at?: string;
          reviewed_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'beach_review_reports_beach_id_fkey';
            columns: ['beach_id'];
            isOneToOne: false;
            referencedRelation: 'beaches';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'beach_review_reports_reporter_user_id_fkey';
            columns: ['reporter_user_id'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'beach_review_reports_review_id_fkey';
            columns: ['review_id'];
            isOneToOne: false;
            referencedRelation: 'beach_reviews';
            referencedColumns: ['id'];
          }
        ];
      };
      visitor_events: {
        Row: {
          id: string;
          session_id: string;
          page_key: string;
          event_type: 'platform_visit' | 'beach_profile_view';
          beach_id: string | null;
          visit_date: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          session_id: string;
          page_key: string;
          event_type: 'platform_visit' | 'beach_profile_view';
          beach_id?: string | null;
          visit_date?: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          session_id?: string;
          page_key?: string;
          event_type?: 'platform_visit' | 'beach_profile_view';
          beach_id?: string | null;
          visit_date?: string;
          created_at?: string;
        };
        Relationships: [{
          foreignKeyName: 'visitor_events_beach_id_fkey';
          columns: ['beach_id'];
          isOneToOne: false;
          referencedRelation: 'beaches';
          referencedColumns: ['id'];
        }];
      };
      ai_chat_messages: {
        Row: {
          id: string;
          user_id: string;
          role: 'user' | 'assistant';
          content: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          role: 'user' | 'assistant';
          content: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          role?: 'user' | 'assistant';
          content?: string;
          created_at?: string;
        };
        Relationships: [{
          foreignKeyName: 'ai_chat_messages_user_id_fkey';
          columns: ['user_id'];
          isOneToOne: false;
          referencedRelation: 'profiles';
          referencedColumns: ['id'];
        }];
      };
      email_notifications: {
        Row: {
          id: string;
          recipient_email: string;
          recipient_name: string | null;
          notification_type: 'application_received' | 'application_approved' | 'application_rejected';
          application_id: string | null;
          subject: string;
          message: string;
          status: 'pending' | 'sent' | 'failed';
          sent_at: string | null;
          error_message: string | null;
        };
        Insert: {
          id?: string;
          recipient_email: string;
          recipient_name?: string | null;
          notification_type: 'application_received' | 'application_approved' | 'application_rejected';
          application_id?: string | null;
          subject: string;
          message: string;
          status?: 'pending' | 'sent' | 'failed';
          sent_at?: string | null;
          error_message?: string | null;
        };
        Update: {
          id?: string;
          recipient_email?: string;
          recipient_name?: string | null;
          notification_type?: 'application_received' | 'application_approved' | 'application_rejected';
          application_id?: string | null;
          subject?: string;
          message?: string;
          status?: 'pending' | 'sent' | 'failed';
          sent_at?: string | null;
          error_message?: string | null;
        };
        Relationships: [{
          foreignKeyName: 'email_notifications_application_id_fkey';
          columns: ['application_id'];
          isOneToOne: false;
          referencedRelation: 'owner_applications';
          referencedColumns: ['id'];
        }];
      };
      beach_activities: {
        Row: {
          id: string;
          beach_id: string;
          name: string;
          description: string | null;
          price: number | null;
          price_unit: string | null;
          images: string[];
          is_available: boolean;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          beach_id: string;
          name: string;
          description?: string | null;
          price?: number | null;
          price_unit?: string | null;
          images?: string[];
          is_available?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          beach_id?: string;
          name?: string;
          description?: string | null;
          price?: number | null;
          price_unit?: string | null;
          images?: string[];
          is_available?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [{
          foreignKeyName: 'beach_activities_beach_id_fkey';
          columns: ['beach_id'];
          isOneToOne: false;
          referencedRelation: 'beaches';
          referencedColumns: ['id'];
        }];
      };
      beach_equipment: {
        Row: {
          id: string;
          beach_id: string;
          name: string;
          description: string | null;
          rental_price: number | null;
          price_unit: string | null;
          quantity: number | null;
          images: string[];
          is_available: boolean;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          beach_id: string;
          name: string;
          description?: string | null;
          rental_price?: number | null;
          price_unit?: string | null;
          quantity?: number | null;
          images?: string[];
          is_available?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          beach_id?: string;
          name?: string;
          description?: string | null;
          rental_price?: number | null;
          price_unit?: string | null;
          quantity?: number | null;
          images?: string[];
          is_available?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [{
          foreignKeyName: 'beach_equipment_beach_id_fkey';
          columns: ['beach_id'];
          isOneToOne: false;
          referencedRelation: 'beaches';
          referencedColumns: ['id'];
        }];
      };
      beach_rooms: {
        Row: {
          id: string;
          beach_id: string;
          name: string;
          description: string | null;
          price: number | null;
          price_unit: string;
          capacity: number | null;
          images: string[];
          is_available: boolean;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          beach_id: string;
          name: string;
          description?: string | null;
          price?: number | null;
          price_unit?: string;
          capacity?: number | null;
          images?: string[];
          is_available?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          beach_id?: string;
          name?: string;
          description?: string | null;
          price?: number | null;
          price_unit?: string;
          capacity?: number | null;
          images?: string[];
          is_available?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [{
          foreignKeyName: 'beach_rooms_beach_id_fkey';
          columns: ['beach_id'];
          isOneToOne: false;
          referencedRelation: 'beaches';
          referencedColumns: ['id'];
        }];
      };
      beach_food_drinks: {
        Row: {
          id: string;
          beach_id: string;
          name: string;
          description: string | null;
          category: string | null;
          price: number | null;
          images: string[];
          is_available: boolean;
          display_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          beach_id: string;
          name: string;
          description?: string | null;
          category?: string | null;
          price?: number | null;
          images?: string[];
          is_available?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          beach_id?: string;
          name?: string;
          description?: string | null;
          category?: string | null;
          price?: number | null;
          images?: string[];
          is_available?: boolean;
          display_order?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [{
          foreignKeyName: 'beach_food_drinks_beach_id_fkey';
          columns: ['beach_id'];
          isOneToOne: false;
          referencedRelation: 'beaches';
          referencedColumns: ['id'];
        }];
      };
      beach_rules: {
        Row: {
          id: string;
          beach_id: string;
          rule_type: 'do' | 'dont';
          title: string;
          description: string | null;
          display_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          beach_id: string;
          rule_type: 'do' | 'dont';
          title: string;
          description?: string | null;
          display_order?: number;
          created_at?: string;
        };
        Update: {
          id?: string;
          beach_id?: string;
          rule_type?: 'do' | 'dont';
          title?: string;
          description?: string | null;
          display_order?: number;
          created_at?: string;
        };
        Relationships: [{
          foreignKeyName: 'beach_rules_beach_id_fkey';
          columns: ['beach_id'];
          isOneToOne: false;
          referencedRelation: 'beaches';
          referencedColumns: ['id'];
        }];
      };
      admin_reset_rate_limits: {
        Row: {
          id: string;
          admin_id: string;
          target_user_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_id: string;
          target_user_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          admin_id?: string;
          target_user_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
      admin_status_change_rate_limits: {
        Row: {
          id: string;
          admin_id: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          admin_id: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          admin_id?: string;
          created_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      beach_published_tours: {
        Row: {
          beach_id: string;
          requested_tour_url: string;
          approved_at: string | null;
          status_updated_at: string;
        };
        Relationships: [];
      };
    };
    Functions: {
      register_login_device: {
        Args: {
          p_device_id: string;
          p_browser: string;
          p_platform: string;
        };
        Returns: boolean;
      };
      reserve_admin_reset_rate_limit: {
        Args: {
          p_admin_id: string;
          p_target_user_id: string;
        };
        Returns: number;
      };
      reserve_admin_status_change: {
        Args: {
          p_admin_id: string;
        };
        Returns: number;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

export type Profile = Database['public']['Tables']['profiles']['Row'];
export type Beach = Database['public']['Tables']['beaches']['Row'];
export type Activity = Database['public']['Tables']['activities']['Row'];
export type Amenity = Database['public']['Tables']['amenities']['Row'];
export type Review = Database['public']['Tables']['reviews']['Row'];
export type ReviewPhoto = Database['public']['Tables']['review_photos']['Row'];
export type OwnerApplication = Database['public']['Tables']['owner_applications']['Row'];
export type BeachExternalLink = Database['public']['Tables']['beach_external_links']['Row'];
export type BeachWeatherSnapshot = Database['public']['Tables']['beach_weather_snapshots']['Row'];
export type BeachGeneralInformation = Database['public']['Tables']['beach_general_information']['Row'];
export type BeachCottage = Database['public']['Tables']['beach_cottages']['Row'];
export type BeachCottagePhoto = Database['public']['Tables']['beach_cottage_photos']['Row'];
export type BeachFacility = Database['public']['Tables']['beach_facilities']['Row'];
export type BeachFacilityPhoto = Database['public']['Tables']['beach_facility_photos']['Row'];
export type BeachPost = Database['public']['Tables']['beach_posts']['Row'];
export type BeachCaretakerInvitation = Database['public']['Tables']['beach_caretaker_invitations']['Row'];
export type BeachCoordinateRequest = Database['public']['Tables']['beach_coordinate_requests']['Row'];
export type BeachReview = Database['public']['Tables']['beach_reviews']['Row'];
export type BeachReviewReport = Database['public']['Tables']['beach_review_reports']['Row'];
export type VisitorEvent = Database['public']['Tables']['visitor_events']['Row'];
export type AiChatMessage = Database['public']['Tables']['ai_chat_messages']['Row'];

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
          fullname: string;
          email: string | null;
          profileimageurl: string | null;
          location: string | null;
          pin: string | null;
          role: UserRole;
          status: 'active' | 'suspended';
          suspensionreason: string | null;
          suspendedat: string | null;
          suspensionendsat: string | null;
          accountstatus: 'active' | 'under_review' | 'suspended';
          statusreason: string | null;
          statusreasontype: string | null;
          suspendeduntil: string | null;
          statuschangedby: string | null;
          statuschangedat: string | null;
          pinresetrequired: boolean;
          createdat: string;
          updatedat: string;
        };
        Insert: {
          id: string;
          fullname: string;
          email?: string | null;
          profileimageurl?: string | null;
          location?: string | null;
          pin?: string | null;
          role?: UserRole;
          status?: 'active' | 'suspended';
          suspensionreason?: string | null;
          suspendedat?: string | null;
          suspensionendsat?: string | null;
          accountstatus?: 'active' | 'under_review' | 'suspended';
          statusreason?: string | null;
          statusreasontype?: string | null;
          suspendeduntil?: string | null;
          statuschangedby?: string | null;
          statuschangedat?: string | null;
          pinresetrequired?: boolean;
          createdat?: string;
          updatedat?: string;
        };
        Update: {
          id?: string;
          fullname?: string;
          email?: string | null;
          profileimageurl?: string | null;
          location?: string | null;
          pin?: string | null;
          role?: UserRole;
          status?: 'active' | 'suspended';
          suspensionreason?: string | null;
          suspendedat?: string | null;
          suspensionendsat?: string | null;
          accountstatus?: 'active' | 'under_review' | 'suspended';
          statusreason?: string | null;
          statusreasontype?: string | null;
          suspendeduntil?: string | null;
          statuschangedby?: string | null;
          statuschangedat?: string | null;
          pinresetrequired?: boolean;
          createdat?: string;
          updatedat?: string;
        };
        Relationships: [];
      };
      platformreviews: {
        Row: {
          id: string;
          userid: string | null;
          rating: number;
          comment: string;
          createdat: string;
          updatedat: string;
        };
        Insert: {
          id?: string;
          userid?: string | null;
          rating: number;
          comment: string;
          createdat?: string;
          updatedat?: string;
        };
        Update: {
          id?: string;
          userid?: string | null;
          rating?: number;
          comment?: string;
          createdat?: string;
          updatedat?: string;
        };
        Relationships: [{
          foreignKeyName: 'platform_reviews_user_id_fkey';
          columns: ['userid'];
          isOneToOne: false;
          referencedRelation: 'profiles';
          referencedColumns: ['id'];
        }];
      };
      adminlog: {
        Row: {
          id: string;
          adminid: string | null;
          targetuserid: string;
          action: 'status_change' | 'reason_edit' | 'reset_password' | 'reset_pin';
          fromstatus: 'active' | 'under_review' | 'suspended' | null;
          tostatus: 'active' | 'under_review' | 'suspended' | null;
          reason: string | null;
          reasontype: string | null;
          createdat: string;
        };
        Insert: {
          id?: string;
          adminid?: string | null;
          targetuserid: string;
          action: 'status_change' | 'reason_edit' | 'reset_password' | 'reset_pin';
          fromstatus?: 'active' | 'under_review' | 'suspended' | null;
          tostatus?: 'active' | 'under_review' | 'suspended' | null;
          reason?: string | null;
          reasontype?: string | null;
          createdat?: string;
        };
        Update: {
          id?: string;
          adminid?: string | null;
          targetuserid?: string;
          action?: 'status_change' | 'reason_edit' | 'reset_password' | 'reset_pin';
          fromstatus?: 'active' | 'under_review' | 'suspended' | null;
          tostatus?: 'active' | 'under_review' | 'suspended' | null;
          reason?: string | null;
          reasontype?: string | null;
          createdat?: string;
        };
        Relationships: [];
      };
      logindevices: {
        Row: {
          id: string;
          userid: string;
          deviceid: string;
          browser: string;
          platform: string;
          firstseenat: string;
          lastseenat: string;
        };
        Insert: {
          id?: string;
          userid: string;
          deviceid: string;
          browser: string;
          platform: string;
          firstseenat?: string;
          lastseenat?: string;
        };
        Update: {
          id?: string;
          userid?: string;
          deviceid?: string;
          browser?: string;
          platform?: string;
          firstseenat?: string;
          lastseenat?: string;
        };
        Relationships: [];
      };
      usernotifications: {
        Row: {
          id: string;
          userid: string;
          logindeviceid: string | null;
          type: 'new_device_login' | 'tour_status' | 'accountstatus' | 'pin_reset';
          title: string | null;
          message: string | null;
          actionurl: string | null;
          createdat: string;
          readat: string | null;
          response: 'confirmed' | 'unrecognized' | null;
          respondedat: string | null;
        };
        Insert: {
          id?: string;
          userid: string;
          logindeviceid?: string | null;
          type: 'new_device_login' | 'tour_status' | 'accountstatus' | 'pin_reset';
          title?: string | null;
          message?: string | null;
          actionurl?: string | null;
          createdat?: string;
          readat?: string | null;
          response?: 'confirmed' | 'unrecognized' | null;
          respondedat?: string | null;
        };
        Update: {
          id?: string;
          userid?: string;
          logindeviceid?: string | null;
          type?: 'new_device_login' | 'tour_status' | 'accountstatus' | 'pin_reset';
          title?: string | null;
          message?: string | null;
          actionurl?: string | null;
          createdat?: string;
          readat?: string | null;
          response?: 'confirmed' | 'unrecognized' | null;
          respondedat?: string | null;
        };
        Relationships: [{
          foreignKeyName: 'user_notifications_login_device_id_fkey';
          columns: ['logindeviceid'];
          isOneToOne: false;
          referencedRelation: 'logindevices';
          referencedColumns: ['id'];
        }];
      };
      tourrequests: {
        Row: {
          id: string;
          beachid: string;
          ownerid: string | null;
          requestedtoururl: string;
          requesternote: string | null;
          status: 'in_progress' | 'review' | 'approved';
          rejectionreason: string | null;
          reviewedby: string | null;
          reviewedat: string | null;
          statusupdatedat: string;
          statusnote: string | null;
          approvedat: string | null;
          createdat: string;
          updatedat: string;
        };
        Insert: {
          id?: string;
          beachid: string;
          ownerid?: string | null;
          requestedtoururl: string;
          requesternote?: string | null;
          status?: 'in_progress' | 'review' | 'approved';
          rejectionreason?: string | null;
          reviewedby?: string | null;
          reviewedat?: string | null;
          statusupdatedat?: string;
          statusnote?: string | null;
          approvedat?: string | null;
          createdat?: string;
          updatedat?: string;
        };
        Update: {
          id?: string;
          beachid?: string;
          ownerid?: string | null;
          requestedtoururl?: string;
          requesternote?: string | null;
          status?: 'in_progress' | 'review' | 'approved';
          rejectionreason?: string | null;
          reviewedby?: string | null;
          reviewedat?: string | null;
          statusupdatedat?: string;
          statusnote?: string | null;
          approvedat?: string | null;
          createdat?: string;
          updatedat?: string;
        };
        Relationships: [];
      };
      tourstatushistory: {
        Row: {
          id: string;
          tourid: string;
          fromstatus: 'in_progress' | 'review' | 'approved' | null;
          tostatus: 'in_progress' | 'review' | 'approved';
          note: string | null;
          changedby: string | null;
          createdat: string;
        };
        Insert: {
          id?: string;
          tourid: string;
          fromstatus?: 'in_progress' | 'review' | 'approved' | null;
          tostatus: 'in_progress' | 'review' | 'approved';
          note?: string | null;
          changedby?: string | null;
          createdat?: string;
        };
        Update: {
          id?: string;
          tourid?: string;
          fromstatus?: 'in_progress' | 'review' | 'approved' | null;
          tostatus: 'in_progress' | 'review' | 'approved';
          note?: string | null;
          changedby?: string | null;
          createdat?: string;
        };
        Relationships: [];
      };
      beaches: {
        Row: {
          id: string;
          ownerid: string | null;
          slug: string;
          name: string;
          description: string;
          location: string;
          latitude: number | null;
          longitude: number | null;
          coverimageurl: string | null;
          images: { category: string; caption: string; photo_url: string }[] | null;
          virtualtoururl: string | null;
          contactphone: string | null;
          contactemail: string | null;
          facebookurl: string | null;
          instagramurl: string | null;
          peakdays: string | null;
          peakhours: string | null;
          bestvisitingtime: string | null;
          openinghours: string;
          entrancefee: string | null;
          cottagefee: string | null;
          rules: string | null;
          status: 'active' | 'suspended';
          averagerating: number;
          createdat: string;
          updatedat: string;
        };
        Insert: {
          id?: string;
          ownerid?: string | null;
          slug: string;
          name: string;
          description: string;
          location: string;
          latitude: number | null;
          longitude: number | null;
          coverimageurl?: string | null;
          images?: { category: string; caption: string; photo_url: string }[] | null;
          virtualtoururl?: string | null;
          contactphone?: string | null;
          contactemail?: string | null;
          facebookurl?: string | null;
          instagramurl?: string | null;
          peakdays?: string | null;
          peakhours?: string | null;
          bestvisitingtime?: string | null;
          openinghours?: string;
          entrancefee?: string | null;
          cottagefee?: string | null;
          rules?: string | null;
          status?: 'active' | 'suspended';
          averagerating?: number;
          createdat?: string;
          updatedat?: string;
        };
        Update: {
          id?: string;
          ownerid?: string | null;
          slug?: string;
          name?: string;
          description?: string;
          location?: string;
          latitude?: number | null;
          longitude?: number | null;
          coverimageurl?: string | null;
          images?: { category: string; caption: string; photo_url: string }[] | null;
          virtualtoururl?: string | null;
          contactphone?: string | null;
          contactemail?: string | null;
          facebookurl?: string | null;
          instagramurl?: string | null;
          peakdays?: string | null;
          peakhours?: string | null;
          bestvisitingtime?: string | null;
          openinghours?: string;
          entrancefee?: string | null;
          cottagefee?: string | null;
          rules?: string | null;
          status?: 'active' | 'suspended';
          averagerating?: number;
          createdat?: string;
          updatedat?: string;
        };
        Relationships: [];
      };
      activities: {
        Row: {
          id: string;
          name: string;
          createdat: string;
        };
        Insert: {
          id?: string;
          name: string;
          createdat?: string;
        };
        Update: {
          id?: string;
          name?: string;
          createdat?: string;
        };
        Relationships: [];
      };
      beach_activity: {
        Row: {
          beachid: string;
          activity_id: string;
        };
        Insert: {
          beachid: string;
          activity_id: string;
        };
        Update: {
          beachid?: string;
          activity_id?: string;
        };
        Relationships: [];
      };
      amenities: {
        Row: {
          id: string;
          name: string;
          createdat: string;
        };
        Insert: {
          id?: string;
          name: string;
          createdat?: string;
        };
        Update: {
          id?: string;
          name?: string;
          createdat?: string;
        };
        Relationships: [];
      };
      beach_amenity: {
        Row: {
          beachid: string;
          amenity_id: string;
        };
        Insert: {
          beachid: string;
          amenity_id: string;
        };
        Update: {
          beachid?: string;
          amenity_id?: string;
        };
        Relationships: [];
      };
      reviews: {
        Row: {
          id: string;
          beachid: string;
          userid: string;
          rating: number;
          comment: string;
          createdat: string;
          updatedat: string;
        };
        Insert: {
          id?: string;
          beachid: string;
          userid: string;
          rating: number;
          comment: string;
          createdat?: string;
          updatedat?: string;
        };
        Update: {
          id?: string;
          beachid?: string;
          userid?: string;
          rating?: number;
          comment?: string;
          createdat?: string;
          updatedat?: string;
        };
        Relationships: [];
      };
      review_photos: {
        Row: {
          id: string;
          reviewid: string;
          photo_path: string;
          createdat: string;
        };
        Insert: {
          id?: string;
          reviewid: string;
          photo_path: string;
          createdat?: string;
        };
        Update: {
          id?: string;
          reviewid?: string;
          photo_path?: string;
          createdat?: string;
        };
        Relationships: [];
      };
      ownerapplications: {
        Row: {
          id: string;
          applicantuserid: string | null;
          applicantfullname: string;
          applicantemail: string;
          applicantlocation: string | null;
          contactphone: string;
          businessname: string;
          beachname: string;
          beachdescription: string | null;
          beachlocation: string;
          latitude: number | null;
          longitude: number | null;
          businesspermitpath: string;
          proofofownershippath: string;
          valididpath: string | null;
          profileimagepath: string | null;
          coverimagepath: string | null;
          virtualtoururl: string | null;
          status: ApplicationStatus;
          rejectionreason: string | null;
          statusnote: string | null;
          statusupdatedat: string;
          decidedat: string | null;
          reviewedby: string | null;
          reviewedat: string | null;
          livenessstatus: 'passed' | 'failed' | 'flagged' | 'pending';
          livenesscheckedat: string | null;
          livenessattempts: number;
          livenesssnapshotpath: string | null;
          livenessflaggedreasons: Json;
          createdat: string;
          updatedat: string;
        };
        Insert: {
          id?: string;
          applicantuserid?: string | null;
          applicantfullname: string;
          applicantemail: string;
          applicantlocation?: string | null;
          contactphone: string;
          businessname: string;
          beachname: string;
          beachdescription?: string | null;
          beachlocation: string;
          latitude?: number | null;
          longitude?: number | null;
          businesspermitpath: string;
          proofofownershippath: string;
          valididpath?: string | null;
          profileimagepath?: string | null;
          coverimagepath?: string | null;
          virtualtoururl?: string | null;
          status?: ApplicationStatus;
          rejectionreason?: string | null;
          statusnote?: string | null;
          statusupdatedat?: string;
          decidedat?: string | null;
          reviewedby?: string | null;
          reviewedat?: string | null;
          livenessstatus?: 'passed' | 'failed' | 'flagged' | 'pending';
          livenesscheckedat?: string | null;
          livenessattempts?: number;
          livenesssnapshotpath?: string | null;
          livenessflaggedreasons?: Json;
          createdat?: string;
          updatedat?: string;
        };
        Update: {
          id?: string;
          applicantuserid?: string | null;
          applicantfullname?: string;
          applicantemail?: string;
          applicantlocation?: string | null;
          contactphone?: string;
          businessname?: string;
          beachname?: string;
          beachdescription?: string | null;
          beachlocation?: string;
          latitude?: number | null;
          longitude?: number | null;
          businesspermitpath?: string;
          proofofownershippath?: string;
          valididpath?: string | null;
          profileimagepath?: string | null;
          coverimagepath?: string | null;
          virtualtoururl?: string | null;
          status?: ApplicationStatus;
          rejectionreason?: string | null;
          statusnote?: string | null;
          statusupdatedat?: string;
          decidedat?: string | null;
          reviewedby?: string | null;
          reviewedat?: string | null;
          livenessstatus?: 'passed' | 'failed' | 'flagged' | 'pending';
          livenesscheckedat?: string | null;
          livenessattempts?: number;
          livenesssnapshotpath?: string | null;
          livenessflaggedreasons?: Json;
          createdat?: string;
          updatedat?: string;
        };
        Relationships: [];
      };
      appstatushistory: {
        Row: {
          id: string;
          applicationid: string;
          fromstatus: ApplicationStatus | null;
          tostatus: ApplicationStatus;
          note: string | null;
          changedby: string | null;
          createdat: string;
        };
        Insert: {
          id?: string;
          applicationid: string;
          fromstatus?: ApplicationStatus | null;
          tostatus: ApplicationStatus;
          note?: string | null;
          changedby?: string | null;
          createdat?: string;
        };
        Update: {
          id?: string;
          applicationid?: string;
          fromstatus?: ApplicationStatus | null;
          tostatus?: ApplicationStatus;
          note?: string | null;
          changedby?: string | null;
          createdat?: string;
        };
        Relationships: [];
      };
      livenesssessions: {
        Row: {
          id: string;
          noncehash: string;
          iphash: string;
          useragenthash: string;
          userid: string | null;
          challenges: Json;
          status: 'pending' | 'passed' | 'failed' | 'flagged';
          attempts: number;
          snapshotpath: string | null;
          flaggedreasons: Json;
          createdat: string;
          expiresat: string;
          completedat: string | null;
          consumedat: string | null;
        };
        Insert: {
          id?: string;
          noncehash: string;
          iphash: string;
          useragenthash: string;
          userid?: string | null;
          challenges: Json;
          status?: 'pending' | 'passed' | 'failed' | 'flagged';
          attempts?: number;
          snapshotpath?: string | null;
          flaggedreasons?: Json;
          createdat?: string;
          expiresat: string;
          completedat?: string | null;
          consumedat?: string | null;
        };
        Update: {
          id?: string;
          noncehash?: string;
          iphash?: string;
          useragenthash?: string;
          userid?: string | null;
          challenges?: Json;
          status?: 'pending' | 'passed' | 'failed' | 'flagged';
          attempts?: number;
          snapshotpath?: string | null;
          flaggedreasons?: Json;
          createdat?: string;
          expiresat?: string;
          completedat?: string | null;
          consumedat?: string | null;
        };
        Relationships: [];
      };
      externallinks: {
        Row: {
          id: string;
          beachid: string;
          label: string;
          url: string;
          createdat: string;
        };
        Insert: {
          id?: string;
          beachid: string;
          label: string;
          url: string;
          createdat?: string;
        };
        Update: {
          id?: string;
          beachid?: string;
          label?: string;
          url?: string;
          createdat?: string;
        };
        Relationships: [];
      };
      weathersnapshots: {
        Row: {
          id: string;
          beachid: string;
          tideextremes: Json;
          syncedat: string;
        };
        Insert: {
          id?: string;
          beachid: string;
          tideextremes: Json;
          syncedat?: string;
        };
        Update: {
          id?: string;
          beachid?: string;
          tideextremes?: Json;
          syncedat?: string;
        };
        Relationships: [];
      };
      beachinfo: {
        Row: {
          id: string;
          beachid: string;
          entrancefee: number | null;
          childentrancefee: number | null;
          seniorentrancefee: number | null;
          entrancefeenotes: string | null;
          generalinformation: string | null;
          updatedat: string;
        };
        Insert: {
          id?: string;
          beachid: string;
          entrancefee?: number | null;
          childentrancefee?: number | null;
          seniorentrancefee?: number | null;
          entrancefeenotes?: string | null;
          generalinformation?: string | null;
          updatedat?: string;
        };
        Update: {
          id?: string;
          beachid?: string;
          entrancefee?: number | null;
          childentrancefee?: number | null;
          seniorentrancefee?: number | null;
          entrancefeenotes?: string | null;
          generalinformation?: string | null;
          updatedat?: string;
        };
        Relationships: [{
          foreignKeyName: 'beach_general_information_beach_id_fkey';
          columns: ['beachid'];
          isOneToOne: true;
          referencedRelation: 'beaches';
          referencedColumns: ['id'];
        }];
      };
      openinghours: {
        Row: {
          id: string;
          beachid: string;
          dayofweek: number;
          isopen: boolean;
          openingtime: string | null;
          closingtime: string | null;
        };
        Insert: {
          id?: string;
          beachid: string;
          dayofweek: number;
          isopen?: boolean;
          openingtime?: string | null;
          closingtime?: string | null;
        };
        Update: {
          id?: string;
          beachid?: string;
          dayofweek?: number;
          isopen?: boolean;
          openingtime?: string | null;
          closingtime?: string | null;
        };
        Relationships: [{
          foreignKeyName: 'beach_opening_hours_beach_id_fkey';
          columns: ['beachid'];
          isOneToOne: false;
          referencedRelation: 'beaches';
          referencedColumns: ['id'];
        }];
      };
      cottages: {
        Row: {
          id: string;
          beachid: string;
          name: string;
          description: string | null;
          price: number | null;
          priceunit: string;
          capacity: number | null;
          capacitylabel: string | null;
          images: string[];
          isavailable: boolean;
          displayorder: number;
          createdat: string;
          updatedat: string;
        };
        Insert: {
          id?: string;
          beachid: string;
          name: string;
          description?: string | null;
          price?: number | null;
          priceunit?: string;
          capacity?: number | null;
          capacitylabel?: string | null;
          images?: string[];
          isavailable?: boolean;
          displayorder?: number;
          createdat?: string;
          updatedat?: string;
        };
        Update: {
          id?: string;
          beachid?: string;
          name?: string;
          description?: string | null;
          price?: number | null;
          priceunit?: string;
          capacity?: number | null;
          capacitylabel?: string | null;
          images?: string[];
          isavailable?: boolean;
          displayorder?: number;
          createdat?: string;
          updatedat?: string;
        };
        Relationships: [{
          foreignKeyName: 'beach_cottages_beach_id_fkey';
          columns: ['beachid'];
          isOneToOne: false;
          referencedRelation: 'beaches';
          referencedColumns: ['id'];
        }];
      };
      cottagephotos: {
        Row: {
          id: string;
          cottageid: string;
          imageurl: string;
          storagepath: string;
          sortorder: number;
          createdat: string;
        };
        Insert: {
          id?: string;
          cottageid: string;
          imageurl: string;
          storagepath: string;
          sortorder?: number;
          createdat?: string;
        };
        Update: {
          id?: string;
          cottageid?: string;
          imageurl?: string;
          storagepath?: string;
          sortorder?: number;
          createdat?: string;
        };
        Relationships: [{
          foreignKeyName: 'beach_cottage_photos_cottage_id_fkey';
          columns: ['cottageid'];
          isOneToOne: false;
          referencedRelation: 'cottages';
          referencedColumns: ['id'];
        }];
      };
      facilities: {
        Row: {
          id: string;
          beachid: string;
          name: string;
          description: string | null;
          price: number | null;
          priceunit: string | null;
          pricelabel: string | null;
          category: string | null;
          rates: Json;
          images: string[];
          isavailable: boolean;
          displayorder: number;
          createdat: string;
          updatedat: string;
        };
        Insert: {
          id?: string;
          beachid: string;
          name: string;
          description?: string | null;
          price?: number | null;
          priceunit?: string | null;
          pricelabel?: string | null;
          category?: string | null;
          rates?: Json;
          images?: string[];
          isavailable?: boolean;
          displayorder?: number;
          createdat?: string;
          updatedat?: string;
        };
        Update: {
          id?: string;
          beachid?: string;
          name?: string;
          description?: string | null;
          price?: number | null;
          priceunit?: string | null;
          pricelabel?: string | null;
          category?: string | null;
          rates?: Json;
          images?: string[];
          isavailable?: boolean;
          displayorder?: number;
          createdat?: string;
          updatedat?: string;
        };
        Relationships: [{
          foreignKeyName: 'beach_facilities_beach_id_fkey';
          columns: ['beachid'];
          isOneToOne: false;
          referencedRelation: 'beaches';
          referencedColumns: ['id'];
        }];
      };
      facilityphotos: {
        Row: {
          id: string;
          facilityid: string;
          imageurl: string;
          storagepath: string;
          sortorder: number;
          createdat: string;
        };
        Insert: {
          id?: string;
          facilityid: string;
          imageurl: string;
          storagepath: string;
          sortorder?: number;
          createdat?: string;
        };
        Update: {
          id?: string;
          facilityid?: string;
          imageurl?: string;
          storagepath?: string;
          sortorder?: number;
          createdat?: string;
        };
        Relationships: [{
          foreignKeyName: 'beach_facility_photos_facility_id_fkey';
          columns: ['facilityid'];
          isOneToOne: false;
          referencedRelation: 'facilities';
          referencedColumns: ['id'];
        }];
      };
      beachposts: {
        Row: {
          id: string;
          beachid: string;
          authorid: string | null;
          caption: string | null;
          imagepath: string | null;
          status: 'draft' | 'published' | 'hidden';
          createdat: string;
          updatedat: string;
        };
        Insert: {
          id?: string;
          beachid: string;
          authorid?: string | null;
          caption?: string | null;
          imagepath?: string | null;
          status?: 'draft' | 'published' | 'hidden';
          createdat?: string;
          updatedat?: string;
        };
        Update: {
          id?: string;
          beachid?: string;
          authorid?: string | null;
          caption?: string | null;
          imagepath?: string | null;
          status?: 'draft' | 'published' | 'hidden';
          createdat?: string;
          updatedat?: string;
        };
        Relationships: [{
          foreignKeyName: 'beach_posts_beach_id_fkey';
          columns: ['beachid'];
          isOneToOne: false;
          referencedRelation: 'beaches';
          referencedColumns: ['id'];
        }];
      };
      caretakerinvitations: {
        Row: {
          id: string;
          beachid: string;
          invitedby: string;
          inviteduserid: string | null;
          fullname: string;
          email: string;
          roletitle: string;
          permissions: Json;
          status: 'invited' | 'accepted' | 'revoked';
          createdat: string;
          updatedat: string;
        };
        Insert: {
          id?: string;
          beachid: string;
          invitedby: string;
          inviteduserid?: string | null;
          fullname: string;
          email: string;
          roletitle: string;
          permissions?: Json;
          status?: 'invited' | 'accepted' | 'revoked';
          createdat?: string;
          updatedat?: string;
        };
        Update: {
          id?: string;
          beachid?: string;
          invitedby?: string;
          inviteduserid?: string | null;
          fullname?: string;
          email?: string;
          roletitle?: string;
          permissions?: Json;
          status?: 'invited' | 'accepted' | 'revoked';
          createdat?: string;
          updatedat?: string;
        };
        Relationships: [{
          foreignKeyName: 'beach_caretaker_invitations_beach_id_fkey';
          columns: ['beachid'];
          isOneToOne: false;
          referencedRelation: 'beaches';
          referencedColumns: ['id'];
        }];
      };
      coordinaterequests: {
        Row: {
          id: string;
          beachid: string;
          ownerid: string | null;
          requestedlatitude: number;
          requestedlongitude: number;
          requestedlocation: string;
          requesternote: string | null;
          status: 'pending' | 'approved' | 'rejected';
          rejectionreason: string | null;
          reviewedby: string | null;
          reviewedat: string | null;
          createdat: string;
          updatedat: string;
        };
        Insert: {
          id?: string;
          beachid: string;
          ownerid?: string | null;
          requestedlatitude: number;
          requestedlongitude: number;
          requestedlocation: string;
          requesternote?: string | null;
          status?: 'pending' | 'approved' | 'rejected';
          rejectionreason?: string | null;
          reviewedby?: string | null;
          reviewedat?: string | null;
          createdat?: string;
          updatedat?: string;
        };
        Update: {
          id?: string;
          beachid?: string;
          ownerid?: string | null;
          requestedlatitude?: number;
          requestedlongitude?: number;
          requestedlocation?: string;
          requesternote?: string | null;
          status?: 'pending' | 'approved' | 'rejected';
          rejectionreason?: string | null;
          reviewedby?: string | null;
          reviewedat?: string | null;
          createdat?: string;
          updatedat?: string;
        };
        Relationships: [{
          foreignKeyName: 'beach_coordinate_requests_beach_id_fkey';
          columns: ['beachid'];
          isOneToOne: false;
          referencedRelation: 'beaches';
          referencedColumns: ['id'];
        }];
      };
      beachreviews: {
        Row: {
          id: string;
          beachid: string;
          userid: string;
          rating: number;
          comment: string;
          photos: string[];
          createdat: string;
          updatedat: string;
        };
        Insert: {
          id?: string;
          beachid: string;
          userid: string;
          rating: number;
          comment: string;
          photos?: string[];
          createdat?: string;
          updatedat?: string;
        };
        Update: {
          id?: string;
          beachid?: string;
          userid?: string;
          rating?: number;
          comment?: string;
          photos?: string[];
          createdat?: string;
          updatedat?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'beach_reviews_beach_id_fkey';
            columns: ['beachid'];
            isOneToOne: false;
            referencedRelation: 'beaches';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'beach_reviews_user_id_fkey';
            columns: ['userid'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          }
        ];
      };
      reviewreports: {
        Row: {
          id: string;
          reviewid: string;
          beachid: string;
          reporteruserid: string;
          reason: string;
          status: 'pending' | 'removed' | 'dismissed';
          createdat: string;
          reviewedat: string | null;
        };
        Insert: {
          id?: string;
          reviewid: string;
          beachid: string;
          reporteruserid: string;
          reason: string;
          status?: 'pending' | 'removed' | 'dismissed';
          createdat?: string;
          reviewedat?: string | null;
        };
        Update: {
          id?: string;
          reviewid?: string;
          beachid?: string;
          reporteruserid?: string;
          reason?: string;
          status?: 'pending' | 'removed' | 'dismissed';
          createdat?: string;
          reviewedat?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'beach_review_reports_beach_id_fkey';
            columns: ['beachid'];
            isOneToOne: false;
            referencedRelation: 'beaches';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'beach_review_reports_reporter_user_id_fkey';
            columns: ['reporteruserid'];
            isOneToOne: false;
            referencedRelation: 'profiles';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'beach_review_reports_review_id_fkey';
            columns: ['reviewid'];
            isOneToOne: false;
            referencedRelation: 'beachreviews';
            referencedColumns: ['id'];
          }
        ];
      };
      visitorevents: {
        Row: {
          id: string;
          sessionid: string;
          pagekey: string;
          eventtype: 'platform_visit' | 'beach_profile_view';
          beachid: string | null;
          visitdate: string;
          createdat: string;
        };
        Insert: {
          id?: string;
          sessionid: string;
          pagekey: string;
          eventtype: 'platform_visit' | 'beach_profile_view';
          beachid?: string | null;
          visitdate?: string;
          createdat?: string;
        };
        Update: {
          id?: string;
          sessionid?: string;
          pagekey?: string;
          eventtype?: 'platform_visit' | 'beach_profile_view';
          beachid?: string | null;
          visitdate?: string;
          createdat?: string;
        };
        Relationships: [{
          foreignKeyName: 'visitor_events_beach_id_fkey';
          columns: ['beachid'];
          isOneToOne: false;
          referencedRelation: 'beaches';
          referencedColumns: ['id'];
        }];
      };
      chatmessages: {
        Row: {
          id: string;
          userid: string;
          role: 'user' | 'assistant';
          content: string;
          createdat: string;
        };
        Insert: {
          id?: string;
          userid: string;
          role: 'user' | 'assistant';
          content: string;
          createdat?: string;
        };
        Update: {
          id?: string;
          userid?: string;
          role?: 'user' | 'assistant';
          content?: string;
          createdat?: string;
        };
        Relationships: [{
          foreignKeyName: 'ai_chat_messages_user_id_fkey';
          columns: ['userid'];
          isOneToOne: false;
          referencedRelation: 'profiles';
          referencedColumns: ['id'];
        }];
      };
      emailnotifications: {
        Row: {
          id: string;
          recipientemail: string;
          recipientname: string | null;
          notificationtype: 'application_received' | 'application_approved' | 'application_rejected';
          applicationid: string | null;
          subject: string;
          message: string;
          status: 'pending' | 'sent' | 'failed';
          sentat: string | null;
          errormessage: string | null;
        };
        Insert: {
          id?: string;
          recipientemail: string;
          recipientname?: string | null;
          notificationtype: 'application_received' | 'application_approved' | 'application_rejected';
          applicationid?: string | null;
          subject: string;
          message: string;
          status?: 'pending' | 'sent' | 'failed';
          sentat?: string | null;
          errormessage?: string | null;
        };
        Update: {
          id?: string;
          recipientemail?: string;
          recipientname?: string | null;
          notificationtype?: 'application_received' | 'application_approved' | 'application_rejected';
          applicationid?: string | null;
          subject?: string;
          message?: string;
          status?: 'pending' | 'sent' | 'failed';
          sentat?: string | null;
          errormessage?: string | null;
        };
        Relationships: [{
          foreignKeyName: 'email_notifications_application_id_fkey';
          columns: ['applicationid'];
          isOneToOne: false;
          referencedRelation: 'ownerapplications';
          referencedColumns: ['id'];
        }];
      };
      beachactivities: {
        Row: {
          id: string;
          beachid: string;
          name: string;
          description: string | null;
          price: number | null;
          priceunit: string | null;
          images: string[];
          isavailable: boolean;
          displayorder: number;
          createdat: string;
          updatedat: string;
        };
        Insert: {
          id?: string;
          beachid: string;
          name: string;
          description?: string | null;
          price?: number | null;
          priceunit?: string | null;
          images?: string[];
          isavailable?: boolean;
          displayorder?: number;
          createdat?: string;
          updatedat?: string;
        };
        Update: {
          id?: string;
          beachid?: string;
          name?: string;
          description?: string | null;
          price?: number | null;
          priceunit?: string | null;
          images?: string[];
          isavailable?: boolean;
          displayorder?: number;
          createdat?: string;
          updatedat?: string;
        };
        Relationships: [{
          foreignKeyName: 'beach_activities_beach_id_fkey';
          columns: ['beachid'];
          isOneToOne: false;
          referencedRelation: 'beaches';
          referencedColumns: ['id'];
        }];
      };
      equipment: {
        Row: {
          id: string;
          beachid: string;
          name: string;
          description: string | null;
          rentalprice: number | null;
          priceunit: string | null;
          quantity: number | null;
          images: string[];
          isavailable: boolean;
          displayorder: number;
          createdat: string;
          updatedat: string;
        };
        Insert: {
          id?: string;
          beachid: string;
          name: string;
          description?: string | null;
          rentalprice?: number | null;
          priceunit?: string | null;
          quantity?: number | null;
          images?: string[];
          isavailable?: boolean;
          displayorder?: number;
          createdat?: string;
          updatedat?: string;
        };
        Update: {
          id?: string;
          beachid?: string;
          name?: string;
          description?: string | null;
          rentalprice?: number | null;
          priceunit?: string | null;
          quantity?: number | null;
          images?: string[];
          isavailable?: boolean;
          displayorder?: number;
          createdat?: string;
          updatedat?: string;
        };
        Relationships: [{
          foreignKeyName: 'beach_equipment_beach_id_fkey';
          columns: ['beachid'];
          isOneToOne: false;
          referencedRelation: 'beaches';
          referencedColumns: ['id'];
        }];
      };
      rooms: {
        Row: {
          id: string;
          beachid: string;
          name: string;
          description: string | null;
          price: number | null;
          priceunit: string;
          capacity: number | null;
          images: string[];
          isavailable: boolean;
          displayorder: number;
          createdat: string;
          updatedat: string;
        };
        Insert: {
          id?: string;
          beachid: string;
          name: string;
          description?: string | null;
          price?: number | null;
          priceunit?: string;
          capacity?: number | null;
          images?: string[];
          isavailable?: boolean;
          displayorder?: number;
          createdat?: string;
          updatedat?: string;
        };
        Update: {
          id?: string;
          beachid?: string;
          name?: string;
          description?: string | null;
          price?: number | null;
          priceunit?: string;
          capacity?: number | null;
          images?: string[];
          isavailable?: boolean;
          displayorder?: number;
          createdat?: string;
          updatedat?: string;
        };
        Relationships: [{
          foreignKeyName: 'beach_rooms_beach_id_fkey';
          columns: ['beachid'];
          isOneToOne: false;
          referencedRelation: 'beaches';
          referencedColumns: ['id'];
        }];
      };
      fooddrinks: {
        Row: {
          id: string;
          beachid: string;
          name: string;
          description: string | null;
          category: string | null;
          price: number | null;
          images: string[];
          isavailable: boolean;
          displayorder: number;
          createdat: string;
          updatedat: string;
        };
        Insert: {
          id?: string;
          beachid: string;
          name: string;
          description?: string | null;
          category?: string | null;
          price?: number | null;
          images?: string[];
          isavailable?: boolean;
          displayorder?: number;
          createdat?: string;
          updatedat?: string;
        };
        Update: {
          id?: string;
          beachid?: string;
          name?: string;
          description?: string | null;
          category?: string | null;
          price?: number | null;
          images?: string[];
          isavailable?: boolean;
          displayorder?: number;
          createdat?: string;
          updatedat?: string;
        };
        Relationships: [{
          foreignKeyName: 'beach_food_drinks_beach_id_fkey';
          columns: ['beachid'];
          isOneToOne: false;
          referencedRelation: 'beaches';
          referencedColumns: ['id'];
        }];
      };
      beachrules: {
        Row: {
          id: string;
          beachid: string;
          rule_type: 'do' | 'dont';
          title: string;
          description: string | null;
          displayorder: number;
          createdat: string;
        };
        Insert: {
          id?: string;
          beachid: string;
          rule_type: 'do' | 'dont';
          title: string;
          description?: string | null;
          displayorder?: number;
          createdat?: string;
        };
        Update: {
          id?: string;
          beachid?: string;
          rule_type?: 'do' | 'dont';
          title?: string;
          description?: string | null;
          displayorder?: number;
          createdat?: string;
        };
        Relationships: [{
          foreignKeyName: 'beach_rules_beach_id_fkey';
          columns: ['beachid'];
          isOneToOne: false;
          referencedRelation: 'beaches';
          referencedColumns: ['id'];
        }];
      };
      adminresetlimit: {
        Row: {
          id: string;
          adminid: string;
          targetuserid: string;
          createdat: string;
        };
        Insert: {
          id?: string;
          adminid: string;
          targetuserid: string;
          createdat?: string;
        };
        Update: {
          id?: string;
          adminid?: string;
          targetuserid?: string;
          createdat?: string;
        };
        Relationships: [];
      };
      adminstatuslimit: {
        Row: {
          id: string;
          adminid: string;
          createdat: string;
        };
        Insert: {
          id?: string;
          adminid: string;
          createdat?: string;
        };
        Update: {
          id?: string;
          adminid?: string;
          createdat?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      beach_published_tours: {
        Row: {
          beachid: string;
          requestedtoururl: string;
          approvedat: string | null;
          statusupdatedat: string;
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
export type OwnerApplication = Database['public']['Tables']['ownerapplications']['Row'];
export type BeachExternalLink = Database['public']['Tables']['externallinks']['Row'];
export type BeachWeatherSnapshot = Database['public']['Tables']['weathersnapshots']['Row'];
export type BeachGeneralInformation = Database['public']['Tables']['beachinfo']['Row'];
export type BeachCottage = Database['public']['Tables']['cottages']['Row'];
export type BeachCottagePhoto = Database['public']['Tables']['cottagephotos']['Row'];
export type BeachFacility = Database['public']['Tables']['facilities']['Row'];
export type BeachFacilityPhoto = Database['public']['Tables']['facilityphotos']['Row'];
export type BeachPost = Database['public']['Tables']['beachposts']['Row'];
export type BeachCaretakerInvitation = Database['public']['Tables']['caretakerinvitations']['Row'];
export type BeachCoordinateRequest = Database['public']['Tables']['coordinaterequests']['Row'];
export type BeachReview = Database['public']['Tables']['beachreviews']['Row'];
export type BeachReviewReport = Database['public']['Tables']['reviewreports']['Row'];
export type VisitorEvent = Database['public']['Tables']['visitorevents']['Row'];
export type AiChatMessage = Database['public']['Tables']['chatmessages']['Row'];

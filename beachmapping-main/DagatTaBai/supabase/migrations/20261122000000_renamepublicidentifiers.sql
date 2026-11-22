-- Rename public schema tables/columns to underscore-free names and update
-- routine bodies that still referenced the old identifiers.
-- Idempotent: safe to run on databases where the renames were already applied
-- manually, and on fresh environments replaying the migration history.

BEGIN;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='admin_audit_log') THEN
    ALTER TABLE public."admin_audit_log" RENAME TO "adminlog";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='admin_reset_rate_limits') THEN
    ALTER TABLE public."admin_reset_rate_limits" RENAME TO "adminresetlimit";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='admin_status_change_rate_limits') THEN
    ALTER TABLE public."admin_status_change_rate_limits" RENAME TO "adminstatuslimit";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='ai_chat_messages') THEN
    ALTER TABLE public."ai_chat_messages" RENAME TO "chatmessages";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='application_status_history') THEN
    ALTER TABLE public."application_status_history" RENAME TO "appstatushistory";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='beach_activities') THEN
    ALTER TABLE public."beach_activities" RENAME TO "beachactivities";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='beach_caretaker_invitations') THEN
    ALTER TABLE public."beach_caretaker_invitations" RENAME TO "caretakerinvitations";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='beach_coordinate_requests') THEN
    ALTER TABLE public."beach_coordinate_requests" RENAME TO "coordinaterequests";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='beach_cottage_photos') THEN
    ALTER TABLE public."beach_cottage_photos" RENAME TO "cottagephotos";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='beach_cottages') THEN
    ALTER TABLE public."beach_cottages" RENAME TO "cottages";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='beach_equipment') THEN
    ALTER TABLE public."beach_equipment" RENAME TO "equipment";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='beach_external_links') THEN
    ALTER TABLE public."beach_external_links" RENAME TO "externallinks";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='beach_facilities') THEN
    ALTER TABLE public."beach_facilities" RENAME TO "facilities";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='beach_facility_photos') THEN
    ALTER TABLE public."beach_facility_photos" RENAME TO "facilityphotos";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='beach_food_drinks') THEN
    ALTER TABLE public."beach_food_drinks" RENAME TO "fooddrinks";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='beach_general_information') THEN
    ALTER TABLE public."beach_general_information" RENAME TO "beachinfo";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='beach_opening_hours') THEN
    ALTER TABLE public."beach_opening_hours" RENAME TO "openinghours";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='beach_posts') THEN
    ALTER TABLE public."beach_posts" RENAME TO "beachposts";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='beach_review_reports') THEN
    ALTER TABLE public."beach_review_reports" RENAME TO "reviewreports";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='beach_reviews') THEN
    ALTER TABLE public."beach_reviews" RENAME TO "beachreviews";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='beach_rooms') THEN
    ALTER TABLE public."beach_rooms" RENAME TO "rooms";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='beach_rules') THEN
    ALTER TABLE public."beach_rules" RENAME TO "beachrules";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='beach_tour_requests') THEN
    ALTER TABLE public."beach_tour_requests" RENAME TO "tourrequests";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='beach_tour_status_history') THEN
    ALTER TABLE public."beach_tour_status_history" RENAME TO "tourstatushistory";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='beach_weather_snapshots') THEN
    ALTER TABLE public."beach_weather_snapshots" RENAME TO "weathersnapshots";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='email_notifications') THEN
    ALTER TABLE public."email_notifications" RENAME TO "emailnotifications";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='gmail_sender_connections') THEN
    ALTER TABLE public."gmail_sender_connections" RENAME TO "gmailconnections";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='login_devices') THEN
    ALTER TABLE public."login_devices" RENAME TO "logindevices";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='owner_applications') THEN
    ALTER TABLE public."owner_applications" RENAME TO "ownerapplications";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='owner_liveness_sessions') THEN
    ALTER TABLE public."owner_liveness_sessions" RENAME TO "livenesssessions";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='platform_reviews') THEN
    ALTER TABLE public."platform_reviews" RENAME TO "platformreviews";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='system_audit_logs') THEN
    ALTER TABLE public."system_audit_logs" RENAME TO "systemlogs";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='user_notifications') THEN
    ALTER TABLE public."user_notifications" RENAME TO "usernotifications";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema='public' AND table_name='visitor_events') THEN
    ALTER TABLE public."visitor_events" RENAME TO "visitorevents";
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='adminlog' AND column_name='admin_id'
  ) THEN
    ALTER TABLE public."adminlog" RENAME COLUMN "admin_id" TO "adminid";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='adminlog' AND column_name='created_at'
  ) THEN
    ALTER TABLE public."adminlog" RENAME COLUMN "created_at" TO "createdat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='adminlog' AND column_name='from_status'
  ) THEN
    ALTER TABLE public."adminlog" RENAME COLUMN "from_status" TO "fromstatus";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='adminlog' AND column_name='reason_type'
  ) THEN
    ALTER TABLE public."adminlog" RENAME COLUMN "reason_type" TO "reasontype";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='adminlog' AND column_name='target_user_id'
  ) THEN
    ALTER TABLE public."adminlog" RENAME COLUMN "target_user_id" TO "targetuserid";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='adminlog' AND column_name='to_status'
  ) THEN
    ALTER TABLE public."adminlog" RENAME COLUMN "to_status" TO "tostatus";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='adminresetlimit' AND column_name='admin_id'
  ) THEN
    ALTER TABLE public."adminresetlimit" RENAME COLUMN "admin_id" TO "adminid";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='adminresetlimit' AND column_name='created_at'
  ) THEN
    ALTER TABLE public."adminresetlimit" RENAME COLUMN "created_at" TO "createdat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='adminresetlimit' AND column_name='target_user_id'
  ) THEN
    ALTER TABLE public."adminresetlimit" RENAME COLUMN "target_user_id" TO "targetuserid";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='adminstatuslimit' AND column_name='admin_id'
  ) THEN
    ALTER TABLE public."adminstatuslimit" RENAME COLUMN "admin_id" TO "adminid";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='adminstatuslimit' AND column_name='created_at'
  ) THEN
    ALTER TABLE public."adminstatuslimit" RENAME COLUMN "created_at" TO "createdat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='chatmessages' AND column_name='created_at'
  ) THEN
    ALTER TABLE public."chatmessages" RENAME COLUMN "created_at" TO "createdat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='chatmessages' AND column_name='user_id'
  ) THEN
    ALTER TABLE public."chatmessages" RENAME COLUMN "user_id" TO "userid";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='appstatushistory' AND column_name='application_id'
  ) THEN
    ALTER TABLE public."appstatushistory" RENAME COLUMN "application_id" TO "applicationid";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='appstatushistory' AND column_name='changed_by'
  ) THEN
    ALTER TABLE public."appstatushistory" RENAME COLUMN "changed_by" TO "changedby";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='appstatushistory' AND column_name='created_at'
  ) THEN
    ALTER TABLE public."appstatushistory" RENAME COLUMN "created_at" TO "createdat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='appstatushistory' AND column_name='from_status'
  ) THEN
    ALTER TABLE public."appstatushistory" RENAME COLUMN "from_status" TO "fromstatus";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='appstatushistory' AND column_name='to_status'
  ) THEN
    ALTER TABLE public."appstatushistory" RENAME COLUMN "to_status" TO "tostatus";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='beachactivities' AND column_name='beach_id'
  ) THEN
    ALTER TABLE public."beachactivities" RENAME COLUMN "beach_id" TO "beachid";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='beachactivities' AND column_name='created_at'
  ) THEN
    ALTER TABLE public."beachactivities" RENAME COLUMN "created_at" TO "createdat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='beachactivities' AND column_name='display_order'
  ) THEN
    ALTER TABLE public."beachactivities" RENAME COLUMN "display_order" TO "displayorder";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='beachactivities' AND column_name='is_available'
  ) THEN
    ALTER TABLE public."beachactivities" RENAME COLUMN "is_available" TO "isavailable";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='beachactivities' AND column_name='price_unit'
  ) THEN
    ALTER TABLE public."beachactivities" RENAME COLUMN "price_unit" TO "priceunit";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='beachactivities' AND column_name='updated_at'
  ) THEN
    ALTER TABLE public."beachactivities" RENAME COLUMN "updated_at" TO "updatedat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='caretakerinvitations' AND column_name='beach_id'
  ) THEN
    ALTER TABLE public."caretakerinvitations" RENAME COLUMN "beach_id" TO "beachid";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='caretakerinvitations' AND column_name='created_at'
  ) THEN
    ALTER TABLE public."caretakerinvitations" RENAME COLUMN "created_at" TO "createdat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='caretakerinvitations' AND column_name='full_name'
  ) THEN
    ALTER TABLE public."caretakerinvitations" RENAME COLUMN "full_name" TO "fullname";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='caretakerinvitations' AND column_name='invited_by'
  ) THEN
    ALTER TABLE public."caretakerinvitations" RENAME COLUMN "invited_by" TO "invitedby";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='caretakerinvitations' AND column_name='invited_user_id'
  ) THEN
    ALTER TABLE public."caretakerinvitations" RENAME COLUMN "invited_user_id" TO "inviteduserid";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='caretakerinvitations' AND column_name='role_title'
  ) THEN
    ALTER TABLE public."caretakerinvitations" RENAME COLUMN "role_title" TO "roletitle";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='caretakerinvitations' AND column_name='updated_at'
  ) THEN
    ALTER TABLE public."caretakerinvitations" RENAME COLUMN "updated_at" TO "updatedat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='coordinaterequests' AND column_name='beach_id'
  ) THEN
    ALTER TABLE public."coordinaterequests" RENAME COLUMN "beach_id" TO "beachid";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='coordinaterequests' AND column_name='created_at'
  ) THEN
    ALTER TABLE public."coordinaterequests" RENAME COLUMN "created_at" TO "createdat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='coordinaterequests' AND column_name='owner_id'
  ) THEN
    ALTER TABLE public."coordinaterequests" RENAME COLUMN "owner_id" TO "ownerid";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='coordinaterequests' AND column_name='rejection_reason'
  ) THEN
    ALTER TABLE public."coordinaterequests" RENAME COLUMN "rejection_reason" TO "rejectionreason";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='coordinaterequests' AND column_name='requested_latitude'
  ) THEN
    ALTER TABLE public."coordinaterequests" RENAME COLUMN "requested_latitude" TO "requestedlatitude";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='coordinaterequests' AND column_name='requested_location'
  ) THEN
    ALTER TABLE public."coordinaterequests" RENAME COLUMN "requested_location" TO "requestedlocation";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='coordinaterequests' AND column_name='requested_longitude'
  ) THEN
    ALTER TABLE public."coordinaterequests" RENAME COLUMN "requested_longitude" TO "requestedlongitude";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='coordinaterequests' AND column_name='requester_note'
  ) THEN
    ALTER TABLE public."coordinaterequests" RENAME COLUMN "requester_note" TO "requesternote";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='coordinaterequests' AND column_name='reviewed_at'
  ) THEN
    ALTER TABLE public."coordinaterequests" RENAME COLUMN "reviewed_at" TO "reviewedat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='coordinaterequests' AND column_name='reviewed_by'
  ) THEN
    ALTER TABLE public."coordinaterequests" RENAME COLUMN "reviewed_by" TO "reviewedby";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='coordinaterequests' AND column_name='updated_at'
  ) THEN
    ALTER TABLE public."coordinaterequests" RENAME COLUMN "updated_at" TO "updatedat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='cottagephotos' AND column_name='cottage_id'
  ) THEN
    ALTER TABLE public."cottagephotos" RENAME COLUMN "cottage_id" TO "cottageid";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='cottagephotos' AND column_name='created_at'
  ) THEN
    ALTER TABLE public."cottagephotos" RENAME COLUMN "created_at" TO "createdat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='cottagephotos' AND column_name='image_url'
  ) THEN
    ALTER TABLE public."cottagephotos" RENAME COLUMN "image_url" TO "imageurl";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='cottagephotos' AND column_name='sort_order'
  ) THEN
    ALTER TABLE public."cottagephotos" RENAME COLUMN "sort_order" TO "sortorder";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='cottagephotos' AND column_name='storage_path'
  ) THEN
    ALTER TABLE public."cottagephotos" RENAME COLUMN "storage_path" TO "storagepath";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='cottages' AND column_name='beach_id'
  ) THEN
    ALTER TABLE public."cottages" RENAME COLUMN "beach_id" TO "beachid";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='cottages' AND column_name='capacity_label'
  ) THEN
    ALTER TABLE public."cottages" RENAME COLUMN "capacity_label" TO "capacitylabel";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='cottages' AND column_name='created_at'
  ) THEN
    ALTER TABLE public."cottages" RENAME COLUMN "created_at" TO "createdat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='cottages' AND column_name='display_order'
  ) THEN
    ALTER TABLE public."cottages" RENAME COLUMN "display_order" TO "displayorder";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='cottages' AND column_name='is_available'
  ) THEN
    ALTER TABLE public."cottages" RENAME COLUMN "is_available" TO "isavailable";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='cottages' AND column_name='price_unit'
  ) THEN
    ALTER TABLE public."cottages" RENAME COLUMN "price_unit" TO "priceunit";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='cottages' AND column_name='updated_at'
  ) THEN
    ALTER TABLE public."cottages" RENAME COLUMN "updated_at" TO "updatedat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='equipment' AND column_name='beach_id'
  ) THEN
    ALTER TABLE public."equipment" RENAME COLUMN "beach_id" TO "beachid";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='equipment' AND column_name='created_at'
  ) THEN
    ALTER TABLE public."equipment" RENAME COLUMN "created_at" TO "createdat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='equipment' AND column_name='display_order'
  ) THEN
    ALTER TABLE public."equipment" RENAME COLUMN "display_order" TO "displayorder";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='equipment' AND column_name='is_available'
  ) THEN
    ALTER TABLE public."equipment" RENAME COLUMN "is_available" TO "isavailable";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='equipment' AND column_name='price_unit'
  ) THEN
    ALTER TABLE public."equipment" RENAME COLUMN "price_unit" TO "priceunit";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='equipment' AND column_name='rental_price'
  ) THEN
    ALTER TABLE public."equipment" RENAME COLUMN "rental_price" TO "rentalprice";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='equipment' AND column_name='updated_at'
  ) THEN
    ALTER TABLE public."equipment" RENAME COLUMN "updated_at" TO "updatedat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='externallinks' AND column_name='beach_id'
  ) THEN
    ALTER TABLE public."externallinks" RENAME COLUMN "beach_id" TO "beachid";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='externallinks' AND column_name='created_at'
  ) THEN
    ALTER TABLE public."externallinks" RENAME COLUMN "created_at" TO "createdat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='facilities' AND column_name='beach_id'
  ) THEN
    ALTER TABLE public."facilities" RENAME COLUMN "beach_id" TO "beachid";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='facilities' AND column_name='created_at'
  ) THEN
    ALTER TABLE public."facilities" RENAME COLUMN "created_at" TO "createdat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='facilities' AND column_name='display_order'
  ) THEN
    ALTER TABLE public."facilities" RENAME COLUMN "display_order" TO "displayorder";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='facilities' AND column_name='is_available'
  ) THEN
    ALTER TABLE public."facilities" RENAME COLUMN "is_available" TO "isavailable";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='facilities' AND column_name='price_label'
  ) THEN
    ALTER TABLE public."facilities" RENAME COLUMN "price_label" TO "pricelabel";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='facilities' AND column_name='price_unit'
  ) THEN
    ALTER TABLE public."facilities" RENAME COLUMN "price_unit" TO "priceunit";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='facilities' AND column_name='updated_at'
  ) THEN
    ALTER TABLE public."facilities" RENAME COLUMN "updated_at" TO "updatedat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='facilityphotos' AND column_name='created_at'
  ) THEN
    ALTER TABLE public."facilityphotos" RENAME COLUMN "created_at" TO "createdat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='facilityphotos' AND column_name='facility_id'
  ) THEN
    ALTER TABLE public."facilityphotos" RENAME COLUMN "facility_id" TO "facilityid";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='facilityphotos' AND column_name='image_url'
  ) THEN
    ALTER TABLE public."facilityphotos" RENAME COLUMN "image_url" TO "imageurl";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='facilityphotos' AND column_name='sort_order'
  ) THEN
    ALTER TABLE public."facilityphotos" RENAME COLUMN "sort_order" TO "sortorder";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='facilityphotos' AND column_name='storage_path'
  ) THEN
    ALTER TABLE public."facilityphotos" RENAME COLUMN "storage_path" TO "storagepath";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='fooddrinks' AND column_name='beach_id'
  ) THEN
    ALTER TABLE public."fooddrinks" RENAME COLUMN "beach_id" TO "beachid";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='fooddrinks' AND column_name='created_at'
  ) THEN
    ALTER TABLE public."fooddrinks" RENAME COLUMN "created_at" TO "createdat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='fooddrinks' AND column_name='display_order'
  ) THEN
    ALTER TABLE public."fooddrinks" RENAME COLUMN "display_order" TO "displayorder";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='fooddrinks' AND column_name='is_available'
  ) THEN
    ALTER TABLE public."fooddrinks" RENAME COLUMN "is_available" TO "isavailable";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='fooddrinks' AND column_name='updated_at'
  ) THEN
    ALTER TABLE public."fooddrinks" RENAME COLUMN "updated_at" TO "updatedat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='beachinfo' AND column_name='beach_id'
  ) THEN
    ALTER TABLE public."beachinfo" RENAME COLUMN "beach_id" TO "beachid";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='beachinfo' AND column_name='child_entrance_fee'
  ) THEN
    ALTER TABLE public."beachinfo" RENAME COLUMN "child_entrance_fee" TO "childentrancefee";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='beachinfo' AND column_name='entrance_fee'
  ) THEN
    ALTER TABLE public."beachinfo" RENAME COLUMN "entrance_fee" TO "entrancefee";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='beachinfo' AND column_name='entrance_fee_notes'
  ) THEN
    ALTER TABLE public."beachinfo" RENAME COLUMN "entrance_fee_notes" TO "entrancefeenotes";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='beachinfo' AND column_name='general_information'
  ) THEN
    ALTER TABLE public."beachinfo" RENAME COLUMN "general_information" TO "generalinformation";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='beachinfo' AND column_name='senior_entrance_fee'
  ) THEN
    ALTER TABLE public."beachinfo" RENAME COLUMN "senior_entrance_fee" TO "seniorentrancefee";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='beachinfo' AND column_name='updated_at'
  ) THEN
    ALTER TABLE public."beachinfo" RENAME COLUMN "updated_at" TO "updatedat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='openinghours' AND column_name='beach_id'
  ) THEN
    ALTER TABLE public."openinghours" RENAME COLUMN "beach_id" TO "beachid";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='openinghours' AND column_name='closing_time'
  ) THEN
    ALTER TABLE public."openinghours" RENAME COLUMN "closing_time" TO "closingtime";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='openinghours' AND column_name='day_of_week'
  ) THEN
    ALTER TABLE public."openinghours" RENAME COLUMN "day_of_week" TO "dayofweek";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='openinghours' AND column_name='is_open'
  ) THEN
    ALTER TABLE public."openinghours" RENAME COLUMN "is_open" TO "isopen";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='openinghours' AND column_name='opening_time'
  ) THEN
    ALTER TABLE public."openinghours" RENAME COLUMN "opening_time" TO "openingtime";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='beachposts' AND column_name='author_id'
  ) THEN
    ALTER TABLE public."beachposts" RENAME COLUMN "author_id" TO "authorid";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='beachposts' AND column_name='beach_id'
  ) THEN
    ALTER TABLE public."beachposts" RENAME COLUMN "beach_id" TO "beachid";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='beachposts' AND column_name='created_at'
  ) THEN
    ALTER TABLE public."beachposts" RENAME COLUMN "created_at" TO "createdat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='beachposts' AND column_name='image_path'
  ) THEN
    ALTER TABLE public."beachposts" RENAME COLUMN "image_path" TO "imagepath";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='beachposts' AND column_name='updated_at'
  ) THEN
    ALTER TABLE public."beachposts" RENAME COLUMN "updated_at" TO "updatedat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='reviewreports' AND column_name='beach_id'
  ) THEN
    ALTER TABLE public."reviewreports" RENAME COLUMN "beach_id" TO "beachid";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='reviewreports' AND column_name='created_at'
  ) THEN
    ALTER TABLE public."reviewreports" RENAME COLUMN "created_at" TO "createdat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='reviewreports' AND column_name='reporter_user_id'
  ) THEN
    ALTER TABLE public."reviewreports" RENAME COLUMN "reporter_user_id" TO "reporteruserid";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='reviewreports' AND column_name='review_id'
  ) THEN
    ALTER TABLE public."reviewreports" RENAME COLUMN "review_id" TO "reviewid";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='reviewreports' AND column_name='reviewed_at'
  ) THEN
    ALTER TABLE public."reviewreports" RENAME COLUMN "reviewed_at" TO "reviewedat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='beachreviews' AND column_name='beach_id'
  ) THEN
    ALTER TABLE public."beachreviews" RENAME COLUMN "beach_id" TO "beachid";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='beachreviews' AND column_name='created_at'
  ) THEN
    ALTER TABLE public."beachreviews" RENAME COLUMN "created_at" TO "createdat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='beachreviews' AND column_name='updated_at'
  ) THEN
    ALTER TABLE public."beachreviews" RENAME COLUMN "updated_at" TO "updatedat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='beachreviews' AND column_name='user_id'
  ) THEN
    ALTER TABLE public."beachreviews" RENAME COLUMN "user_id" TO "userid";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='rooms' AND column_name='beach_id'
  ) THEN
    ALTER TABLE public."rooms" RENAME COLUMN "beach_id" TO "beachid";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='rooms' AND column_name='created_at'
  ) THEN
    ALTER TABLE public."rooms" RENAME COLUMN "created_at" TO "createdat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='rooms' AND column_name='display_order'
  ) THEN
    ALTER TABLE public."rooms" RENAME COLUMN "display_order" TO "displayorder";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='rooms' AND column_name='is_available'
  ) THEN
    ALTER TABLE public."rooms" RENAME COLUMN "is_available" TO "isavailable";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='rooms' AND column_name='price_unit'
  ) THEN
    ALTER TABLE public."rooms" RENAME COLUMN "price_unit" TO "priceunit";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='rooms' AND column_name='updated_at'
  ) THEN
    ALTER TABLE public."rooms" RENAME COLUMN "updated_at" TO "updatedat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='beachrules' AND column_name='beach_id'
  ) THEN
    ALTER TABLE public."beachrules" RENAME COLUMN "beach_id" TO "beachid";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='beachrules' AND column_name='created_at'
  ) THEN
    ALTER TABLE public."beachrules" RENAME COLUMN "created_at" TO "createdat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='beachrules' AND column_name='display_order'
  ) THEN
    ALTER TABLE public."beachrules" RENAME COLUMN "display_order" TO "displayorder";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='beachrules' AND column_name='rule_type'
  ) THEN
    ALTER TABLE public."beachrules" RENAME COLUMN "rule_type" TO "ruletype";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='tourrequests' AND column_name='approved_at'
  ) THEN
    ALTER TABLE public."tourrequests" RENAME COLUMN "approved_at" TO "approvedat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='tourrequests' AND column_name='beach_id'
  ) THEN
    ALTER TABLE public."tourrequests" RENAME COLUMN "beach_id" TO "beachid";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='tourrequests' AND column_name='created_at'
  ) THEN
    ALTER TABLE public."tourrequests" RENAME COLUMN "created_at" TO "createdat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='tourrequests' AND column_name='owner_id'
  ) THEN
    ALTER TABLE public."tourrequests" RENAME COLUMN "owner_id" TO "ownerid";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='tourrequests' AND column_name='rejection_reason'
  ) THEN
    ALTER TABLE public."tourrequests" RENAME COLUMN "rejection_reason" TO "rejectionreason";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='tourrequests' AND column_name='requested_tour_url'
  ) THEN
    ALTER TABLE public."tourrequests" RENAME COLUMN "requested_tour_url" TO "requestedtoururl";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='tourrequests' AND column_name='requester_note'
  ) THEN
    ALTER TABLE public."tourrequests" RENAME COLUMN "requester_note" TO "requesternote";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='tourrequests' AND column_name='reviewed_at'
  ) THEN
    ALTER TABLE public."tourrequests" RENAME COLUMN "reviewed_at" TO "reviewedat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='tourrequests' AND column_name='reviewed_by'
  ) THEN
    ALTER TABLE public."tourrequests" RENAME COLUMN "reviewed_by" TO "reviewedby";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='tourrequests' AND column_name='status_note'
  ) THEN
    ALTER TABLE public."tourrequests" RENAME COLUMN "status_note" TO "statusnote";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='tourrequests' AND column_name='status_updated_at'
  ) THEN
    ALTER TABLE public."tourrequests" RENAME COLUMN "status_updated_at" TO "statusupdatedat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='tourrequests' AND column_name='updated_at'
  ) THEN
    ALTER TABLE public."tourrequests" RENAME COLUMN "updated_at" TO "updatedat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='tourstatushistory' AND column_name='changed_by'
  ) THEN
    ALTER TABLE public."tourstatushistory" RENAME COLUMN "changed_by" TO "changedby";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='tourstatushistory' AND column_name='created_at'
  ) THEN
    ALTER TABLE public."tourstatushistory" RENAME COLUMN "created_at" TO "createdat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='tourstatushistory' AND column_name='from_status'
  ) THEN
    ALTER TABLE public."tourstatushistory" RENAME COLUMN "from_status" TO "fromstatus";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='tourstatushistory' AND column_name='to_status'
  ) THEN
    ALTER TABLE public."tourstatushistory" RENAME COLUMN "to_status" TO "tostatus";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='tourstatushistory' AND column_name='tour_id'
  ) THEN
    ALTER TABLE public."tourstatushistory" RENAME COLUMN "tour_id" TO "tourid";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='weathersnapshots' AND column_name='beach_id'
  ) THEN
    ALTER TABLE public."weathersnapshots" RENAME COLUMN "beach_id" TO "beachid";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='weathersnapshots' AND column_name='synced_at'
  ) THEN
    ALTER TABLE public."weathersnapshots" RENAME COLUMN "synced_at" TO "syncedat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='weathersnapshots' AND column_name='weather_data'
  ) THEN
    ALTER TABLE public."weathersnapshots" RENAME COLUMN "weather_data" TO "weatherdata";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='emailnotifications' AND column_name='application_id'
  ) THEN
    ALTER TABLE public."emailnotifications" RENAME COLUMN "application_id" TO "applicationid";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='emailnotifications' AND column_name='created_at'
  ) THEN
    ALTER TABLE public."emailnotifications" RENAME COLUMN "created_at" TO "createdat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='emailnotifications' AND column_name='error_message'
  ) THEN
    ALTER TABLE public."emailnotifications" RENAME COLUMN "error_message" TO "errormessage";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='emailnotifications' AND column_name='notification_type'
  ) THEN
    ALTER TABLE public."emailnotifications" RENAME COLUMN "notification_type" TO "notificationtype";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='emailnotifications' AND column_name='recipient_email'
  ) THEN
    ALTER TABLE public."emailnotifications" RENAME COLUMN "recipient_email" TO "recipientemail";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='emailnotifications' AND column_name='recipient_name'
  ) THEN
    ALTER TABLE public."emailnotifications" RENAME COLUMN "recipient_name" TO "recipientname";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='emailnotifications' AND column_name='sent_at'
  ) THEN
    ALTER TABLE public."emailnotifications" RENAME COLUMN "sent_at" TO "sentat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='gmailconnections' AND column_name='created_at'
  ) THEN
    ALTER TABLE public."gmailconnections" RENAME COLUMN "created_at" TO "createdat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='gmailconnections' AND column_name='encrypted_refresh_token'
  ) THEN
    ALTER TABLE public."gmailconnections" RENAME COLUMN "encrypted_refresh_token" TO "encryptedrefreshtoken";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='gmailconnections' AND column_name='updated_at'
  ) THEN
    ALTER TABLE public."gmailconnections" RENAME COLUMN "updated_at" TO "updatedat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='gmailconnections' AND column_name='user_id'
  ) THEN
    ALTER TABLE public."gmailconnections" RENAME COLUMN "user_id" TO "userid";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='logindevices' AND column_name='device_id'
  ) THEN
    ALTER TABLE public."logindevices" RENAME COLUMN "device_id" TO "deviceid";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='logindevices' AND column_name='first_seen_at'
  ) THEN
    ALTER TABLE public."logindevices" RENAME COLUMN "first_seen_at" TO "firstseenat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='logindevices' AND column_name='last_seen_at'
  ) THEN
    ALTER TABLE public."logindevices" RENAME COLUMN "last_seen_at" TO "lastseenat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='logindevices' AND column_name='user_id'
  ) THEN
    ALTER TABLE public."logindevices" RENAME COLUMN "user_id" TO "userid";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='ownerapplications' AND column_name='applicant_email'
  ) THEN
    ALTER TABLE public."ownerapplications" RENAME COLUMN "applicant_email" TO "applicantemail";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='ownerapplications' AND column_name='applicant_full_name'
  ) THEN
    ALTER TABLE public."ownerapplications" RENAME COLUMN "applicant_full_name" TO "applicantfullname";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='ownerapplications' AND column_name='applicant_location'
  ) THEN
    ALTER TABLE public."ownerapplications" RENAME COLUMN "applicant_location" TO "applicantlocation";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='ownerapplications' AND column_name='applicant_user_id'
  ) THEN
    ALTER TABLE public."ownerapplications" RENAME COLUMN "applicant_user_id" TO "applicantuserid";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='ownerapplications' AND column_name='beach_description'
  ) THEN
    ALTER TABLE public."ownerapplications" RENAME COLUMN "beach_description" TO "beachdescription";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='ownerapplications' AND column_name='beach_location'
  ) THEN
    ALTER TABLE public."ownerapplications" RENAME COLUMN "beach_location" TO "beachlocation";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='ownerapplications' AND column_name='beach_name'
  ) THEN
    ALTER TABLE public."ownerapplications" RENAME COLUMN "beach_name" TO "beachname";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='ownerapplications' AND column_name='business_name'
  ) THEN
    ALTER TABLE public."ownerapplications" RENAME COLUMN "business_name" TO "businessname";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='ownerapplications' AND column_name='business_permit_path'
  ) THEN
    ALTER TABLE public."ownerapplications" RENAME COLUMN "business_permit_path" TO "businesspermitpath";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='ownerapplications' AND column_name='contact_phone'
  ) THEN
    ALTER TABLE public."ownerapplications" RENAME COLUMN "contact_phone" TO "contactphone";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='ownerapplications' AND column_name='cover_image_path'
  ) THEN
    ALTER TABLE public."ownerapplications" RENAME COLUMN "cover_image_path" TO "coverimagepath";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='ownerapplications' AND column_name='created_at'
  ) THEN
    ALTER TABLE public."ownerapplications" RENAME COLUMN "created_at" TO "createdat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='ownerapplications' AND column_name='decided_at'
  ) THEN
    ALTER TABLE public."ownerapplications" RENAME COLUMN "decided_at" TO "decidedat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='ownerapplications' AND column_name='live_selfie_captured_at'
  ) THEN
    ALTER TABLE public."ownerapplications" RENAME COLUMN "live_selfie_captured_at" TO "liveselfiecapturedat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='ownerapplications' AND column_name='live_selfie_path'
  ) THEN
    ALTER TABLE public."ownerapplications" RENAME COLUMN "live_selfie_path" TO "liveselfiepath";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='ownerapplications' AND column_name='liveness_attempts'
  ) THEN
    ALTER TABLE public."ownerapplications" RENAME COLUMN "liveness_attempts" TO "livenessattempts";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='ownerapplications' AND column_name='liveness_checked_at'
  ) THEN
    ALTER TABLE public."ownerapplications" RENAME COLUMN "liveness_checked_at" TO "livenesscheckedat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='ownerapplications' AND column_name='liveness_flagged_reasons'
  ) THEN
    ALTER TABLE public."ownerapplications" RENAME COLUMN "liveness_flagged_reasons" TO "livenessflaggedreasons";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='ownerapplications' AND column_name='liveness_snapshot_path'
  ) THEN
    ALTER TABLE public."ownerapplications" RENAME COLUMN "liveness_snapshot_path" TO "livenesssnapshotpath";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='ownerapplications' AND column_name='liveness_status'
  ) THEN
    ALTER TABLE public."ownerapplications" RENAME COLUMN "liveness_status" TO "livenessstatus";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='ownerapplications' AND column_name='profile_image_path'
  ) THEN
    ALTER TABLE public."ownerapplications" RENAME COLUMN "profile_image_path" TO "profileimagepath";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='ownerapplications' AND column_name='proof_of_ownership_path'
  ) THEN
    ALTER TABLE public."ownerapplications" RENAME COLUMN "proof_of_ownership_path" TO "proofofownershippath";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='ownerapplications' AND column_name='rejection_reason'
  ) THEN
    ALTER TABLE public."ownerapplications" RENAME COLUMN "rejection_reason" TO "rejectionreason";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='ownerapplications' AND column_name='reviewed_at'
  ) THEN
    ALTER TABLE public."ownerapplications" RENAME COLUMN "reviewed_at" TO "reviewedat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='ownerapplications' AND column_name='reviewed_by'
  ) THEN
    ALTER TABLE public."ownerapplications" RENAME COLUMN "reviewed_by" TO "reviewedby";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='ownerapplications' AND column_name='status_note'
  ) THEN
    ALTER TABLE public."ownerapplications" RENAME COLUMN "status_note" TO "statusnote";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='ownerapplications' AND column_name='status_updated_at'
  ) THEN
    ALTER TABLE public."ownerapplications" RENAME COLUMN "status_updated_at" TO "statusupdatedat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='ownerapplications' AND column_name='updated_at'
  ) THEN
    ALTER TABLE public."ownerapplications" RENAME COLUMN "updated_at" TO "updatedat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='ownerapplications' AND column_name='virtual_tour_url'
  ) THEN
    ALTER TABLE public."ownerapplications" RENAME COLUMN "virtual_tour_url" TO "virtualtoururl";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='livenesssessions' AND column_name='completed_at'
  ) THEN
    ALTER TABLE public."livenesssessions" RENAME COLUMN "completed_at" TO "completedat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='livenesssessions' AND column_name='consumed_at'
  ) THEN
    ALTER TABLE public."livenesssessions" RENAME COLUMN "consumed_at" TO "consumedat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='livenesssessions' AND column_name='created_at'
  ) THEN
    ALTER TABLE public."livenesssessions" RENAME COLUMN "created_at" TO "createdat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='livenesssessions' AND column_name='expires_at'
  ) THEN
    ALTER TABLE public."livenesssessions" RENAME COLUMN "expires_at" TO "expiresat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='livenesssessions' AND column_name='flagged_reasons'
  ) THEN
    ALTER TABLE public."livenesssessions" RENAME COLUMN "flagged_reasons" TO "flaggedreasons";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='livenesssessions' AND column_name='ip_hash'
  ) THEN
    ALTER TABLE public."livenesssessions" RENAME COLUMN "ip_hash" TO "iphash";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='livenesssessions' AND column_name='nonce_hash'
  ) THEN
    ALTER TABLE public."livenesssessions" RENAME COLUMN "nonce_hash" TO "noncehash";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='livenesssessions' AND column_name='snapshot_path'
  ) THEN
    ALTER TABLE public."livenesssessions" RENAME COLUMN "snapshot_path" TO "snapshotpath";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='livenesssessions' AND column_name='user_agent_hash'
  ) THEN
    ALTER TABLE public."livenesssessions" RENAME COLUMN "user_agent_hash" TO "useragenthash";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='livenesssessions' AND column_name='user_id'
  ) THEN
    ALTER TABLE public."livenesssessions" RENAME COLUMN "user_id" TO "userid";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='platformreviews' AND column_name='created_at'
  ) THEN
    ALTER TABLE public."platformreviews" RENAME COLUMN "created_at" TO "createdat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='platformreviews' AND column_name='updated_at'
  ) THEN
    ALTER TABLE public."platformreviews" RENAME COLUMN "updated_at" TO "updatedat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='platformreviews' AND column_name='user_id'
  ) THEN
    ALTER TABLE public."platformreviews" RENAME COLUMN "user_id" TO "userid";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='profiles' AND column_name='account_status'
  ) THEN
    ALTER TABLE public."profiles" RENAME COLUMN "account_status" TO "accountstatus";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='profiles' AND column_name='created_at'
  ) THEN
    ALTER TABLE public."profiles" RENAME COLUMN "created_at" TO "createdat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='profiles' AND column_name='full_name'
  ) THEN
    ALTER TABLE public."profiles" RENAME COLUMN "full_name" TO "fullname";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='profiles' AND column_name='pin_reset_required'
  ) THEN
    ALTER TABLE public."profiles" RENAME COLUMN "pin_reset_required" TO "pinresetrequired";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='profiles' AND column_name='profile_image_url'
  ) THEN
    ALTER TABLE public."profiles" RENAME COLUMN "profile_image_url" TO "profileimageurl";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='profiles' AND column_name='status_changed_at'
  ) THEN
    ALTER TABLE public."profiles" RENAME COLUMN "status_changed_at" TO "statuschangedat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='profiles' AND column_name='status_changed_by'
  ) THEN
    ALTER TABLE public."profiles" RENAME COLUMN "status_changed_by" TO "statuschangedby";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='profiles' AND column_name='status_reason'
  ) THEN
    ALTER TABLE public."profiles" RENAME COLUMN "status_reason" TO "statusreason";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='profiles' AND column_name='status_reason_type'
  ) THEN
    ALTER TABLE public."profiles" RENAME COLUMN "status_reason_type" TO "statusreasontype";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='profiles' AND column_name='suspended_at'
  ) THEN
    ALTER TABLE public."profiles" RENAME COLUMN "suspended_at" TO "suspendedat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='profiles' AND column_name='suspended_until'
  ) THEN
    ALTER TABLE public."profiles" RENAME COLUMN "suspended_until" TO "suspendeduntil";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='profiles' AND column_name='suspension_ends_at'
  ) THEN
    ALTER TABLE public."profiles" RENAME COLUMN "suspension_ends_at" TO "suspensionendsat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='profiles' AND column_name='suspension_reason'
  ) THEN
    ALTER TABLE public."profiles" RENAME COLUMN "suspension_reason" TO "suspensionreason";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='profiles' AND column_name='updated_at'
  ) THEN
    ALTER TABLE public."profiles" RENAME COLUMN "updated_at" TO "updatedat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='systemlogs' AND column_name='actor_id'
  ) THEN
    ALTER TABLE public."systemlogs" RENAME COLUMN "actor_id" TO "actorid";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='systemlogs' AND column_name='actor_name'
  ) THEN
    ALTER TABLE public."systemlogs" RENAME COLUMN "actor_name" TO "actorname";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='systemlogs' AND column_name='actor_role'
  ) THEN
    ALTER TABLE public."systemlogs" RENAME COLUMN "actor_role" TO "actorrole";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='systemlogs' AND column_name='created_at'
  ) THEN
    ALTER TABLE public."systemlogs" RENAME COLUMN "created_at" TO "createdat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='systemlogs' AND column_name='source_event_id'
  ) THEN
    ALTER TABLE public."systemlogs" RENAME COLUMN "source_event_id" TO "sourceeventid";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='systemlogs' AND column_name='source_table'
  ) THEN
    ALTER TABLE public."systemlogs" RENAME COLUMN "source_table" TO "sourcetable";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='systemlogs' AND column_name='target_id'
  ) THEN
    ALTER TABLE public."systemlogs" RENAME COLUMN "target_id" TO "targetid";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='systemlogs' AND column_name='target_name'
  ) THEN
    ALTER TABLE public."systemlogs" RENAME COLUMN "target_name" TO "targetname";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='systemlogs' AND column_name='target_role'
  ) THEN
    ALTER TABLE public."systemlogs" RENAME COLUMN "target_role" TO "targetrole";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='usernotifications' AND column_name='action_url'
  ) THEN
    ALTER TABLE public."usernotifications" RENAME COLUMN "action_url" TO "actionurl";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='usernotifications' AND column_name='created_at'
  ) THEN
    ALTER TABLE public."usernotifications" RENAME COLUMN "created_at" TO "createdat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='usernotifications' AND column_name='login_device_id'
  ) THEN
    ALTER TABLE public."usernotifications" RENAME COLUMN "login_device_id" TO "logindeviceid";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='usernotifications' AND column_name='read_at'
  ) THEN
    ALTER TABLE public."usernotifications" RENAME COLUMN "read_at" TO "readat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='usernotifications' AND column_name='responded_at'
  ) THEN
    ALTER TABLE public."usernotifications" RENAME COLUMN "responded_at" TO "respondedat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='usernotifications' AND column_name='user_id'
  ) THEN
    ALTER TABLE public."usernotifications" RENAME COLUMN "user_id" TO "userid";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='visitorevents' AND column_name='beach_id'
  ) THEN
    ALTER TABLE public."visitorevents" RENAME COLUMN "beach_id" TO "beachid";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='visitorevents' AND column_name='created_at'
  ) THEN
    ALTER TABLE public."visitorevents" RENAME COLUMN "created_at" TO "createdat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='visitorevents' AND column_name='event_type'
  ) THEN
    ALTER TABLE public."visitorevents" RENAME COLUMN "event_type" TO "eventtype";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='visitorevents' AND column_name='page_key'
  ) THEN
    ALTER TABLE public."visitorevents" RENAME COLUMN "page_key" TO "pagekey";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='visitorevents' AND column_name='session_id'
  ) THEN
    ALTER TABLE public."visitorevents" RENAME COLUMN "session_id" TO "sessionid";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='visitorevents' AND column_name='visit_date'
  ) THEN
    ALTER TABLE public."visitorevents" RENAME COLUMN "visit_date" TO "visitdate";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='beaches' AND column_name='average_rating'
  ) THEN
    ALTER TABLE public."beaches" RENAME COLUMN "average_rating" TO "averagerating";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='beaches' AND column_name='best_visiting_time'
  ) THEN
    ALTER TABLE public."beaches" RENAME COLUMN "best_visiting_time" TO "bestvisitingtime";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='beaches' AND column_name='contact_email'
  ) THEN
    ALTER TABLE public."beaches" RENAME COLUMN "contact_email" TO "contactemail";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='beaches' AND column_name='contact_phone'
  ) THEN
    ALTER TABLE public."beaches" RENAME COLUMN "contact_phone" TO "contactphone";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='beaches' AND column_name='cottage_fee'
  ) THEN
    ALTER TABLE public."beaches" RENAME COLUMN "cottage_fee" TO "cottagefee";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='beaches' AND column_name='cover_image_url'
  ) THEN
    ALTER TABLE public."beaches" RENAME COLUMN "cover_image_url" TO "coverimageurl";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='beaches' AND column_name='created_at'
  ) THEN
    ALTER TABLE public."beaches" RENAME COLUMN "created_at" TO "createdat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='beaches' AND column_name='entrance_fee'
  ) THEN
    ALTER TABLE public."beaches" RENAME COLUMN "entrance_fee" TO "entrancefee";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='beaches' AND column_name='facebook_url'
  ) THEN
    ALTER TABLE public."beaches" RENAME COLUMN "facebook_url" TO "facebookurl";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='beaches' AND column_name='instagram_url'
  ) THEN
    ALTER TABLE public."beaches" RENAME COLUMN "instagram_url" TO "instagramurl";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='beaches' AND column_name='opening_hours'
  ) THEN
    ALTER TABLE public."beaches" RENAME COLUMN "opening_hours" TO "openinghours";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='beaches' AND column_name='owner_id'
  ) THEN
    ALTER TABLE public."beaches" RENAME COLUMN "owner_id" TO "ownerid";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='beaches' AND column_name='peak_days'
  ) THEN
    ALTER TABLE public."beaches" RENAME COLUMN "peak_days" TO "peakdays";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='beaches' AND column_name='peak_hours'
  ) THEN
    ALTER TABLE public."beaches" RENAME COLUMN "peak_hours" TO "peakhours";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='beaches' AND column_name='profile_image_url'
  ) THEN
    ALTER TABLE public."beaches" RENAME COLUMN "profile_image_url" TO "profileimageurl";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='beaches' AND column_name='updated_at'
  ) THEN
    ALTER TABLE public."beaches" RENAME COLUMN "updated_at" TO "updatedat";
  END IF;
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='beaches' AND column_name='virtual_tour_url'
  ) THEN
    ALTER TABLE public."beaches" RENAME COLUMN "virtual_tour_url" TO "virtualtoururl";
  END IF;
END $$;

DROP VIEW IF EXISTS public.beach_published_tours;
CREATE VIEW public.beach_published_tours
WITH (security_invoker = true) AS
SELECT beachid, requestedtoururl, approvedat, statusupdatedat
FROM (
  SELECT DISTINCT ON (beachid)
    beachid, requestedtoururl, approvedat, statusupdatedat, status
  FROM public.tourrequests
  ORDER BY beachid, createdat DESC, id DESC
) latest
WHERE status = 'approved';

REVOKE ALL ON public.beach_published_tours FROM PUBLIC, anon, authenticated;
GRANT SELECT ON public.beach_published_tours TO anon, authenticated;


-- Source: supabase/migrations/20261115_suspensions.sql
CREATE OR REPLACE FUNCTION public.enforce_active_account_for_writes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
  accountstatus TEXT;
  suspension_end TIMESTAMPTZ;
BEGIN
  IF COALESCE(auth.role(), '') = 'service_role' OR auth.uid() IS NULL THEN
    IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
    RETURN NEW;
  END IF;

  SELECT status, suspensionendsat
  INTO accountstatus, suspension_end
  FROM public.profiles
  WHERE id = auth.uid();

  IF accountstatus = 'suspended' AND (suspension_end IS NULL OR suspension_end > now()) THEN
    RAISE EXCEPTION 'This account is suspended'
      USING ERRCODE = '42501';
  END IF;

  IF TG_OP = 'DELETE' THEN RETURN OLD; END IF;
  RETURN NEW;
END;
$$;

-- Source: supabase/migrations/20261110_uploadlimits.sql
CREATE OR REPLACE FUNCTION public.enforce_cottage_photo_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  photo_count INTEGER;
BEGIN
  PERFORM 1
  FROM public.cottages
  WHERE id = NEW.cottageid
  FOR UPDATE;

  SELECT COUNT(*) INTO photo_count
  FROM public.cottagephotos
  WHERE cottageid = NEW.cottageid;

  IF photo_count >= 10 THEN
    RAISE EXCEPTION 'A cottage can have up to 10 photos.';
  END IF;

  RETURN NEW;
END;
$$;

-- Source: supabase/migrations/20261110_uploadlimits.sql
CREATE OR REPLACE FUNCTION public.enforce_facility_photo_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  photo_count INTEGER;
BEGIN
  PERFORM 1
  FROM public.facilities
  WHERE id = NEW.facilityid
  FOR UPDATE;

  SELECT COUNT(*) INTO photo_count
  FROM public.facilityphotos
  WHERE facilityid = NEW.facilityid;

  IF photo_count >= 10 THEN
    RAISE EXCEPTION 'A facility can have up to 10 photos.';
  END IF;

  RETURN NEW;
END;
$$;

-- Source: supabase/dagattabai.sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN

    INSERT INTO public.profiles (
        id,
        fullname,
        email,
        profileimageurl,
        location,
        pin,
        role
    )
    VALUES (
        NEW.id,

        COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            split_part(
                COALESCE(NEW.email, ''),
                '@',
                1
            )
        ),

        NEW.email,

        COALESCE(
            NEW.raw_user_meta_data->>'avatar_url',
            NEW.raw_user_meta_data->>'picture'
        ),

        NEW.raw_user_meta_data->>'location',

        NULL,

        CASE
            WHEN lower(COALESCE(NEW.email, '')) = 'official.dagattabai@gmail.com' THEN 'admin'
            ELSE 'user'
        END
    )

    ON CONFLICT (id)
    DO UPDATE SET
        fullname = EXCLUDED.fullname,
        email = EXCLUDED.email,
        profileimageurl = COALESCE(
            EXCLUDED.profileimageurl,
            public.profiles.profileimageurl
        ),
        location = COALESCE(
            EXCLUDED.location,
            public.profiles.location
        ),
        pin = COALESCE(
            EXCLUDED.pin,
            public.profiles.pin
        ),
        role = CASE
            WHEN lower(COALESCE(EXCLUDED.email, '')) = 'official.dagattabai@gmail.com' THEN 'admin'
            ELSE public.profiles.role
        END,
        updatedat = now();

    RETURN NEW;

END;
$$;

-- Source: supabase/dagattabai.sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE public.profiles.id = auth.uid()
        AND public.profiles.role = 'admin'
    );
$$;

-- Source: supabase/dagattabai.sql
CREATE OR REPLACE FUNCTION public.is_beach_manager()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1
        FROM public.profiles
        WHERE public.profiles.id = auth.uid()
        AND public.profiles.role = 'beach_manager'
    );
$$;

-- Source: supabase/migrations/20261121175748_revertfunc.sql
CREATE OR REPLACE FUNCTION public.is_safe_admin_text(candidate TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN candidate IS NOT NULL
    AND char_length(normalize(candidate, NFKC)) BETWEEN 10 AND 500
    AND normalize(candidate, NFKC) !~ '[-<>;`{}$|^~*%]'
    AND position('[' in normalize(candidate, NFKC)) = 0
    AND position(']' in normalize(candidate, NFKC)) = 0
    AND position(chr(92) in normalize(candidate, NFKC)) = 0
    AND normalize(candidate, NFKC) !~ '[[:cntrl:]]'
    AND normalize(candidate, NFKC) !~ U&'[\200B-\200F\202A-\202E\2060-\206F\FE00-\FE0F\FEFF]'
    AND normalize(candidate, NFKC) !~ '--|/\*|\*/|\$\{';
END;
$$;

-- Source: supabase/dagattabai.sql
CREATE OR REPLACE FUNCTION public.owns_beach(
    p_beach_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT
        public.is_admin()
        OR EXISTS (
            SELECT 1
            FROM public.beaches
            WHERE public.beaches.id = p_beach_id
            AND public.beaches.ownerid = auth.uid()
        );
$$;

-- Source: supabase/migrations/20261116_moderation.sql
CREATE OR REPLACE FUNCTION public.prevent_account_admin_field_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role'
     AND NOT public.is_admin()
     AND (
       NEW.role IS DISTINCT FROM OLD.role OR
       NEW.accountstatus IS DISTINCT FROM OLD.accountstatus OR
       NEW.statusreason IS DISTINCT FROM OLD.statusreason OR
       NEW.statusreasontype IS DISTINCT FROM OLD.statusreasontype OR
       NEW.suspendeduntil IS DISTINCT FROM OLD.suspendeduntil OR
       NEW.statuschangedby IS DISTINCT FROM OLD.statuschangedby OR
       NEW.statuschangedat IS DISTINCT FROM OLD.statuschangedat OR
       NEW.pinresetrequired IS DISTINCT FROM OLD.pinresetrequired
     ) THEN
    RAISE EXCEPTION 'Only administrators can change account controls'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

-- Source: supabase/migrations/20261118213000_deduplicateapps.sql
CREATE OR REPLACE FUNCTION public.prevent_duplicate_pending_owner_application()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
BEGIN
  IF NEW.applicantuserid IS NULL OR NEW.status IS DISTINCT FROM 'pending' THEN
    RETURN NEW;
  END IF;

  PERFORM pg_advisory_xact_lock(hashtextextended(NEW.applicantuserid::text, 0));

  IF EXISTS (
    SELECT 1
    FROM public.ownerapplications existing
    WHERE existing.applicantuserid = NEW.applicantuserid
      AND existing.status = 'pending'
      AND existing.id IS DISTINCT FROM NEW.id
  ) THEN
    RAISE EXCEPTION 'A pending owner application already exists.'
      USING ERRCODE = '23505',
            CONSTRAINT = 'owner_applications_one_pending_per_applicant';
  END IF;

  RETURN NEW;
END;
$$;

-- Source: supabase/migrations/20261024155800_beachrole.sql
CREATE OR REPLACE FUNCTION public.prevent_profile_role_self_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.role IS DISTINCT FROM OLD.role
     AND auth.uid() IS NOT NULL
     AND COALESCE(auth.role(), '') <> 'service_role' THEN
    RAISE EXCEPTION 'Profile roles can only be changed by an authorized backend action';
  END IF;

  RETURN NEW;
END;
$$;

-- Source: supabase/migrations/20261121175748_revertfunc.sql
CREATE OR REPLACE FUNCTION public.prevent_system_audit_log_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RAISE EXCEPTION 'System audit log cannot be modified directly'
    USING ERRCODE = '42501';
  RETURN NULL;
END;
$$;

-- Source: supabase/migrations/20261121175748_revertfunc.sql
CREATE OR REPLACE FUNCTION public.prevent_user_suspension_edits()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.accountstatus IS DISTINCT FROM OLD.accountstatus
     OR NEW.statusreason IS DISTINCT FROM OLD.statusreason
     OR NEW.statusreasontype IS DISTINCT FROM OLD.statusreasontype
     OR NEW.suspendeduntil IS DISTINCT FROM OLD.suspendeduntil THEN
    RAISE EXCEPTION 'Account suspension fields can only be changed by authorized backend action'
      USING ERRCODE = '42501';
  END IF;
  RETURN NEW;
END;
$$;

-- Source: supabase/dagattabai.sql
CREATE OR REPLACE FUNCTION public.queue_application_received_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN

    INSERT INTO public.emailnotifications (
        recipientemail,
        recipientname,
        notificationtype,
        applicationid,
        subject,
        message
    )
    VALUES (
        NEW.applicantemail,
        NEW.applicantfullname,
        'application_received',
        NEW.id,
        'Dagat Ta Bai - Application Received',
        'Your beach owner application has been received and is now under review.'
    );

    RETURN NEW;

END;
$$;

-- Source: supabase/migrations/20261117214500_applicationprogress.sql
CREATE OR REPLACE FUNCTION public.queue_application_status_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'approved' AND OLD.status IS DISTINCT FROM 'approved' THEN
    INSERT INTO public.emailnotifications (
      recipientemail, recipientname, notificationtype, applicationid, subject, message
    )
    VALUES (
      NEW.applicantemail, NEW.applicantfullname, 'application_approved', NEW.id,
      'Dagat Ta Bai - Application Approved',
      'Your beach owner application has been approved. You may now access your beach portal.'
    );
  ELSIF NEW.status = 'rejected' AND OLD.status IS DISTINCT FROM 'rejected' THEN
    INSERT INTO public.emailnotifications (
      recipientemail, recipientname, notificationtype, applicationid, subject, message
    )
    VALUES (
      NEW.applicantemail, NEW.applicantfullname, 'application_rejected', NEW.id,
      'Dagat Ta Bai - Application Update',
      COALESCE(
        'Your beach owner application was not approved. Reason: ' || NEW.rejectionreason,
        'Your beach owner application was not approved.'
      )
    );
  ELSIF NEW.status = 'needs_changes' AND OLD.status IS DISTINCT FROM 'needs_changes' THEN
    INSERT INTO public.emailnotifications (
      recipientemail, recipientname, notificationtype, applicationid, subject, message
    )
    VALUES (
      NEW.applicantemail, NEW.applicantfullname, 'application_needs_changes', NEW.id,
      'Dagat Ta Bai - Changes Requested',
      'Please review the changes requested for your beach owner application: '
        || COALESCE(NEW.statusnote, 'Please sign in to view your application update.')
    );
  ELSIF NEW.status = 'pending' AND OLD.status = 'needs_changes' THEN
    INSERT INTO public.emailnotifications (
      recipientemail, recipientname, notificationtype, applicationid, subject, message
    )
    VALUES (
      NEW.applicantemail, NEW.applicantfullname, 'application_received', NEW.id,
      'Dagat Ta Bai - Application Resubmitted',
      'Your updated beach owner application has been received and is back in review.'
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Source: supabase/dagattabai.sql
CREATE OR REPLACE FUNCTION public.recalculate_beach_rating()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    target_beach_id UUID;
BEGIN

    target_beach_id :=
        COALESCE(
            NEW.beachid,
            OLD.beachid
        );

    UPDATE public.beaches
    SET
        averagerating = COALESCE(
            (
                SELECT ROUND(
                    AVG(rating)::numeric,
                    2
                )
                FROM public.beachreviews
                WHERE beachid = target_beach_id
            ),
            0.00
        ),
        updatedat = now()
    WHERE id = target_beach_id;

    RETURN COALESCE(NEW, OLD);

END;
$$;

-- Source: supabase/migrations/20261114_tourlifecycle.sql
CREATE OR REPLACE FUNCTION public.record_beach_tour_status_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.tourstatushistory (tourid, fromstatus, tostatus, note, changedby, createdat)
    VALUES (NEW.id, NULL, NEW.status, NEW.statusnote, COALESCE(NEW.reviewedby, NEW.ownerid), now());
  ELSIF OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.tourstatushistory (tourid, fromstatus, tostatus, note, changedby, createdat)
    VALUES (NEW.id, OLD.status, NEW.status, NEW.statusnote, COALESCE(NEW.reviewedby, NEW.ownerid), now());
  END IF;
  RETURN NEW;
END;
$$;

-- Source: supabase/migrations/20261117214500_applicationprogress.sql
CREATE OR REPLACE FUNCTION public.record_owner_application_status_history()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.appstatushistory (
      applicationid, fromstatus, tostatus, note, changedby, createdat
    )
    VALUES (
      NEW.id,
      NULL,
      NEW.status,
      COALESCE(NEW.statusnote, NEW.rejectionreason),
      COALESCE(NEW.reviewedby, NEW.applicantuserid, auth.uid()),
      COALESCE(NEW.statusupdatedat, now())
    );
  ELSIF NEW.status IS DISTINCT FROM OLD.status THEN
    INSERT INTO public.appstatushistory (
      applicationid, fromstatus, tostatus, note, changedby, createdat
    )
    VALUES (
      NEW.id,
      OLD.status,
      NEW.status,
      COALESCE(NEW.statusnote, NEW.rejectionreason),
      COALESCE(NEW.reviewedby, NEW.applicantuserid, auth.uid()),
      COALESCE(NEW.statusupdatedat, now())
    );
  END IF;
  RETURN NEW;
END;
$$;

-- Source: supabase/migrations/20261104000002_logindevices.sql
CREATE OR REPLACE FUNCTION public.register_login_device(
  p_device_id UUID,
  p_browser TEXT,
  p_platform TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID := auth.uid();
  v_known_device_count INTEGER;
  v_device_id UUID;
  v_is_new BOOLEAN;
BEGIN
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Authentication is required to register a login device.';
  END IF;

  PERFORM 1
  FROM public.profiles
  WHERE id = v_user_id
  FOR UPDATE;

  SELECT count(*) INTO v_known_device_count
  FROM public.logindevices
  WHERE userid = v_user_id;

  INSERT INTO public.logindevices (userid, deviceid, browser, platform)
  VALUES (v_user_id, p_device_id, p_browser, p_platform)
  ON CONFLICT (userid, deviceid) DO NOTHING
  RETURNING id INTO v_device_id;

  v_is_new := FOUND;

  IF v_is_new THEN
    IF v_known_device_count > 0 THEN
      INSERT INTO public.usernotifications (userid, logindeviceid, type)
      VALUES (v_user_id, v_device_id, 'new_device_login');
    END IF;
  ELSE
    UPDATE public.logindevices
    SET browser = p_browser,
        platform = p_platform,
        lastseenat = now()
    WHERE userid = v_user_id
      AND deviceid = p_device_id;
  END IF;

  RETURN v_is_new;
END;
$$;

-- Source: supabase/migrations/20261116_moderation.sql
CREATE OR REPLACE FUNCTION public.reserve_admin_reset_rate_limit(
  p_admin_id UUID,
  p_target_user_id UUID
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  target_count INTEGER;
  target_oldest TIMESTAMPTZ;
  admin_count INTEGER;
  admin_oldest TIMESTAMPTZ;
  retry_after INTEGER := 0;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_admin_id::TEXT, 8102));
  PERFORM pg_advisory_xact_lock(hashtextextended(p_target_user_id::TEXT, 8103));

  DELETE FROM public.adminresetlimit
  WHERE createdat < now() - INTERVAL '1 day';

  SELECT COUNT(*)::INTEGER, MIN(createdat)
    INTO target_count, target_oldest
  FROM public.adminresetlimit
  WHERE targetuserid = p_target_user_id
    AND createdat >= now() - INTERVAL '10 minutes';

  SELECT COUNT(*)::INTEGER, MIN(createdat)
    INTO admin_count, admin_oldest
  FROM public.adminresetlimit
  WHERE adminid = p_admin_id
    AND createdat >= now() - INTERVAL '1 hour';

  IF target_count >= 1 THEN
    retry_after := GREATEST(
      retry_after,
      CEIL(EXTRACT(EPOCH FROM (target_oldest + INTERVAL '10 minutes' - now())))::INTEGER
    );
  END IF;
  IF admin_count >= 20 THEN
    retry_after := GREATEST(
      retry_after,
      CEIL(EXTRACT(EPOCH FROM (admin_oldest + INTERVAL '1 hour' - now())))::INTEGER
    );
  END IF;
  IF retry_after > 0 THEN
    RETURN retry_after;
  END IF;

  INSERT INTO public.adminresetlimit (adminid, targetuserid)
  VALUES (p_admin_id, p_target_user_id);
  RETURN 0;
END;
$$;

-- Source: supabase/migrations/20261117000000_suspensionworkflow.sql
CREATE OR REPLACE FUNCTION public.reserve_admin_status_change(p_admin_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  request_count INTEGER;
  oldest_request TIMESTAMPTZ;
BEGIN
  PERFORM pg_advisory_xact_lock(hashtextextended(p_admin_id::TEXT, 8104));

  DELETE FROM public.adminstatuslimit
  WHERE createdat < now() - INTERVAL '1 day';

  SELECT COUNT(*)::INTEGER, MIN(createdat)
    INTO request_count, oldest_request
  FROM public.adminstatuslimit
  WHERE adminid = p_admin_id
    AND createdat >= now() - INTERVAL '1 hour';

  IF request_count >= 30 THEN
    RETURN GREATEST(
      1,
      CEIL(EXTRACT(EPOCH FROM (oldest_request + INTERVAL '1 hour' - now())))::INTEGER
    );
  END IF;

  INSERT INTO public.adminstatuslimit (adminid) VALUES (p_admin_id);
  RETURN 0;
END;
$$;

-- Source: supabase/dagattabai.sql
CREATE OR REPLACE FUNCTION public.update_profile_from_auth()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN

    UPDATE public.profiles
    SET
        fullname = COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            public.profiles.fullname
        ),

        email = NEW.email,

        profileimageurl = COALESCE(
            NEW.raw_user_meta_data->>'avatar_url',
            NEW.raw_user_meta_data->>'picture',
            public.profiles.profileimageurl
        ),

        location = COALESCE(
            NEW.raw_user_meta_data->>'location',
            public.profiles.location
        ),

        pin = COALESCE(
            NEW.raw_user_meta_data->>'pin',
            public.profiles.pin
        ),

        updatedat = now()

    WHERE id = NEW.id;

    RETURN NEW;

END;
$$;

-- DB-only routine reported as private.owns_beach; mirrors public.owns_beach.
CREATE SCHEMA IF NOT EXISTS private;
CREATE OR REPLACE FUNCTION private.owns_beach(
    p_beach_id UUID
)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT
        public.is_admin()
        OR EXISTS (
            SELECT 1
            FROM public.beaches
            WHERE public.beaches.id = p_beach_id
            AND public.beaches.ownerid = auth.uid()
        );
$$;

COMMIT;
-- Follow-up for databases where the table/column renames were already applied manually.
-- Recreates beach_published_tours with the new column names and replaces routine
-- bodies that still referenced the old identifiers. Safe to run as-is.

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


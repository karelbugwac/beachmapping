CREATE EXTENSION IF NOT EXISTS "pgcrypto";

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'owner-application-documents',
    'owner-application-documents',
    false,
    10485760,
    ARRAY['application/pdf', 'image/png', 'image/jpeg']
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'beach-media',
    'beach-media',
    true,
    21474836480,
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP TABLE IF EXISTS
    public.emailnotifications,
    public.platformreviews,
    public.beachreviews,
    public.beachrules,
    public.fooddrinks,
    public.rooms,
    public.equipment,
    public.facilities,
    public.beachactivities,
    public.cottages,
    public.openinghours,
    public.beachinfo,
    public.externallinks,
    public.weathersnapshots,
    public.ownerapplications,
    public.beaches,
    public.profiles
CASCADE;


CREATE TABLE public.profiles (
    id UUID PRIMARY KEY
        REFERENCES auth.users(id)
        ON DELETE CASCADE,

    fullname TEXT NOT NULL,

    email TEXT,

    profileimageurl TEXT,

    location TEXT,

    pin TEXT,

    role TEXT NOT NULL DEFAULT 'user'
        CHECK (
            role IN (
                'user',
                'beach_owner',
                'beach_manager',
                'admin'
            )
        ),

    createdat TIMESTAMPTZ NOT NULL DEFAULT now(),

    updatedat TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE TABLE public.beaches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    ownerid UUID UNIQUE
        REFERENCES public.profiles(id)
        ON DELETE SET NULL,

    slug TEXT NOT NULL UNIQUE,

    name TEXT NOT NULL,

    description TEXT,

    profileimageurl TEXT,

    coverimageurl TEXT,

    virtualtoururl TEXT,

    location TEXT NOT NULL,

    latitude NUMERIC(10, 8),

    longitude NUMERIC(11, 8),

    contactphone TEXT,

    contactemail TEXT,

    images JSONB NOT NULL DEFAULT '[]'::jsonb,

    openinghours TEXT NOT NULL DEFAULT '8:00 AM - 6:00 PM',

    entrancefee TEXT,

    cottagefee TEXT,

    rules TEXT,

    status TEXT NOT NULL DEFAULT 'active'
        CHECK (
            status IN (
                'active',
                'inactive',
                'suspended'
            )
        ),

    averagerating NUMERIC(3, 2) NOT NULL DEFAULT 0.00
        CHECK (
            averagerating >= 0
            AND averagerating <= 5
        ),

    createdat TIMESTAMPTZ NOT NULL DEFAULT now(),

    updatedat TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE TABLE public.beachinfo (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    beachid UUID NOT NULL UNIQUE
        REFERENCES public.beaches(id)
        ON DELETE CASCADE,

    entrancefee NUMERIC(10, 2),

    childentrancefee NUMERIC(10, 2),

    seniorentrancefee NUMERIC(10, 2),

    entrancefeenotes TEXT,

    generalinformation TEXT,

    updatedat TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE TABLE public.openinghours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    beachid UUID NOT NULL
        REFERENCES public.beaches(id)
        ON DELETE CASCADE,

    dayofweek SMALLINT NOT NULL
        CHECK (
            dayofweek BETWEEN 0 AND 6
        ),

    isopen BOOLEAN NOT NULL DEFAULT true,

    openingtime TIME,

    closingtime TIME,

    UNIQUE (
        beachid,
        dayofweek
    )
);


CREATE TABLE public.cottages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    beachid UUID NOT NULL
        REFERENCES public.beaches(id)
        ON DELETE CASCADE,

    name TEXT NOT NULL,

    description TEXT,

    price NUMERIC(10, 2),

    priceunit TEXT NOT NULL DEFAULT 'per day',

    capacity INTEGER
        CHECK (
            capacity IS NULL
            OR capacity > 0
        ),

    images TEXT[] NOT NULL DEFAULT '{}',

    isavailable BOOLEAN NOT NULL DEFAULT true,

    displayorder INTEGER NOT NULL DEFAULT 0,

    createdat TIMESTAMPTZ NOT NULL DEFAULT now(),

    updatedat TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE TABLE public.beachactivities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    beachid UUID NOT NULL
        REFERENCES public.beaches(id)
        ON DELETE CASCADE,

    name TEXT NOT NULL,

    description TEXT,

    price NUMERIC(10, 2),

    priceunit TEXT,

    images TEXT[] NOT NULL DEFAULT '{}',

    isavailable BOOLEAN NOT NULL DEFAULT true,

    displayorder INTEGER NOT NULL DEFAULT 0,

    createdat TIMESTAMPTZ NOT NULL DEFAULT now(),

    updatedat TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE TABLE public.facilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    beachid UUID NOT NULL
        REFERENCES public.beaches(id)
        ON DELETE CASCADE,

    name TEXT NOT NULL,

    description TEXT,

    price NUMERIC(10, 2),

    priceunit TEXT,

    images TEXT[] NOT NULL DEFAULT '{}',

    isavailable BOOLEAN NOT NULL DEFAULT true,

    displayorder INTEGER NOT NULL DEFAULT 0,

    createdat TIMESTAMPTZ NOT NULL DEFAULT now(),

    updatedat TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE TABLE public.equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    beachid UUID NOT NULL
        REFERENCES public.beaches(id)
        ON DELETE CASCADE,

    name TEXT NOT NULL,

    description TEXT,

    rentalprice NUMERIC(10, 2),

    priceunit TEXT,

    quantity INTEGER
        CHECK (
            quantity IS NULL
            OR quantity >= 0
        ),

    images TEXT[] NOT NULL DEFAULT '{}',

    isavailable BOOLEAN NOT NULL DEFAULT true,

    displayorder INTEGER NOT NULL DEFAULT 0,

    createdat TIMESTAMPTZ NOT NULL DEFAULT now(),

    updatedat TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE TABLE public.rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    beachid UUID NOT NULL
        REFERENCES public.beaches(id)
        ON DELETE CASCADE,

    name TEXT NOT NULL,

    description TEXT,

    price NUMERIC(10, 2),

    priceunit TEXT NOT NULL DEFAULT 'per night',

    capacity INTEGER
        CHECK (
            capacity IS NULL
            OR capacity > 0
        ),

    images TEXT[] NOT NULL DEFAULT '{}',

    isavailable BOOLEAN NOT NULL DEFAULT true,

    displayorder INTEGER NOT NULL DEFAULT 0,

    createdat TIMESTAMPTZ NOT NULL DEFAULT now(),

    updatedat TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE TABLE public.fooddrinks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    beachid UUID NOT NULL
        REFERENCES public.beaches(id)
        ON DELETE CASCADE,

    name TEXT NOT NULL,

    description TEXT,

    category TEXT,

    price NUMERIC(10, 2),

    images TEXT[] NOT NULL DEFAULT '{}',

    isavailable BOOLEAN NOT NULL DEFAULT true,

    displayorder INTEGER NOT NULL DEFAULT 0,

    createdat TIMESTAMPTZ NOT NULL DEFAULT now(),

    updatedat TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE TABLE public.beachrules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    beachid UUID NOT NULL
        REFERENCES public.beaches(id)
        ON DELETE CASCADE,

    rule_type TEXT NOT NULL
        CHECK (
            rule_type IN (
                'do',
                'dont'
            )
        ),

    title TEXT NOT NULL,

    description TEXT,

    displayorder INTEGER NOT NULL DEFAULT 0,

    createdat TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE TABLE public.beachreviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    beachid UUID NOT NULL
        REFERENCES public.beaches(id)
        ON DELETE CASCADE,

    userid UUID NOT NULL
        REFERENCES public.profiles(id)
        ON DELETE CASCADE,

    rating INTEGER NOT NULL
        CHECK (
            rating BETWEEN 1 AND 5
        ),

    comment TEXT NOT NULL,

    photos TEXT[] NOT NULL DEFAULT '{}',

    createdat TIMESTAMPTZ NOT NULL DEFAULT now(),

    updatedat TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE TABLE public.platformreviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    userid UUID
        REFERENCES public.profiles(id)
        ON DELETE SET NULL,

    rating INTEGER NOT NULL
        CHECK (
            rating BETWEEN 1 AND 5
        ),

    comment TEXT NOT NULL,

    createdat TIMESTAMPTZ NOT NULL DEFAULT now(),

    updatedat TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE TABLE public.logindevices (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userid UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    deviceid UUID NOT NULL,
    browser TEXT NOT NULL,
    platform TEXT NOT NULL,
    firstseenat TIMESTAMPTZ NOT NULL DEFAULT now(),
    lastseenat TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (userid, deviceid)
);


CREATE TABLE public.usernotifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userid UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    logindeviceid UUID NOT NULL REFERENCES public.logindevices(id) ON DELETE CASCADE,
    type TEXT NOT NULL CHECK (type IN ('new_device_login')),
    createdat TIMESTAMPTZ NOT NULL DEFAULT now(),
    readat TIMESTAMPTZ,
    response TEXT CHECK (response IN ('confirmed', 'unrecognized')),
    respondedat TIMESTAMPTZ
);


CREATE INDEX idx_user_notifications_owner_created
ON public.usernotifications(userid, createdat DESC);


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


REVOKE ALL ON FUNCTION public.register_login_device(UUID, TEXT, TEXT) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.register_login_device(UUID, TEXT, TEXT) TO authenticated;


CREATE TABLE public.reviewreports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    reviewid UUID NOT NULL REFERENCES public.beachreviews(id) ON DELETE CASCADE,
    beachid UUID NOT NULL REFERENCES public.beaches(id) ON DELETE CASCADE,
    reporteruserid UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'removed', 'dismissed')),
    createdat TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewedat TIMESTAMPTZ
);


CREATE TABLE public.chatmessages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    userid UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    createdat TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE TABLE public.ownerapplications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    applicantuserid UUID
        REFERENCES public.profiles(id)
        ON DELETE SET NULL,

    created_user_id UUID
        REFERENCES public.profiles(id)
        ON DELETE SET NULL,

    applicantfullname TEXT NOT NULL,

    applicantemail TEXT NOT NULL,

    applicantlocation TEXT,

    contactphone TEXT NOT NULL,

    businessname TEXT NOT NULL,

    beachname TEXT NOT NULL,

    beachdescription TEXT,

    beachlocation TEXT NOT NULL,

    latitude NUMERIC(10, 8),

    longitude NUMERIC(11, 8),

    businesspermitpath TEXT NOT NULL,

    proofofownershippath TEXT NOT NULL,

    profileimagepath TEXT,

    coverimagepath TEXT,

    virtualtoururl TEXT,

    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (
            status IN (
                'pending',
                'approved',
                'rejected'
            )
        ),

    rejectionreason TEXT,

    reviewedby UUID
        REFERENCES public.profiles(id)
        ON DELETE SET NULL,

    reviewedat TIMESTAMPTZ,

    createdat TIMESTAMPTZ NOT NULL DEFAULT now(),

    updatedat TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE TABLE public.visitorevents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    sessionid UUID NOT NULL,

    pagekey TEXT NOT NULL,

    eventtype TEXT NOT NULL CHECK (eventtype IN ('platform_visit', 'beach_profile_view')),

    beachid UUID REFERENCES public.beaches(id) ON DELETE CASCADE,

    visitdate DATE NOT NULL DEFAULT CURRENT_DATE,

    createdat TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT visitor_events_session_page_date_unique UNIQUE (sessionid, pagekey, visitdate)
);


CREATE TABLE public.externallinks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    beachid UUID NOT NULL
        REFERENCES public.beaches(id)
        ON DELETE CASCADE,

    label TEXT NOT NULL,

    url TEXT NOT NULL,

    createdat TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE TABLE public.weathersnapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    beachid UUID NOT NULL
        REFERENCES public.beaches(id)
        ON DELETE CASCADE,

    weatherdata JSONB NOT NULL,

    syncedat TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE TABLE public.emailnotifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    recipientemail TEXT NOT NULL,

    recipientname TEXT,

    notificationtype TEXT NOT NULL
        CHECK (
            notificationtype IN (
                'application_received',
                'application_approved',
                'application_rejected'
            )
        ),

    applicationid UUID
        REFERENCES public.ownerapplications(id)
        ON DELETE CASCADE,

    subject TEXT NOT NULL,

    message TEXT NOT NULL,

    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (
            status IN (
                'pending',
                'sent',
                'failed'
            )
        ),

    sentat TIMESTAMPTZ,

    errormessage TEXT,

    createdat TIMESTAMPTZ NOT NULL DEFAULT now()
);


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


DROP TRIGGER IF EXISTS on_auth_user_created
ON auth.users;


CREATE TRIGGER on_auth_user_created
AFTER INSERT
ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.handle_new_user();


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


CREATE TRIGGER protect_profile_role_changes
BEFORE UPDATE OF role
ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION public.prevent_profile_role_self_change();


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


DROP TRIGGER IF EXISTS on_auth_user_updated
ON auth.users;


CREATE TRIGGER on_auth_user_updated
AFTER UPDATE OF email, raw_user_meta_data
ON auth.users
FOR EACH ROW
EXECUTE FUNCTION public.update_profile_from_auth();


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


DROP POLICY IF EXISTS "Beach owners upload beach media" ON storage.objects;
CREATE POLICY "Beach owners upload beach media"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'beach-media'
    AND (
        (storage.foldername(name))[1] = auth.uid()::text
        OR public.is_admin()
    )
    AND CASE
        WHEN (storage.foldername(name))[2] = 'general' THEN true
        WHEN (storage.foldername(name))[2] ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
            THEN public.owns_beach(((storage.foldername(name))[2])::uuid)
        ELSE false
    END
);


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


CREATE TRIGGER trigger_recalculate_beach_rating
AFTER INSERT OR UPDATE OR DELETE
ON public.beachreviews
FOR EACH ROW
EXECUTE FUNCTION public.recalculate_beach_rating();


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


CREATE TRIGGER trigger_application_received_email
AFTER INSERT
ON public.ownerapplications
FOR EACH ROW
EXECUTE FUNCTION public.queue_application_received_email();


CREATE OR REPLACE FUNCTION public.queue_application_status_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN

    IF NEW.status = 'approved'
       AND OLD.status IS DISTINCT FROM 'approved'
    THEN

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
            'application_approved',
            NEW.id,
            'Dagat Ta Bai - Application Approved',
            'Your beach owner application has been approved. You may now access your beach portal.'
        );

    ELSIF NEW.status = 'rejected'
       AND OLD.status IS DISTINCT FROM 'rejected'
    THEN

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
            'application_rejected',
            NEW.id,
            'Dagat Ta Bai - Application Update',
            COALESCE(
                'Your beach owner application was not approved. Reason: '
                || NEW.rejectionreason,
                'Your beach owner application was not approved.'
            )
        );

    END IF;

    RETURN NEW;

END;
$$;


CREATE TRIGGER trigger_application_status_email
AFTER UPDATE OF status
ON public.ownerapplications
FOR EACH ROW
EXECUTE FUNCTION public.queue_application_status_email();


ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.beaches ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.beachinfo ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.openinghours ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.cottages ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.beachactivities ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.facilities ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.equipment ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.rooms ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.fooddrinks ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.beachrules ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.beachreviews ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.platformreviews ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.logindevices ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.usernotifications ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.reviewreports ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.chatmessages ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.ownerapplications ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.externallinks ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.weathersnapshots ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.emailnotifications ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.visitorevents ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON public.logindevices, public.usernotifications FROM anon, authenticated;
GRANT SELECT ON public.logindevices, public.usernotifications TO authenticated;
GRANT UPDATE (readat, response, respondedat) ON public.usernotifications TO authenticated;
GRANT ALL ON public.logindevices, public.usernotifications TO service_role;


CREATE POLICY "Authenticated users can view profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
    auth.uid() = id
    OR public.is_admin()
);


CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (
    auth.uid() = id
)
WITH CHECK (
    auth.uid() = id
);


CREATE POLICY "Admins can manage profiles"
ON public.profiles
FOR ALL
TO authenticated
USING (
    public.is_admin()
)
WITH CHECK (
    public.is_admin()
);


CREATE POLICY "Public can view active beaches"
ON public.beaches
FOR SELECT
USING (
    status = 'active'
    OR auth.uid() = ownerid
    OR public.is_admin()
);


CREATE POLICY "Admins can manage beaches"
ON public.beaches
FOR ALL
TO authenticated
USING (
    public.is_admin()
)
WITH CHECK (
    public.is_admin()
);


CREATE POLICY "Beach managers can update their beach"
ON public.beaches
FOR UPDATE
TO authenticated
USING (
    auth.uid() = ownerid
)
WITH CHECK (
    auth.uid() = ownerid
);


CREATE POLICY "Public can view general information"
ON public.beachinfo
FOR SELECT
USING (true);


CREATE POLICY "Beach managers manage general information"
ON public.beachinfo
FOR ALL
TO authenticated
USING (
    public.owns_beach(beachid)
)
WITH CHECK (
    public.owns_beach(beachid)
);


CREATE POLICY "Public can view opening hours"
ON public.openinghours
FOR SELECT
USING (true);


CREATE POLICY "Beach managers manage opening hours"
ON public.openinghours
FOR ALL
TO authenticated
USING (
    public.owns_beach(beachid)
)
WITH CHECK (
    public.owns_beach(beachid)
);


CREATE POLICY "Public can view cottages"
ON public.cottages
FOR SELECT
USING (true);


CREATE POLICY "Beach managers manage cottages"
ON public.cottages
FOR ALL
TO authenticated
USING (
    public.owns_beach(beachid)
)
WITH CHECK (
    public.owns_beach(beachid)
);


CREATE POLICY "Public can view activities"
ON public.beachactivities
FOR SELECT
USING (true);


CREATE POLICY "Beach managers manage activities"
ON public.beachactivities
FOR ALL
TO authenticated
USING (
    public.owns_beach(beachid)
)
WITH CHECK (
    public.owns_beach(beachid)
);


CREATE POLICY "Public can view facilities"
ON public.facilities
FOR SELECT
USING (true);


CREATE POLICY "Beach managers manage facilities"
ON public.facilities
FOR ALL
TO authenticated
USING (
    public.owns_beach(beachid)
)
WITH CHECK (
    public.owns_beach(beachid)
);


CREATE POLICY "Public can view equipment"
ON public.equipment
FOR SELECT
USING (true);


CREATE POLICY "Beach managers manage equipment"
ON public.equipment
FOR ALL
TO authenticated
USING (
    public.owns_beach(beachid)
)
WITH CHECK (
    public.owns_beach(beachid)
);


CREATE POLICY "Public can view rooms"
ON public.rooms
FOR SELECT
USING (true);


CREATE POLICY "Beach managers manage rooms"
ON public.rooms
FOR ALL
TO authenticated
USING (
    public.owns_beach(beachid)
)
WITH CHECK (
    public.owns_beach(beachid)
);


CREATE POLICY "Public can view food and drinks"
ON public.fooddrinks
FOR SELECT
USING (true);


CREATE POLICY "Beach managers manage food and drinks"
ON public.fooddrinks
FOR ALL
TO authenticated
USING (
    public.owns_beach(beachid)
)
WITH CHECK (
    public.owns_beach(beachid)
);


CREATE POLICY "Public can view beach rules"
ON public.beachrules
FOR SELECT
USING (true);


CREATE POLICY "Beach managers manage beach rules"
ON public.beachrules
FOR ALL
TO authenticated
USING (
    public.owns_beach(beachid)
)
WITH CHECK (
    public.owns_beach(beachid)
);


CREATE POLICY "Public can view beach reviews"
ON public.beachreviews
FOR SELECT
USING (true);


CREATE POLICY "Authenticated users can create beach reviews"
ON public.beachreviews
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = userid
);


CREATE POLICY "Users can update their own beach reviews"
ON public.beachreviews
FOR UPDATE
TO authenticated
USING (
    auth.uid() = userid
)
WITH CHECK (
    auth.uid() = userid
);


CREATE POLICY "Users and admins can delete beach reviews"
ON public.beachreviews
FOR DELETE
TO authenticated
USING (
    auth.uid() = userid
    OR public.is_admin()
);


CREATE POLICY "Public can view platform reviews"
ON public.platformreviews
FOR SELECT
USING (true);


CREATE POLICY "Authenticated users can create platform reviews"
ON public.platformreviews
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = userid
);


CREATE POLICY "Users can update their platform reviews"
ON public.platformreviews
FOR UPDATE
TO authenticated
USING (
    auth.uid() = userid
)
WITH CHECK (
    auth.uid() = userid
);


CREATE POLICY "Users and admins can delete platform reviews"
ON public.platformreviews
FOR DELETE
TO authenticated
USING (
    auth.uid() = userid
    OR public.is_admin()
);


CREATE POLICY "Users can view their login devices"
ON public.logindevices
FOR SELECT
TO authenticated
USING (
    auth.uid() = userid
);


CREATE POLICY "Users can view their notifications"
ON public.usernotifications
FOR SELECT
TO authenticated
USING (
    auth.uid() = userid
);


CREATE POLICY "Users can update their notifications"
ON public.usernotifications
FOR UPDATE
TO authenticated
USING (
    auth.uid() = userid
)
WITH CHECK (
    auth.uid() = userid
);


CREATE POLICY "Anyone can submit owner applications"
ON public.ownerapplications
FOR INSERT
WITH CHECK (
    applicantuserid IS NULL
    OR applicantuserid = auth.uid()
);


CREATE POLICY "Applicants can view their applications"
ON public.ownerapplications
FOR SELECT
TO authenticated
USING (
    applicantuserid = auth.uid()
    OR public.is_admin()
);


CREATE POLICY "Admins can manage owner applications"
ON public.ownerapplications
FOR ALL
TO authenticated
USING (
    public.is_admin()
)
WITH CHECK (
    public.is_admin()
);


CREATE POLICY "Public can view external links"
ON public.externallinks
FOR SELECT
USING (true);


CREATE POLICY "Beach managers manage external links"
ON public.externallinks
FOR ALL
TO authenticated
USING (
    public.owns_beach(beachid)
)
WITH CHECK (
    public.owns_beach(beachid)
);


CREATE POLICY "Public can view weather"
ON public.weathersnapshots
FOR SELECT
USING (true);


CREATE POLICY "Admins manage weather"
ON public.weathersnapshots
FOR ALL
TO authenticated
USING (
    public.is_admin()
)
WITH CHECK (
    public.is_admin()
);


CREATE POLICY "Users can view their email notifications"
ON public.emailnotifications
FOR SELECT
TO authenticated
USING (
    recipientemail = (
        SELECT email
        FROM public.profiles
        WHERE id = auth.uid()
    )
    OR public.is_admin()
);


CREATE INDEX idx_profiles_role
ON public.profiles(role);


CREATE INDEX idx_beaches_owner
ON public.beaches(ownerid);


CREATE INDEX idx_beaches_status
ON public.beaches(status);


CREATE INDEX idx_beaches_coordinates
ON public.beaches(latitude, longitude);


CREATE INDEX idx_beaches_location
ON public.beaches(location);


CREATE INDEX idx_general_information_beach
ON public.beachinfo(beachid);


CREATE INDEX idx_opening_hours_beach
ON public.openinghours(beachid);


CREATE INDEX idx_cottages_beach
ON public.cottages(beachid, displayorder);


CREATE INDEX idx_activities_beach
ON public.beachactivities(beachid, displayorder);


CREATE INDEX idx_facilities_beach
ON public.facilities(beachid, displayorder);


CREATE INDEX idx_equipment_beach
ON public.equipment(beachid, displayorder);


CREATE INDEX idx_rooms_beach
ON public.rooms(beachid, displayorder);


CREATE INDEX idx_food_drinks_beach
ON public.fooddrinks(beachid, displayorder);


CREATE INDEX idx_rules_beach
ON public.beachrules(beachid, rule_type, displayorder);


CREATE INDEX idx_beach_reviews_beach
ON public.beachreviews(beachid, createdat DESC);


CREATE INDEX idx_beach_reviews_user
ON public.beachreviews(userid);


CREATE INDEX idx_platform_reviews_user
ON public.platformreviews(userid);


CREATE INDEX idx_owner_applications_status
ON public.ownerapplications(status);


CREATE INDEX idx_owner_applications_user
ON public.ownerapplications(applicantuserid);


CREATE INDEX idx_email_notifications_status
ON public.emailnotifications(status);


CREATE INDEX idx_email_notifications_application
ON public.emailnotifications(applicationid);
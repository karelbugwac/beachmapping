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
    10485760,
    ARRAY['image/jpeg', 'image/png', 'image/webp']
)
ON CONFLICT (id) DO UPDATE SET
    public = true,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

DROP TABLE IF EXISTS
    public.email_notifications,
    public.platform_reviews,
    public.beach_reviews,
    public.beach_rules,
    public.beach_food_drinks,
    public.beach_rooms,
    public.beach_equipment,
    public.beach_facilities,
    public.beach_activities,
    public.beach_cottages,
    public.beach_opening_hours,
    public.beach_general_information,
    public.beach_external_links,
    public.beach_weather_snapshots,
    public.owner_applications,
    public.beaches,
    public.profiles
CASCADE;


CREATE TABLE public.profiles (
    id UUID PRIMARY KEY
        REFERENCES auth.users(id)
        ON DELETE CASCADE,

    full_name TEXT NOT NULL,

    email TEXT,

    profile_image_url TEXT,

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

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE TABLE public.beaches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    owner_id UUID UNIQUE
        REFERENCES public.profiles(id)
        ON DELETE SET NULL,

    slug TEXT NOT NULL UNIQUE,

    name TEXT NOT NULL,

    description TEXT,

    profile_image_url TEXT,

    cover_image_url TEXT,

    virtual_tour_url TEXT,

    location TEXT NOT NULL,

    latitude NUMERIC(10, 8) NOT NULL,

    longitude NUMERIC(11, 8) NOT NULL,

    contact_phone TEXT,

    contact_email TEXT,

    images JSONB NOT NULL DEFAULT '[]'::jsonb,

    opening_hours TEXT NOT NULL DEFAULT '8:00 AM - 6:00 PM',

    entrance_fee TEXT,

    cottage_fee TEXT,

    rules TEXT,

    status TEXT NOT NULL DEFAULT 'active'
        CHECK (
            status IN (
                'active',
                'inactive',
                'suspended'
            )
        ),

    average_rating NUMERIC(3, 2) NOT NULL DEFAULT 0.00
        CHECK (
            average_rating >= 0
            AND average_rating <= 5
        ),

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE TABLE public.beach_general_information (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    beach_id UUID NOT NULL UNIQUE
        REFERENCES public.beaches(id)
        ON DELETE CASCADE,

    entrance_fee NUMERIC(10, 2),

    child_entrance_fee NUMERIC(10, 2),

    senior_entrance_fee NUMERIC(10, 2),

    entrance_fee_notes TEXT,

    general_information TEXT,

    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE TABLE public.beach_opening_hours (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    beach_id UUID NOT NULL
        REFERENCES public.beaches(id)
        ON DELETE CASCADE,

    day_of_week SMALLINT NOT NULL
        CHECK (
            day_of_week BETWEEN 0 AND 6
        ),

    is_open BOOLEAN NOT NULL DEFAULT true,

    opening_time TIME,

    closing_time TIME,

    UNIQUE (
        beach_id,
        day_of_week
    )
);


CREATE TABLE public.beach_cottages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    beach_id UUID NOT NULL
        REFERENCES public.beaches(id)
        ON DELETE CASCADE,

    name TEXT NOT NULL,

    description TEXT,

    price NUMERIC(10, 2),

    price_unit TEXT NOT NULL DEFAULT 'per day',

    capacity INTEGER
        CHECK (
            capacity IS NULL
            OR capacity > 0
        ),

    images TEXT[] NOT NULL DEFAULT '{}',

    is_available BOOLEAN NOT NULL DEFAULT true,

    display_order INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE TABLE public.beach_activities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    beach_id UUID NOT NULL
        REFERENCES public.beaches(id)
        ON DELETE CASCADE,

    name TEXT NOT NULL,

    description TEXT,

    price NUMERIC(10, 2),

    price_unit TEXT,

    images TEXT[] NOT NULL DEFAULT '{}',

    is_available BOOLEAN NOT NULL DEFAULT true,

    display_order INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE TABLE public.beach_facilities (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    beach_id UUID NOT NULL
        REFERENCES public.beaches(id)
        ON DELETE CASCADE,

    name TEXT NOT NULL,

    description TEXT,

    price NUMERIC(10, 2),

    price_unit TEXT,

    images TEXT[] NOT NULL DEFAULT '{}',

    is_available BOOLEAN NOT NULL DEFAULT true,

    display_order INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE TABLE public.beach_equipment (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    beach_id UUID NOT NULL
        REFERENCES public.beaches(id)
        ON DELETE CASCADE,

    name TEXT NOT NULL,

    description TEXT,

    rental_price NUMERIC(10, 2),

    price_unit TEXT,

    quantity INTEGER
        CHECK (
            quantity IS NULL
            OR quantity >= 0
        ),

    images TEXT[] NOT NULL DEFAULT '{}',

    is_available BOOLEAN NOT NULL DEFAULT true,

    display_order INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE TABLE public.beach_rooms (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    beach_id UUID NOT NULL
        REFERENCES public.beaches(id)
        ON DELETE CASCADE,

    name TEXT NOT NULL,

    description TEXT,

    price NUMERIC(10, 2),

    price_unit TEXT NOT NULL DEFAULT 'per night',

    capacity INTEGER
        CHECK (
            capacity IS NULL
            OR capacity > 0
        ),

    images TEXT[] NOT NULL DEFAULT '{}',

    is_available BOOLEAN NOT NULL DEFAULT true,

    display_order INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE TABLE public.beach_food_drinks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    beach_id UUID NOT NULL
        REFERENCES public.beaches(id)
        ON DELETE CASCADE,

    name TEXT NOT NULL,

    description TEXT,

    category TEXT,

    price NUMERIC(10, 2),

    images TEXT[] NOT NULL DEFAULT '{}',

    is_available BOOLEAN NOT NULL DEFAULT true,

    display_order INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE TABLE public.beach_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    beach_id UUID NOT NULL
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

    display_order INTEGER NOT NULL DEFAULT 0,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE TABLE public.beach_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    beach_id UUID NOT NULL
        REFERENCES public.beaches(id)
        ON DELETE CASCADE,

    user_id UUID NOT NULL
        REFERENCES public.profiles(id)
        ON DELETE CASCADE,

    rating INTEGER NOT NULL
        CHECK (
            rating BETWEEN 1 AND 5
        ),

    comment TEXT NOT NULL,

    photos TEXT[] NOT NULL DEFAULT '{}',

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE TABLE public.platform_reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id UUID
        REFERENCES public.profiles(id)
        ON DELETE SET NULL,

    rating INTEGER NOT NULL
        CHECK (
            rating BETWEEN 1 AND 5
        ),

    comment TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE TABLE public.beach_review_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id UUID NOT NULL REFERENCES public.beach_reviews(id) ON DELETE CASCADE,
    beach_id UUID NOT NULL REFERENCES public.beaches(id) ON DELETE CASCADE,
    reporter_user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'removed', 'dismissed')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    reviewed_at TIMESTAMPTZ
);


CREATE TABLE public.ai_chat_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE TABLE public.owner_applications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    applicant_user_id UUID
        REFERENCES public.profiles(id)
        ON DELETE SET NULL,

    created_user_id UUID
        REFERENCES public.profiles(id)
        ON DELETE SET NULL,

    applicant_full_name TEXT NOT NULL,

    applicant_email TEXT NOT NULL,

    applicant_location TEXT,

    contact_phone TEXT NOT NULL,

    business_name TEXT NOT NULL,

    beach_name TEXT NOT NULL,

    beach_description TEXT,

    beach_location TEXT NOT NULL,

    latitude NUMERIC(10, 8),

    longitude NUMERIC(11, 8),

    business_permit_path TEXT NOT NULL,

    proof_of_ownership_path TEXT NOT NULL,

    profile_image_path TEXT,

    cover_image_path TEXT,

    virtual_tour_url TEXT,

    status TEXT NOT NULL DEFAULT 'pending'
        CHECK (
            status IN (
                'pending',
                'approved',
                'rejected'
            )
        ),

    rejection_reason TEXT,

    reviewed_by UUID
        REFERENCES public.profiles(id)
        ON DELETE SET NULL,

    reviewed_at TIMESTAMPTZ,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE TABLE public.visitor_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    session_id UUID NOT NULL,

    page_key TEXT NOT NULL,

    event_type TEXT NOT NULL CHECK (event_type IN ('platform_visit', 'beach_profile_view')),

    beach_id UUID REFERENCES public.beaches(id) ON DELETE CASCADE,

    visit_date DATE NOT NULL DEFAULT CURRENT_DATE,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT visitor_events_session_page_date_unique UNIQUE (session_id, page_key, visit_date)
);


CREATE TABLE public.beach_external_links (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    beach_id UUID NOT NULL
        REFERENCES public.beaches(id)
        ON DELETE CASCADE,

    label TEXT NOT NULL,

    url TEXT NOT NULL,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE TABLE public.beach_weather_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    beach_id UUID NOT NULL
        REFERENCES public.beaches(id)
        ON DELETE CASCADE,

    weather_data JSONB NOT NULL,

    synced_at TIMESTAMPTZ NOT NULL DEFAULT now()
);


CREATE TABLE public.email_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    recipient_email TEXT NOT NULL,

    recipient_name TEXT,

    notification_type TEXT NOT NULL
        CHECK (
            notification_type IN (
                'application_received',
                'application_approved',
                'application_rejected'
            )
        ),

    application_id UUID
        REFERENCES public.owner_applications(id)
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

    sent_at TIMESTAMPTZ,

    error_message TEXT,

    created_at TIMESTAMPTZ NOT NULL DEFAULT now()
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
        full_name,
        email,
        profile_image_url,
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
        full_name = EXCLUDED.full_name,
        email = EXCLUDED.email,
        profile_image_url = COALESCE(
            EXCLUDED.profile_image_url,
            public.profiles.profile_image_url
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
        updated_at = now();

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
        full_name = COALESCE(
            NEW.raw_user_meta_data->>'full_name',
            NEW.raw_user_meta_data->>'name',
            public.profiles.full_name
        ),

        email = NEW.email,

        profile_image_url = COALESCE(
            NEW.raw_user_meta_data->>'avatar_url',
            NEW.raw_user_meta_data->>'picture',
            public.profiles.profile_image_url
        ),

        location = COALESCE(
            NEW.raw_user_meta_data->>'location',
            public.profiles.location
        ),

        pin = COALESCE(
            NEW.raw_user_meta_data->>'pin',
            public.profiles.pin
        ),

        updated_at = now()

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
            AND public.beaches.owner_id = auth.uid()
        );
$$;


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
            NEW.beach_id,
            OLD.beach_id
        );

    UPDATE public.beaches
    SET
        average_rating = COALESCE(
            (
                SELECT ROUND(
                    AVG(rating)::numeric,
                    2
                )
                FROM public.beach_reviews
                WHERE beach_id = target_beach_id
            ),
            0.00
        ),
        updated_at = now()
    WHERE id = target_beach_id;

    RETURN COALESCE(NEW, OLD);

END;
$$;


CREATE TRIGGER trigger_recalculate_beach_rating
AFTER INSERT OR UPDATE OR DELETE
ON public.beach_reviews
FOR EACH ROW
EXECUTE FUNCTION public.recalculate_beach_rating();


CREATE OR REPLACE FUNCTION public.queue_application_received_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN

    INSERT INTO public.email_notifications (
        recipient_email,
        recipient_name,
        notification_type,
        application_id,
        subject,
        message
    )
    VALUES (
        NEW.applicant_email,
        NEW.applicant_full_name,
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
ON public.owner_applications
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

        INSERT INTO public.email_notifications (
            recipient_email,
            recipient_name,
            notification_type,
            application_id,
            subject,
            message
        )
        VALUES (
            NEW.applicant_email,
            NEW.applicant_full_name,
            'application_approved',
            NEW.id,
            'Dagat Ta Bai - Application Approved',
            'Your beach owner application has been approved. You may now access your beach portal.'
        );

    ELSIF NEW.status = 'rejected'
       AND OLD.status IS DISTINCT FROM 'rejected'
    THEN

        INSERT INTO public.email_notifications (
            recipient_email,
            recipient_name,
            notification_type,
            application_id,
            subject,
            message
        )
        VALUES (
            NEW.applicant_email,
            NEW.applicant_full_name,
            'application_rejected',
            NEW.id,
            'Dagat Ta Bai - Application Update',
            COALESCE(
                'Your beach owner application was not approved. Reason: '
                || NEW.rejection_reason,
                'Your beach owner application was not approved.'
            )
        );

    END IF;

    RETURN NEW;

END;
$$;


CREATE TRIGGER trigger_application_status_email
AFTER UPDATE OF status
ON public.owner_applications
FOR EACH ROW
EXECUTE FUNCTION public.queue_application_status_email();


ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.beaches ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.beach_general_information ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.beach_opening_hours ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.beach_cottages ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.beach_activities ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.beach_facilities ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.beach_equipment ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.beach_rooms ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.beach_food_drinks ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.beach_rules ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.beach_reviews ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.platform_reviews ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.beach_review_reports ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.ai_chat_messages ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.owner_applications ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.beach_external_links ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.beach_weather_snapshots ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.email_notifications ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.visitor_events ENABLE ROW LEVEL SECURITY;


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
    OR auth.uid() = owner_id
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
    auth.uid() = owner_id
)
WITH CHECK (
    auth.uid() = owner_id
);


CREATE POLICY "Public can view general information"
ON public.beach_general_information
FOR SELECT
USING (true);


CREATE POLICY "Beach managers manage general information"
ON public.beach_general_information
FOR ALL
TO authenticated
USING (
    public.owns_beach(beach_id)
)
WITH CHECK (
    public.owns_beach(beach_id)
);


CREATE POLICY "Public can view opening hours"
ON public.beach_opening_hours
FOR SELECT
USING (true);


CREATE POLICY "Beach managers manage opening hours"
ON public.beach_opening_hours
FOR ALL
TO authenticated
USING (
    public.owns_beach(beach_id)
)
WITH CHECK (
    public.owns_beach(beach_id)
);


CREATE POLICY "Public can view cottages"
ON public.beach_cottages
FOR SELECT
USING (true);


CREATE POLICY "Beach managers manage cottages"
ON public.beach_cottages
FOR ALL
TO authenticated
USING (
    public.owns_beach(beach_id)
)
WITH CHECK (
    public.owns_beach(beach_id)
);


CREATE POLICY "Public can view activities"
ON public.beach_activities
FOR SELECT
USING (true);


CREATE POLICY "Beach managers manage activities"
ON public.beach_activities
FOR ALL
TO authenticated
USING (
    public.owns_beach(beach_id)
)
WITH CHECK (
    public.owns_beach(beach_id)
);


CREATE POLICY "Public can view facilities"
ON public.beach_facilities
FOR SELECT
USING (true);


CREATE POLICY "Beach managers manage facilities"
ON public.beach_facilities
FOR ALL
TO authenticated
USING (
    public.owns_beach(beach_id)
)
WITH CHECK (
    public.owns_beach(beach_id)
);


CREATE POLICY "Public can view equipment"
ON public.beach_equipment
FOR SELECT
USING (true);


CREATE POLICY "Beach managers manage equipment"
ON public.beach_equipment
FOR ALL
TO authenticated
USING (
    public.owns_beach(beach_id)
)
WITH CHECK (
    public.owns_beach(beach_id)
);


CREATE POLICY "Public can view rooms"
ON public.beach_rooms
FOR SELECT
USING (true);


CREATE POLICY "Beach managers manage rooms"
ON public.beach_rooms
FOR ALL
TO authenticated
USING (
    public.owns_beach(beach_id)
)
WITH CHECK (
    public.owns_beach(beach_id)
);


CREATE POLICY "Public can view food and drinks"
ON public.beach_food_drinks
FOR SELECT
USING (true);


CREATE POLICY "Beach managers manage food and drinks"
ON public.beach_food_drinks
FOR ALL
TO authenticated
USING (
    public.owns_beach(beach_id)
)
WITH CHECK (
    public.owns_beach(beach_id)
);


CREATE POLICY "Public can view beach rules"
ON public.beach_rules
FOR SELECT
USING (true);


CREATE POLICY "Beach managers manage beach rules"
ON public.beach_rules
FOR ALL
TO authenticated
USING (
    public.owns_beach(beach_id)
)
WITH CHECK (
    public.owns_beach(beach_id)
);


CREATE POLICY "Public can view beach reviews"
ON public.beach_reviews
FOR SELECT
USING (true);


CREATE POLICY "Authenticated users can create beach reviews"
ON public.beach_reviews
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = user_id
);


CREATE POLICY "Users can update their own beach reviews"
ON public.beach_reviews
FOR UPDATE
TO authenticated
USING (
    auth.uid() = user_id
)
WITH CHECK (
    auth.uid() = user_id
);


CREATE POLICY "Users and admins can delete beach reviews"
ON public.beach_reviews
FOR DELETE
TO authenticated
USING (
    auth.uid() = user_id
    OR public.is_admin()
);


CREATE POLICY "Public can view platform reviews"
ON public.platform_reviews
FOR SELECT
USING (true);


CREATE POLICY "Authenticated users can create platform reviews"
ON public.platform_reviews
FOR INSERT
TO authenticated
WITH CHECK (
    auth.uid() = user_id
);


CREATE POLICY "Users can update their platform reviews"
ON public.platform_reviews
FOR UPDATE
TO authenticated
USING (
    auth.uid() = user_id
)
WITH CHECK (
    auth.uid() = user_id
);


CREATE POLICY "Users and admins can delete platform reviews"
ON public.platform_reviews
FOR DELETE
TO authenticated
USING (
    auth.uid() = user_id
    OR public.is_admin()
);


CREATE POLICY "Anyone can submit owner applications"
ON public.owner_applications
FOR INSERT
WITH CHECK (
    applicant_user_id IS NULL
    OR applicant_user_id = auth.uid()
);


CREATE POLICY "Applicants can view their applications"
ON public.owner_applications
FOR SELECT
TO authenticated
USING (
    applicant_user_id = auth.uid()
    OR public.is_admin()
);


CREATE POLICY "Admins can manage owner applications"
ON public.owner_applications
FOR ALL
TO authenticated
USING (
    public.is_admin()
)
WITH CHECK (
    public.is_admin()
);


CREATE POLICY "Public can view external links"
ON public.beach_external_links
FOR SELECT
USING (true);


CREATE POLICY "Beach managers manage external links"
ON public.beach_external_links
FOR ALL
TO authenticated
USING (
    public.owns_beach(beach_id)
)
WITH CHECK (
    public.owns_beach(beach_id)
);


CREATE POLICY "Public can view weather"
ON public.beach_weather_snapshots
FOR SELECT
USING (true);


CREATE POLICY "Admins manage weather"
ON public.beach_weather_snapshots
FOR ALL
TO authenticated
USING (
    public.is_admin()
)
WITH CHECK (
    public.is_admin()
);


CREATE POLICY "Users can view their email notifications"
ON public.email_notifications
FOR SELECT
TO authenticated
USING (
    recipient_email = (
        SELECT email
        FROM public.profiles
        WHERE id = auth.uid()
    )
    OR public.is_admin()
);


CREATE INDEX idx_profiles_role
ON public.profiles(role);


CREATE INDEX idx_beaches_owner
ON public.beaches(owner_id);


CREATE INDEX idx_beaches_status
ON public.beaches(status);


CREATE INDEX idx_beaches_coordinates
ON public.beaches(latitude, longitude);


CREATE INDEX idx_beaches_location
ON public.beaches(location);


CREATE INDEX idx_general_information_beach
ON public.beach_general_information(beach_id);


CREATE INDEX idx_opening_hours_beach
ON public.beach_opening_hours(beach_id);


CREATE INDEX idx_cottages_beach
ON public.beach_cottages(beach_id, display_order);


CREATE INDEX idx_activities_beach
ON public.beach_activities(beach_id, display_order);


CREATE INDEX idx_facilities_beach
ON public.beach_facilities(beach_id, display_order);


CREATE INDEX idx_equipment_beach
ON public.beach_equipment(beach_id, display_order);


CREATE INDEX idx_rooms_beach
ON public.beach_rooms(beach_id, display_order);


CREATE INDEX idx_food_drinks_beach
ON public.beach_food_drinks(beach_id, display_order);


CREATE INDEX idx_rules_beach
ON public.beach_rules(beach_id, rule_type, display_order);


CREATE INDEX idx_beach_reviews_beach
ON public.beach_reviews(beach_id, created_at DESC);


CREATE INDEX idx_beach_reviews_user
ON public.beach_reviews(user_id);


CREATE INDEX idx_platform_reviews_user
ON public.platform_reviews(user_id);


CREATE INDEX idx_owner_applications_status
ON public.owner_applications(status);


CREATE INDEX idx_owner_applications_user
ON public.owner_applications(applicant_user_id);


CREATE INDEX idx_email_notifications_status
ON public.email_notifications(status);


CREATE INDEX idx_email_notifications_application
ON public.email_notifications(application_id);
-- Optional dedicated table for Beach Coordinates & Map Location Requests
-- If this table is created, Dagat Ta Bai will automatically use it;
-- otherwise it seamlessly falls back to beach_general_information.

CREATE TABLE IF NOT EXISTS public.beach_coordinate_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    beach_id UUID NOT NULL REFERENCES public.beaches(id) ON DELETE CASCADE,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    requested_latitude NUMERIC(10, 8) NOT NULL,
    requested_longitude NUMERIC(11, 8) NOT NULL,
    requested_location TEXT NOT NULL,
    requester_note TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_beach_coordinate_requests_beach_id ON public.beach_coordinate_requests(beach_id);
CREATE INDEX IF NOT EXISTS idx_beach_coordinate_requests_status ON public.beach_coordinate_requests(status);

ALTER TABLE public.beach_coordinate_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owners can view own coordinate requests"
ON public.beach_coordinate_requests
FOR SELECT
TO authenticated
USING (
    owner_id = auth.uid()
    OR EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

CREATE POLICY "Admins can update coordinate requests"
ON public.beach_coordinate_requests
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

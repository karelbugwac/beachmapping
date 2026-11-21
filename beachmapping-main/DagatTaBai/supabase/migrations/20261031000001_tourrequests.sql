-- Optional dedicated table for Beach 360 Virtual Tour Requests
-- If this table is created, Dagat Ta Bai will automatically use it;
-- otherwise it seamlessly falls back to beach_general_information.

CREATE TABLE IF NOT EXISTS public.beach_tour_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    beach_id UUID NOT NULL REFERENCES public.beaches(id) ON DELETE CASCADE,
    owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    requested_tour_url TEXT NOT NULL,
    requester_note TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    rejection_reason TEXT,
    reviewed_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_beach_tour_requests_beach_id ON public.beach_tour_requests(beach_id);
CREATE INDEX IF NOT EXISTS idx_beach_tour_requests_status ON public.beach_tour_requests(status);

ALTER TABLE public.beach_tour_requests ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view tour requests for beaches they own
CREATE POLICY "Owners can view own tour requests"
ON public.beach_tour_requests
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

-- Allow admins to update tour requests
CREATE POLICY "Admins can update tour requests"
ON public.beach_tour_requests
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles
        WHERE profiles.id = auth.uid()
        AND profiles.role = 'admin'
    )
);

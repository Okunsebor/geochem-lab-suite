-- 0002_sample_enhancements.sql
-- GeoChem LIMS Sample Enhancements for Verification, Rejection & Document Attachments

-- 1. Add fields to public.samples to track physical verification and rejection states
ALTER TABLE public.samples ADD COLUMN IF NOT EXISTS acceptance_status VARCHAR(50) DEFAULT 'Pending';
ALTER TABLE public.samples ADD COLUMN IF NOT EXISTS rejection_reason TEXT;
ALTER TABLE public.samples ADD COLUMN IF NOT EXISTS verification_notes TEXT;

-- 2. Create sample_attachments table
CREATE TABLE IF NOT EXISTS public.sample_attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sample_id UUID NOT NULL REFERENCES public.samples(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    file_path TEXT NOT NULL,
    size_bytes BIGINT,
    uploaded_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Enable RLS on sample_attachments
ALTER TABLE public.sample_attachments ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for sample_attachments
CREATE POLICY "Customers view org sample attachments"
ON public.sample_attachments FOR SELECT
USING (sample_id IN (
    SELECT id FROM public.samples 
    WHERE project_id IN (
        SELECT id FROM public.projects 
        WHERE organization_id = public.current_user_org_id()
    )
));

CREATE POLICY "Lab staff view all attachments"
ON public.sample_attachments FOR SELECT
USING (public.is_lab_coordinator());

CREATE POLICY "Lab staff manage sample attachments"
ON public.sample_attachments FOR ALL
USING (public.is_lab_coordinator());

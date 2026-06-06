DROP POLICY IF EXISTS "Customers view org samples" ON public.samples;
DROP POLICY IF EXISTS "Lab staff view all samples" ON public.samples;
DROP POLICY IF EXISTS "Lab staff can insert/update samples" ON public.samples;
DROP POLICY IF EXISTS "Customers view org sample notes" ON public.sample_notes;
DROP POLICY IF EXISTS "Lab staff manage sample notes" ON public.sample_notes;
DROP POLICY IF EXISTS "Customers view org custody logs" ON public.custody_logs;
DROP POLICY IF EXISTS "Lab staff manage custody logs" ON public.custody_logs;
DROP POLICY IF EXISTS "Customers view passed/completed analytical results" ON public.analytical_results;
DROP POLICY IF EXISTS "Lab staff view and manage analytical results" ON public.analytical_results;
DROP POLICY IF EXISTS "Customers view org sample attachments" ON public.sample_attachments;
DROP POLICY IF EXISTS "Lab staff view all attachments" ON public.sample_attachments;
DROP POLICY IF EXISTS "Lab staff manage sample attachments" ON public.sample_attachments;
DROP POLICY IF EXISTS "lab_manage_preparation_jobs" ON public.preparation_jobs;
DROP POLICY IF EXISTS "lab_manage_preparation_steps" ON public.preparation_steps;
DROP POLICY IF EXISTS "lab_manage_analytical_runs" ON public.analytical_runs;
DROP POLICY IF EXISTS "lab_manage_qa_flags" ON public.qa_flags;
DROP POLICY IF EXISTS "reports_select" ON public.reports;
DROP POLICY IF EXISTS "reports_insert" ON public.reports;
DROP POLICY IF EXISTS "reports_update" ON public.reports;
DROP POLICY IF EXISTS "reports_delete" ON public.reports;
DROP POLICY IF EXISTS "lab_manage_reports" ON public.reports;
DROP POLICY IF EXISTS "customer_read_delivered_reports" ON public.reports;
DROP POLICY IF EXISTS "reports_select" ON public.reports;
DROP POLICY IF EXISTS "reports_insert" ON public.reports;
DROP POLICY IF EXISTS "reports_update" ON public.reports;
DROP POLICY IF EXISTS "reports_delete" ON public.reports;
DROP POLICY IF EXISTS "report_logs_select" ON public.report_logs;
DROP POLICY IF EXISTS "report_logs_insert" ON public.report_logs;
DROP POLICY IF EXISTS "report_logs_update" ON public.report_logs;
DROP POLICY IF EXISTS "report_logs_delete" ON public.report_logs;
DROP POLICY IF EXISTS "lab_manage_report_logs" ON public.report_logs;
DROP POLICY IF EXISTS "report_logs_select" ON public.report_logs;
DROP POLICY IF EXISTS "report_logs_insert" ON public.report_logs;
DROP POLICY IF EXISTS "report_logs_update" ON public.report_logs;
DROP POLICY IF EXISTS "report_logs_delete" ON public.report_logs;
DROP POLICY IF EXISTS "sample_logs_select" ON public.sample_logs;
DROP POLICY IF EXISTS "sample_logs_insert" ON public.sample_logs;
DROP POLICY IF EXISTS "sample_logs_update" ON public.sample_logs;
DROP POLICY IF EXISTS "sample_logs_delete" ON public.sample_logs;
DROP POLICY IF EXISTS "tracking_updates_select" ON public.tracking_updates;
DROP POLICY IF EXISTS "tracking_updates_insert" ON public.tracking_updates;
DROP POLICY IF EXISTS "tracking_updates_update" ON public.tracking_updates;
DROP POLICY IF EXISTS "tracking_updates_delete" ON public.tracking_updates;



-- 0013_align_schema_with_ui.sql
-- Align the strict relational schema with the UI prototypes string-based ID and missing fields.
-- Enables real-time subscriptions for the UI's admin dashboard.

-- 1. Drop foreign key constraints that reference samples.id
ALTER TABLE public.sample_notes DROP CONSTRAINT IF EXISTS sample_notes_sample_id_fkey;
ALTER TABLE public.custody_logs DROP CONSTRAINT IF EXISTS custody_logs_sample_id_fkey;
ALTER TABLE public.analytical_results DROP CONSTRAINT IF EXISTS analytical_results_sample_id_fkey;
ALTER TABLE public.sample_attachments DROP CONSTRAINT IF EXISTS sample_attachments_sample_id_fkey;
ALTER TABLE public.preparation_jobs DROP CONSTRAINT IF EXISTS preparation_jobs_sample_id_fkey;
ALTER TABLE public.preparation_steps DROP CONSTRAINT IF EXISTS preparation_steps_sample_id_fkey;
ALTER TABLE public.analytical_runs DROP CONSTRAINT IF EXISTS analytical_runs_sample_id_fkey;
ALTER TABLE public.qa_flags DROP CONSTRAINT IF EXISTS qa_flags_sample_id_fkey;
ALTER TABLE public.reports DROP CONSTRAINT IF EXISTS reports_sample_id_fkey;


ALTER TABLE public.sample_logs DROP CONSTRAINT IF EXISTS sample_logs_sample_id_fkey;
ALTER TABLE public.tracking_updates DROP CONSTRAINT IF EXISTS tracking_updates_sample_id_fkey;

-- 2. Alter primary key type for samples
ALTER TABLE public.samples ALTER COLUMN id DROP DEFAULT;
ALTER TABLE public.samples ALTER COLUMN id TYPE VARCHAR(100);

-- 3. Alter foreign key types in dependent tables
ALTER TABLE public.sample_notes ALTER COLUMN sample_id TYPE VARCHAR(100);
ALTER TABLE public.custody_logs ALTER COLUMN sample_id TYPE VARCHAR(100);
ALTER TABLE public.analytical_results ALTER COLUMN sample_id TYPE VARCHAR(100);
ALTER TABLE public.sample_attachments ALTER COLUMN sample_id TYPE VARCHAR(100);
ALTER TABLE public.preparation_jobs ALTER COLUMN sample_id TYPE VARCHAR(100);
ALTER TABLE public.preparation_steps ALTER COLUMN sample_id TYPE VARCHAR(100);
ALTER TABLE public.analytical_runs ALTER COLUMN sample_id TYPE VARCHAR(100);
ALTER TABLE public.qa_flags ALTER COLUMN sample_id TYPE VARCHAR(100);
ALTER TABLE public.reports ALTER COLUMN sample_id TYPE VARCHAR(100);


ALTER TABLE public.sample_logs ALTER COLUMN sample_id TYPE VARCHAR(100);
ALTER TABLE public.tracking_updates ALTER COLUMN sample_id TYPE VARCHAR(100);

-- 4. Re-add foreign key constraints
ALTER TABLE public.sample_notes ADD CONSTRAINT sample_notes_sample_id_fkey FOREIGN KEY (sample_id) REFERENCES public.samples(id) ON DELETE CASCADE;
ALTER TABLE public.custody_logs ADD CONSTRAINT custody_logs_sample_id_fkey FOREIGN KEY (sample_id) REFERENCES public.samples(id) ON DELETE CASCADE;
ALTER TABLE public.analytical_results ADD CONSTRAINT analytical_results_sample_id_fkey FOREIGN KEY (sample_id) REFERENCES public.samples(id) ON DELETE CASCADE;
ALTER TABLE public.sample_attachments ADD CONSTRAINT sample_attachments_sample_id_fkey FOREIGN KEY (sample_id) REFERENCES public.samples(id) ON DELETE CASCADE;
ALTER TABLE public.preparation_jobs ADD CONSTRAINT preparation_jobs_sample_id_fkey FOREIGN KEY (sample_id) REFERENCES public.samples(id) ON DELETE CASCADE;
ALTER TABLE public.preparation_steps ADD CONSTRAINT preparation_steps_sample_id_fkey FOREIGN KEY (sample_id) REFERENCES public.samples(id) ON DELETE CASCADE;
ALTER TABLE public.analytical_runs ADD CONSTRAINT analytical_runs_sample_id_fkey FOREIGN KEY (sample_id) REFERENCES public.samples(id) ON DELETE CASCADE;
ALTER TABLE public.qa_flags ADD CONSTRAINT qa_flags_sample_id_fkey FOREIGN KEY (sample_id) REFERENCES public.samples(id) ON DELETE CASCADE;
ALTER TABLE public.reports ADD CONSTRAINT reports_sample_id_fkey FOREIGN KEY (sample_id) REFERENCES public.samples(id) ON DELETE CASCADE;


ALTER TABLE public.sample_logs ADD CONSTRAINT sample_logs_sample_id_fkey FOREIGN KEY (sample_id) REFERENCES public.samples(id) ON DELETE CASCADE;
ALTER TABLE public.tracking_updates ADD CONSTRAINT tracking_updates_sample_id_fkey FOREIGN KEY (sample_id) REFERENCES public.samples(id) ON DELETE CASCADE;

-- 5. Add missing columns to samples that the UI inserts/selects
ALTER TABLE public.samples ADD COLUMN IF NOT EXISTS client_name VARCHAR(255);
ALTER TABLE public.samples ADD COLUMN IF NOT EXISTS project_name VARCHAR(255);
ALTER TABLE public.samples ADD COLUMN IF NOT EXISTS client_org_id VARCHAR(100);
ALTER TABLE public.samples ADD COLUMN IF NOT EXISTS technician VARCHAR(255);
ALTER TABLE public.samples ADD COLUMN IF NOT EXISTS received_from VARCHAR(255);
ALTER TABLE public.samples ADD COLUMN IF NOT EXISTS registered_by_user_id VARCHAR(100);

-- 6. Add real-time publication support to tables the UI subscribes to
-- Wrap in DO block to handle errors gracefully if already added
DO $$ 
BEGIN 
  ALTER PUBLICATION supabase_realtime ADD TABLE public.samples, public.reports, public.report_logs, public.tracking_updates;
EXCEPTION WHEN duplicate_object THEN 
  NULL;
END $$;



CREATE POLICY "Customers view org samples"
  ON public.samples FOR SELECT
  USING (project_id IN (SELECT id FROM public.projects WHERE organization_id = public.current_user_org_id()));

CREATE POLICY "Lab staff view all samples"
  ON public.samples FOR SELECT
  USING (public.is_lab_coordinator());

CREATE POLICY "Lab staff can insert/update samples"
  ON public.samples FOR ALL
  USING (public.is_lab_coordinator());

CREATE POLICY "Customers view org sample notes"
  ON public.sample_notes FOR SELECT
  USING (sample_id IN (SELECT id FROM public.samples WHERE project_id IN (SELECT id FROM public.projects WHERE organization_id = public.current_user_org_id())));

CREATE POLICY "Lab staff manage sample notes"
  ON public.sample_notes FOR ALL
  USING (public.is_lab_coordinator());

CREATE POLICY "Customers view org custody logs"
  ON public.custody_logs FOR SELECT
  USING (sample_id IN (SELECT id FROM public.samples WHERE project_id IN (SELECT id FROM public.projects WHERE organization_id = public.current_user_org_id())));

CREATE POLICY "Lab staff manage custody logs"
  ON public.custody_logs FOR ALL
  USING (public.is_lab_coordinator());

CREATE POLICY "Customers view passed/completed analytical results"
  ON public.analytical_results FOR SELECT
  USING (qa_status = 'Passed' AND sample_id IN (SELECT id FROM public.samples WHERE project_id IN (SELECT id FROM public.projects WHERE organization_id = public.current_user_org_id())));

CREATE POLICY "Lab staff view and manage analytical results"
  ON public.analytical_results FOR ALL
  USING (public.is_lab_coordinator());

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

CREATE POLICY "lab_manage_preparation_jobs"
ON public.preparation_jobs
FOR ALL
USING (public.is_lab_coordinator())
WITH CHECK (public.is_lab_coordinator());

CREATE POLICY "lab_manage_preparation_steps"
ON public.preparation_steps
FOR ALL
USING (public.is_lab_coordinator())
WITH CHECK (public.is_lab_coordinator());

CREATE POLICY "lab_manage_analytical_runs"
ON public.analytical_runs
FOR ALL
USING (public.is_lab_coordinator())
WITH CHECK (public.is_lab_coordinator());

CREATE POLICY "lab_manage_qa_flags"
ON public.qa_flags
FOR ALL
USING (public.is_lab_coordinator())
WITH CHECK (public.is_lab_coordinator());

CREATE POLICY "reports_select" ON public.reports FOR SELECT USING (
  (SELECT role FROM public.users WHERE users.id = auth.uid()) IN ('admin','manager','technician')
  OR
  (client_org_id = (SELECT organization_id::text FROM public.users WHERE users.id = auth.uid()))
);

CREATE POLICY "reports_insert" ON public.reports FOR INSERT WITH CHECK ((SELECT role FROM public.users WHERE users.id = auth.uid()) IN ('admin','manager','technician'));

CREATE POLICY "reports_update" ON public.reports FOR UPDATE USING ((SELECT role FROM public.users WHERE users.id = auth.uid()) IN ('admin','manager','technician'));

CREATE POLICY "reports_delete" ON public.reports FOR DELETE USING ((SELECT role FROM public.users WHERE users.id = auth.uid()) IN ('admin','manager','technician'));

CREATE POLICY "lab_manage_reports"
ON public.reports
FOR ALL
USING (public.is_lab_coordinator())
WITH CHECK (public.is_lab_coordinator());

CREATE POLICY "customer_read_delivered_reports"
ON public.reports
FOR SELECT
USING (
  public.current_user_role() = 'customer'
  AND status IN ('Delivered')
  AND sample_id IN (
    SELECT s.id
    FROM public.samples s
    JOIN public.projects p ON p.id = s.project_id
    WHERE p.organization_id = public.current_user_org_id()
  )
);


CREATE POLICY "report_logs_select" ON public.report_logs FOR SELECT USING (
  (SELECT role FROM public.users WHERE users.id = auth.uid()) IN ('admin','manager','technician')
  OR
  (report_id IN (SELECT id FROM public.reports WHERE client_org_id = (SELECT organization_id::text FROM public.users WHERE users.id = auth.uid())))
);

CREATE POLICY "report_logs_insert" ON public.report_logs FOR INSERT WITH CHECK ((SELECT role FROM public.users WHERE users.id = auth.uid()) IN ('admin','manager','technician'));

CREATE POLICY "report_logs_update" ON public.report_logs FOR UPDATE USING ((SELECT role FROM public.users WHERE users.id = auth.uid()) IN ('admin','manager','technician'));

CREATE POLICY "report_logs_delete" ON public.report_logs FOR DELETE USING ((SELECT role FROM public.users WHERE users.id = auth.uid()) IN ('admin','manager','technician'));

CREATE POLICY "lab_manage_report_logs"
ON public.report_logs
FOR ALL
USING (public.is_lab_coordinator())
WITH CHECK (public.is_lab_coordinator());


CREATE POLICY "sample_logs_select"
    ON public.sample_logs FOR SELECT TO authenticated
    USING (
      public.is_lab_coordinator()
      OR sample_id IN (
        SELECT s.id FROM public.samples s
        JOIN public.projects p ON s.project_id = p.id
        WHERE p.organization_id = public.current_user_org_id()
      )
    );

CREATE POLICY "sample_logs_insert"
    ON public.sample_logs FOR INSERT TO authenticated
    WITH CHECK (public.is_lab_coordinator());

CREATE POLICY "sample_logs_update"
    ON public.sample_logs FOR UPDATE TO authenticated
    USING (public.is_lab_coordinator());

CREATE POLICY "sample_logs_delete"
    ON public.sample_logs FOR DELETE TO authenticated
    USING (public.is_lab_coordinator());

CREATE POLICY "tracking_updates_select"
    ON public.tracking_updates FOR SELECT TO authenticated
    USING (
      public.is_lab_coordinator()
      OR sample_id IN (
        SELECT s.id FROM public.samples s
        JOIN public.projects p ON s.project_id = p.id
        WHERE p.organization_id = public.current_user_org_id()
      )
    );

CREATE POLICY "tracking_updates_insert"
    ON public.tracking_updates FOR INSERT TO authenticated
    WITH CHECK (public.is_lab_coordinator());

CREATE POLICY "tracking_updates_update"
    ON public.tracking_updates FOR UPDATE TO authenticated
    USING (public.is_lab_coordinator());

CREATE POLICY "tracking_updates_delete"
    ON public.tracking_updates FOR DELETE TO authenticated
    USING (public.is_lab_coordinator());


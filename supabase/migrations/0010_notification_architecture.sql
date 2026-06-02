-- 0010_notification_architecture.sql
-- WBS Phase 8: automation and notifications

ALTER TABLE public.notifications
  ADD COLUMN IF NOT EXISTS event_type TEXT DEFAULT 'system',
  ADD COLUMN IF NOT EXISTS audience_role TEXT,
  ADD COLUMN IF NOT EXISTS channel TEXT NOT NULL DEFAULT 'in-app',
  ADD COLUMN IF NOT EXISTS body TEXT,
  ADD COLUMN IF NOT EXISTS read_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS metadata JSONB NOT NULL DEFAULT '{}'::jsonb;

CREATE TABLE IF NOT EXISTS public.notification_emails (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  notification_id BIGINT REFERENCES public.notifications(id) ON DELETE SET NULL,
  recipient_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  recipient_email TEXT NOT NULL,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  attempts INT NOT NULL DEFAULT 0,
  sent_at TIMESTAMPTZ,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notifications_target_user_created
  ON public.notifications(target_user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_role_created
  ON public.notifications(audience_role, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notifications_read
  ON public.notifications(is_read, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_notification_emails_status
  ON public.notification_emails(status, created_at DESC);

ALTER TABLE public.notification_emails ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  CREATE POLICY "notification_emails_admin_read"
    ON public.notification_emails FOR SELECT
    USING (public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "notification_emails_lab_insert"
    ON public.notification_emails FOR INSERT
    WITH CHECK (public.is_lab_coordinator() OR public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "notifications_self_or_role_read"
    ON public.notifications FOR SELECT
    USING (
      target_user_id = auth.uid()
      OR (audience_role IS NOT NULL AND audience_role = public.current_user_role()::text)
      OR public.is_admin()
    );
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "notifications_self_update_read_state"
    ON public.notifications FOR UPDATE
    USING (target_user_id = auth.uid() OR public.is_admin())
    WITH CHECK (target_user_id = auth.uid() OR public.is_admin());
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
  CREATE POLICY "notifications_system_insert"
    ON public.notifications FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE OR REPLACE FUNCTION public.gcs_enqueue_email_for_notification(
  p_notification_id BIGINT,
  p_recipient_user_id UUID,
  p_subject TEXT,
  p_body TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_email TEXT;
BEGIN
  SELECT au.email INTO v_email
  FROM auth.users au
  WHERE au.id = p_recipient_user_id;

  IF v_email IS NULL THEN
    RETURN;
  END IF;

  INSERT INTO public.notification_emails (
    notification_id,
    recipient_user_id,
    recipient_email,
    subject,
    body,
    status
  ) VALUES (
    p_notification_id,
    p_recipient_user_id,
    v_email,
    p_subject,
    p_body,
    'queued'
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.gcs_insert_notification(
  p_target_user_id UUID,
  p_title TEXT,
  p_kind TEXT,
  p_event_type TEXT,
  p_audience_role TEXT DEFAULT NULL,
  p_body TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb,
  p_send_email BOOLEAN DEFAULT FALSE
)
RETURNS BIGINT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_id BIGINT;
BEGIN
  INSERT INTO public.notifications (
    target_user_id,
    title,
    kind,
    is_read,
    event_type,
    audience_role,
    channel,
    body,
    metadata
  ) VALUES (
    p_target_user_id,
    p_title,
    COALESCE(p_kind, 'info'),
    false,
    p_event_type,
    p_audience_role,
    'in-app',
    p_body,
    COALESCE(p_metadata, '{}'::jsonb)
  )
  RETURNING id INTO v_id;

  IF p_send_email THEN
    PERFORM public.gcs_enqueue_email_for_notification(
      v_id,
      p_target_user_id,
      p_title,
      COALESCE(p_body, p_title)
    );
  END IF;

  RETURN v_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.gcs_notify_users_for_tracking_event()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_sample_org UUID;
  v_title TEXT;
  v_body TEXT;
  rec RECORD;
BEGIN
  IF NEW.event_label NOT IN (
    'Sample Received',
    'Sample Verified',
    'Sample Rejected',
    'Preparation Started',
    'Analysis Started',
    'QA/QC Failed',
    'Report Generated',
    'Report Ready',
    'Report Released'
  ) THEN
    RETURN NEW;
  END IF;

  SELECT p.organization_id
  INTO v_sample_org
  FROM public.samples s
  JOIN public.projects p ON p.id = s.project_id
  WHERE s.id::text = NEW.sample_id
  LIMIT 1;

  v_title := format('%s • %s', NEW.event_label, NEW.sample_id);
  v_body := COALESCE(NEW.summary, format('Workflow event: %s', NEW.event_label));

  -- Customer: email + in-app
  FOR rec IN
    SELECT u.id
    FROM public.users u
    WHERE u.organization_id = v_sample_org
      AND u.role = 'customer'
  LOOP
    PERFORM public.gcs_insert_notification(
      rec.id,
      v_title,
      CASE WHEN NEW.event_label = 'QA/QC Failed' THEN 'alert' ELSE 'info' END,
      NEW.event_type,
      'customer',
      v_body,
      jsonb_build_object('sample_id', NEW.sample_id, 'event_label', NEW.event_label),
      TRUE
    );
  END LOOP;

  -- Lab Coordinator: workflow alerts + assignments
  FOR rec IN
    SELECT u.id
    FROM public.users u
    WHERE u.role IN ('manager', 'technician')
  LOOP
    PERFORM public.gcs_insert_notification(
      rec.id,
      v_title,
      CASE
        WHEN NEW.event_label IN ('QA/QC Failed', 'Sample Rejected') THEN 'alert'
        ELSE 'info'
      END,
      NEW.event_type,
      'manager',
      v_body,
      jsonb_build_object('sample_id', NEW.sample_id, 'event_label', NEW.event_label, 'channel', 'workflow-alert'),
      FALSE
    );
  END LOOP;

  -- Admin: approvals + security alerts
  FOR rec IN
    SELECT u.id
    FROM public.users u
    WHERE u.role = 'admin'
  LOOP
    PERFORM public.gcs_insert_notification(
      rec.id,
      v_title,
      CASE
        WHEN NEW.event_label IN ('QA/QC Failed', 'Sample Rejected') THEN 'alert'
        WHEN NEW.event_label IN ('Report Ready', 'Report Generated') THEN 'approval'
        ELSE 'info'
      END,
      NEW.event_type,
      'admin',
      v_body,
      jsonb_build_object('sample_id', NEW.sample_id, 'event_label', NEW.event_label),
      FALSE
    );
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_gcs_tracking_notification_fanout ON public.tracking_updates;
CREATE TRIGGER trg_gcs_tracking_notification_fanout
  AFTER INSERT ON public.tracking_updates
  FOR EACH ROW
  EXECUTE FUNCTION public.gcs_notify_users_for_tracking_event();

CREATE OR REPLACE FUNCTION public.gcs_notify_account_approved()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM public.gcs_insert_notification(
      NEW.id,
      'Account Approved',
      'approval',
      'account',
      NEW.role::text,
      'Your account has been provisioned. Access to GeoChem Suite is active.',
      jsonb_build_object('user_id', NEW.id),
      TRUE
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_gcs_account_approved_notify ON public.users;
CREATE TRIGGER trg_gcs_account_approved_notify
  AFTER INSERT ON public.users
  FOR EACH ROW
  EXECUTE FUNCTION public.gcs_notify_account_approved();

CREATE OR REPLACE FUNCTION public.gcs_notify_admin_security_events()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  rec RECORD;
  v_title TEXT;
BEGIN
  IF NEW.event_type NOT IN ('role_changed', 'user_deleted') THEN
    RETURN NEW;
  END IF;

  v_title := CASE
    WHEN NEW.event_type = 'role_changed' THEN 'Security Alert • Role Changed'
    ELSE 'Security Alert • User Deleted'
  END;

  FOR rec IN SELECT u.id FROM public.users u WHERE u.role = 'admin' LOOP
    PERFORM public.gcs_insert_notification(
      rec.id,
      v_title,
      'alert',
      'security',
      'admin',
      'Administrative security-sensitive action recorded in auth audit events.',
      jsonb_build_object('audit_event_id', NEW.id, 'event_type', NEW.event_type),
      FALSE
    );
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_gcs_auth_security_notify ON public.auth_audit_events;
CREATE TRIGGER trg_gcs_auth_security_notify
  AFTER INSERT ON public.auth_audit_events
  FOR EACH ROW
  EXECUTE FUNCTION public.gcs_notify_admin_security_events();

ALTER TABLE public.notifications REPLICA IDENTITY FULL;
ALTER TABLE public.notification_emails REPLICA IDENTITY FULL;

DO $$
BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;
EXCEPTION
  WHEN duplicate_object THEN NULL;
  WHEN undefined_object THEN NULL;
END $$;

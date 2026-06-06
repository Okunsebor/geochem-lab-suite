-- 0014_add_priority_enum_values.sql

-- The UI uses Priority values: Low, Normal, High, Rush
-- The DB enum priority_level only had: Standard, Rush, Urgent

ALTER TYPE public.priority_level ADD VALUE IF NOT EXISTS 'Low';
ALTER TYPE public.priority_level ADD VALUE IF NOT EXISTS 'Normal';
ALTER TYPE public.priority_level ADD VALUE IF NOT EXISTS 'High';

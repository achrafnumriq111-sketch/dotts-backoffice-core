-- =====================================================================
-- Dotts Super-Admin support
-- =====================================================================

-- Table of Dotts platform administrators (not org owners — the SaaS operator).
CREATE TABLE IF NOT EXISTS public.super_admins (
  user_id  uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  note     text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Only super-admins can see the table; nobody can self-insert.
ALTER TABLE public.super_admins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "super_admins: read own row"
ON public.super_admins FOR SELECT TO authenticated
USING (user_id = auth.uid());

-- is_dotts_admin() — used by storage policies + frontend guard
CREATE OR REPLACE FUNCTION public.is_dotts_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.super_admins WHERE user_id = auth.uid()
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_dotts_admin() TO authenticated;

-- =====================================================================
-- Convenience view: orgs with subscription + invoice summary
-- (used by admin-dashboard edge function via service role — no RLS needed there)
-- =====================================================================
-- No view needed; edge function queries directly with service role.

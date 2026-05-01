
-- =====================================================================
-- SECURITY FIX 1: Restrict contracts bucket to owner/admin/manager only
-- =====================================================================

-- Helper function: orgs where caller has elevated role
CREATE OR REPLACE FUNCTION public.user_admin_org_ids()
RETURNS TABLE(org_id uuid)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT om.org_id
  FROM public.org_members om
  WHERE om.user_id = auth.uid()
    AND om.role IN ('owner', 'admin', 'manager');
$$;

-- Drop old overly-permissive policies
DROP POLICY IF EXISTS "contracts_select" ON storage.objects;
DROP POLICY IF EXISTS "contracts_insert" ON storage.objects;
DROP POLICY IF EXISTS "contracts_update" ON storage.objects;
DROP POLICY IF EXISTS "contracts_delete" ON storage.objects;

-- Recreate with role gating
CREATE POLICY "contracts_select" ON storage.objects
FOR SELECT TO authenticated
USING (
  bucket_id = 'contracts'
  AND (
    ((storage.foldername(name))[1])::uuid IN (SELECT org_id FROM public.user_admin_org_ids())
    OR public.is_dotts_admin()
  )
);

CREATE POLICY "contracts_insert" ON storage.objects
FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'contracts'
  AND ((storage.foldername(name))[1])::uuid IN (SELECT org_id FROM public.user_admin_org_ids())
  AND NOT public.org_is_locked(((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "contracts_update" ON storage.objects
FOR UPDATE TO authenticated
USING (
  bucket_id = 'contracts'
  AND ((storage.foldername(name))[1])::uuid IN (SELECT org_id FROM public.user_admin_org_ids())
  AND NOT public.org_is_locked(((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "contracts_delete" ON storage.objects
FOR DELETE TO authenticated
USING (
  bucket_id = 'contracts'
  AND ((storage.foldername(name))[1])::uuid IN (SELECT org_id FROM public.user_admin_org_ids())
  AND NOT public.org_is_locked(((storage.foldername(name))[1])::uuid)
);

-- =====================================================================
-- SECURITY FIX 2: Prevent privilege escalation via org_members self-insert
-- =====================================================================
-- The permissive policies allowed any authenticated user to insert themselves
-- into ANY org with ANY role. Org creation already happens via the
-- SECURITY DEFINER function `create_org_with_owner`, which bypasses RLS, so
-- removing these policies does not break the onboarding flow.
-- The remaining "Org members insert owner" restrictive policy correctly limits
-- inserts to existing owners adding new members.

DROP POLICY IF EXISTS "members: self-insert on signup" ON public.org_members;
DROP POLICY IF EXISTS "org_members_self_insert" ON public.org_members;

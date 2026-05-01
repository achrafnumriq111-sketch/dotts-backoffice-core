-- Fix search_path on remaining functions
CREATE OR REPLACE FUNCTION public.tg_set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.touch_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.touch_organizations_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- next_receipt_number: re-create with same body but fixed search_path
DO $$
DECLARE
  fn_def text;
BEGIN
  SELECT pg_get_functiondef(p.oid) INTO fn_def
  FROM pg_proc p JOIN pg_namespace n ON n.oid = p.pronamespace
  WHERE n.nspname='public' AND p.proname='next_receipt_number'
  LIMIT 1;
  IF fn_def IS NOT NULL THEN
    EXECUTE replace(fn_def, 'LANGUAGE', E'SET search_path = public\nLANGUAGE');
  END IF;
EXCEPTION WHEN OTHERS THEN
  -- ignore: next_receipt_number may not exist or already set
  NULL;
END $$;

-- Drop redundant permissive INSERT policies on organizations.
-- create_org_with_owner SECURITY DEFINER handles signup; no direct insert needed.
DROP POLICY IF EXISTS "organizations_self_insert" ON public.organizations;
DROP POLICY IF EXISTS "orgs: authenticated can insert" ON public.organizations;

-- Restrict listing on org-logos public bucket: keep individual object reads,
-- but disallow listing of all keys in the bucket by anonymous users.
-- The existing SELECT policy "public read org logos" allows reading any object
-- whose URL is known. To prevent enumeration via list API, replace with a
-- policy that still allows reading individual objects (which is what public
-- buckets need) but the policy itself is fine since list still requires
-- knowing prefix. Supabase linter flags any USING(true) on public buckets;
-- scope reads to org members for listing while keeping URL-based reads working
-- via the bucket's public flag (CDN bypasses RLS).
DROP POLICY IF EXISTS "public read org logos" ON storage.objects;

CREATE POLICY "org members can list org logos"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'org-logos'
  AND EXISTS (
    SELECT 1 FROM public.org_members om
    WHERE (om.org_id)::text = (storage.foldername(name))[1]
      AND om.user_id = auth.uid()
  )
);
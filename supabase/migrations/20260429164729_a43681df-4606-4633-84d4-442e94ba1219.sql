-- Add 'manager' to org_role enum (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_enum e
    JOIN pg_type t ON t.oid = e.enumtypid
    WHERE t.typname = 'org_role' AND e.enumlabel = 'manager'
  ) THEN
    ALTER TYPE public.org_role ADD VALUE 'manager';
  END IF;
END $$;

-- Function to update an employee's role via org_members
CREATE OR REPLACE FUNCTION public.set_employee_role(
  p_employee_id uuid,
  p_role public.org_role
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_org uuid;
  v_user uuid;
  v_actor uuid := auth.uid();
  v_actor_role public.org_role;
  v_target_role public.org_role;
  v_owner_count int;
BEGIN
  IF v_actor IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  SELECT org_id, user_id INTO v_org, v_user
  FROM public.employees WHERE id = p_employee_id;

  IF v_org IS NULL THEN
    RAISE EXCEPTION 'employee_not_found';
  END IF;

  IF v_user IS NULL THEN
    RAISE EXCEPTION 'employee_has_no_account';
  END IF;

  -- Actor's role in this org
  SELECT role INTO v_actor_role FROM public.org_members
  WHERE org_id = v_org AND user_id = v_actor;

  IF v_actor_role IS NULL OR v_actor_role NOT IN ('owner','admin') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  -- Target's current role
  SELECT role INTO v_target_role FROM public.org_members
  WHERE org_id = v_org AND user_id = v_user;

  IF v_target_role IS NULL THEN
    RAISE EXCEPTION 'membership_not_found';
  END IF;

  -- Admins cannot create owners or downgrade owners
  IF v_actor_role = 'admin' AND (p_role = 'owner' OR v_target_role = 'owner') THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  -- Prevent removing the last owner
  IF v_target_role = 'owner' AND p_role <> 'owner' THEN
    SELECT count(*) INTO v_owner_count FROM public.org_members
    WHERE org_id = v_org AND role = 'owner';
    IF v_owner_count <= 1 THEN
      RAISE EXCEPTION 'cannot_remove_last_owner';
    END IF;
  END IF;

  UPDATE public.org_members
  SET role = p_role
  WHERE org_id = v_org AND user_id = v_user;
END;
$$;

GRANT EXECUTE ON FUNCTION public.set_employee_role(uuid, public.org_role) TO authenticated;
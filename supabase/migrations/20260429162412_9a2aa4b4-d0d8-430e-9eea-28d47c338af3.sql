-- Add contract document columns to employees
ALTER TABLE public.employees
  ADD COLUMN IF NOT EXISTS contract_file_url text,
  ADD COLUMN IF NOT EXISTS contract_file_name text;

-- Recreate add_employee with end_date + contract fields
DROP FUNCTION IF EXISTS public.add_employee(
  uuid, text, text, text, text, uuid, employment_type, numeric, date, text,
  text, text, date, integer, text, text
);

CREATE OR REPLACE FUNCTION public.add_employee(
  p_org_id uuid,
  p_first_name text,
  p_last_name text,
  p_email text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_position_id uuid DEFAULT NULL,
  p_employment_type employment_type DEFAULT 'flex',
  p_contract_hours_per_week numeric DEFAULT NULL,
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_contract_file_url text DEFAULT NULL,
  p_contract_file_name text DEFAULT NULL,
  p_bsn text DEFAULT NULL,
  p_iban text DEFAULT NULL,
  p_birthdate date DEFAULT NULL,
  p_hourly_wage_cents integer DEFAULT NULL,
  p_emergency_contact_name text DEFAULT NULL,
  p_emergency_contact_phone text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_employee_id uuid;
  v_uid uuid := auth.uid();
  v_is_member boolean;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM org_members
    WHERE org_id = p_org_id AND user_id = v_uid
      AND role IN ('owner','admin','manager')
  ) INTO v_is_member;

  IF NOT v_is_member THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF org_is_locked(p_org_id) THEN
    RAISE EXCEPTION 'org_locked';
  END IF;

  INSERT INTO employees (
    org_id, first_name, last_name, email, phone, position_id,
    employment_type, contract_hours_per_week, start_date, end_date, notes,
    contract_file_url, contract_file_name, created_by
  ) VALUES (
    p_org_id, p_first_name, p_last_name, NULLIF(p_email,''), NULLIF(p_phone,''),
    p_position_id, p_employment_type, p_contract_hours_per_week,
    p_start_date, p_end_date, NULLIF(p_notes,''),
    NULLIF(p_contract_file_url,''), NULLIF(p_contract_file_name,''),
    v_uid
  ) RETURNING id INTO v_employee_id;

  IF p_bsn IS NOT NULL OR p_iban IS NOT NULL OR p_birthdate IS NOT NULL
     OR p_hourly_wage_cents IS NOT NULL OR p_emergency_contact_name IS NOT NULL
     OR p_emergency_contact_phone IS NOT NULL THEN
    INSERT INTO employee_private (
      org_id, employee_id, bsn, iban, birthdate, hourly_wage_cents,
      emergency_contact_name, emergency_contact_phone
    ) VALUES (
      p_org_id, v_employee_id, NULLIF(p_bsn,''), NULLIF(p_iban,''), p_birthdate,
      p_hourly_wage_cents, NULLIF(p_emergency_contact_name,''), NULLIF(p_emergency_contact_phone,'')
    );

    INSERT INTO sensitive_data_access_log (org_id, actor_user_id, employee_id, action, fields_changed)
    VALUES (p_org_id, v_uid, v_employee_id, 'create_sensitive', ARRAY[
      CASE WHEN p_bsn IS NOT NULL THEN 'bsn' END,
      CASE WHEN p_iban IS NOT NULL THEN 'iban' END,
      CASE WHEN p_birthdate IS NOT NULL THEN 'birthdate' END,
      CASE WHEN p_hourly_wage_cents IS NOT NULL THEN 'hourly_wage_cents' END,
      CASE WHEN p_emergency_contact_name IS NOT NULL THEN 'emergency_contact_name' END,
      CASE WHEN p_emergency_contact_phone IS NOT NULL THEN 'emergency_contact_phone' END
    ]::text[]);
  END IF;

  RETURN v_employee_id;
END;
$$;

-- Recreate update_employee with contract fields
DROP FUNCTION IF EXISTS public.update_employee(
  uuid, text, text, text, text, uuid, employment_type, numeric, date, date, text, boolean
);

CREATE OR REPLACE FUNCTION public.update_employee(
  p_employee_id uuid,
  p_first_name text DEFAULT NULL,
  p_last_name text DEFAULT NULL,
  p_email text DEFAULT NULL,
  p_phone text DEFAULT NULL,
  p_position_id uuid DEFAULT NULL,
  p_employment_type employment_type DEFAULT NULL,
  p_contract_hours_per_week numeric DEFAULT NULL,
  p_start_date date DEFAULT NULL,
  p_end_date date DEFAULT NULL,
  p_notes text DEFAULT NULL,
  p_is_active boolean DEFAULT NULL,
  p_contract_file_url text DEFAULT NULL,
  p_contract_file_name text DEFAULT NULL,
  p_clear_contract boolean DEFAULT false
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid uuid := auth.uid();
  v_org_id uuid;
  v_is_member boolean;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;

  SELECT org_id INTO v_org_id FROM employees WHERE id = p_employee_id;
  IF v_org_id IS NULL THEN
    RAISE EXCEPTION 'employee_not_found';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM org_members
    WHERE org_id = v_org_id AND user_id = v_uid
      AND role IN ('owner','admin','manager')
  ) INTO v_is_member;

  IF NOT v_is_member THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  IF org_is_locked(v_org_id) THEN
    RAISE EXCEPTION 'org_locked';
  END IF;

  UPDATE employees SET
    first_name = COALESCE(p_first_name, first_name),
    last_name = COALESCE(p_last_name, last_name),
    email = COALESCE(NULLIF(p_email,''), email),
    phone = COALESCE(NULLIF(p_phone,''), phone),
    position_id = COALESCE(p_position_id, position_id),
    employment_type = COALESCE(p_employment_type, employment_type),
    contract_hours_per_week = COALESCE(p_contract_hours_per_week, contract_hours_per_week),
    start_date = COALESCE(p_start_date, start_date),
    end_date = CASE WHEN p_end_date IS NOT NULL THEN p_end_date ELSE end_date END,
    notes = COALESCE(p_notes, notes),
    is_active = COALESCE(p_is_active, is_active),
    contract_file_url = CASE
      WHEN p_clear_contract THEN NULL
      WHEN p_contract_file_url IS NOT NULL THEN p_contract_file_url
      ELSE contract_file_url
    END,
    contract_file_name = CASE
      WHEN p_clear_contract THEN NULL
      WHEN p_contract_file_name IS NOT NULL THEN p_contract_file_name
      ELSE contract_file_name
    END,
    updated_at = now()
  WHERE id = p_employee_id;
END;
$$;

-- Storage bucket (private)
INSERT INTO storage.buckets (id, name, public)
VALUES ('contracts', 'contracts', false)
ON CONFLICT (id) DO NOTHING;

-- RLS policies on storage.objects for contracts bucket.
-- Path convention: {org_id}/{employee_id}/{filename}
DROP POLICY IF EXISTS "contracts_select" ON storage.objects;
CREATE POLICY "contracts_select"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'contracts'
  AND (
    (storage.foldername(name))[1]::uuid IN (SELECT org_id FROM user_org_ids())
    OR is_dotts_admin()
  )
);

DROP POLICY IF EXISTS "contracts_insert" ON storage.objects;
CREATE POLICY "contracts_insert"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'contracts'
  AND (storage.foldername(name))[1]::uuid IN (SELECT org_id FROM user_org_ids())
  AND NOT org_is_locked((storage.foldername(name))[1]::uuid)
);

DROP POLICY IF EXISTS "contracts_update" ON storage.objects;
CREATE POLICY "contracts_update"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'contracts'
  AND (storage.foldername(name))[1]::uuid IN (SELECT org_id FROM user_org_ids())
  AND NOT org_is_locked((storage.foldername(name))[1]::uuid)
);

DROP POLICY IF EXISTS "contracts_delete" ON storage.objects;
CREATE POLICY "contracts_delete"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'contracts'
  AND (storage.foldername(name))[1]::uuid IN (SELECT org_id FROM user_org_ids())
  AND NOT org_is_locked((storage.foldername(name))[1]::uuid)
);
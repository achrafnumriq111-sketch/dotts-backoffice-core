-- Invoice download URLs (populated by Stripe webhook going forward)
ALTER TABLE public.invoices
  ADD COLUMN IF NOT EXISTS hosted_invoice_url text,
  ADD COLUMN IF NOT EXISTS invoice_pdf_url text;

-- Recreate update_employee to allow clearing email/phone/notes via empty string.
-- Convention: NULL = field omitted (keep current value); '' = explicitly clear to NULL.
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
    -- '' explicitly clears, NULL leaves untouched
    email = CASE WHEN p_email IS NULL THEN email
                 WHEN p_email = ''  THEN NULL
                 ELSE p_email END,
    phone = CASE WHEN p_phone IS NULL THEN phone
                 WHEN p_phone = ''  THEN NULL
                 ELSE p_phone END,
    position_id = COALESCE(p_position_id, position_id),
    employment_type = COALESCE(p_employment_type, employment_type),
    contract_hours_per_week = COALESCE(p_contract_hours_per_week, contract_hours_per_week),
    start_date = COALESCE(p_start_date, start_date),
    end_date = CASE WHEN p_end_date IS NOT NULL THEN p_end_date ELSE end_date END,
    notes = CASE WHEN p_notes IS NULL THEN notes
                 WHEN p_notes = ''  THEN NULL
                 ELSE p_notes END,
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
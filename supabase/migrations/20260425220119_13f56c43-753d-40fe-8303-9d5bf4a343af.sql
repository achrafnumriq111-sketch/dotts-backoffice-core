CREATE OR REPLACE FUNCTION public.get_linked_email(p_employee_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
declare
  v_org_id uuid;
  v_user_id uuid;
  v_role text;
  v_email text;
begin
  if auth.uid() is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  select org_id, user_id into v_org_id, v_user_id
  from public.employees where id = p_employee_id;

  if v_org_id is null then
    return null;
  end if;

  -- Caller must be owner/admin in that org
  select om.role::text into v_role from public.org_members om
   where om.org_id = v_org_id and om.user_id = auth.uid()
   limit 1;

  if v_role is null or v_role not in ('owner','admin') then
    raise exception 'forbidden' using errcode = '42501';
  end if;

  if v_user_id is null then
    return null;
  end if;

  select email into v_email from auth.users where id = v_user_id;
  return v_email;
end $$;

REVOKE ALL ON FUNCTION public.get_linked_email(uuid) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_linked_email(uuid) TO authenticated;
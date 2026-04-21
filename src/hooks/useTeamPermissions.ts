import { useOrg } from "@/context/OrgContext";

export function useTeamPermissions() {
  const { currentRole } = useOrg();
  const canView = !!currentRole;
  const canEdit = currentRole === "owner" || currentRole === "admin";
  const canSeeFinancial = currentRole === "owner";
  return { canView, canEdit, canSeeFinancial, role: currentRole };
}
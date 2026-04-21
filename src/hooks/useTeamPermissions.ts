import { useOrg } from "@/context/OrgContext";
import { useMyEmployeeId } from "./useMyEmployeeId";

export function useTeamPermissions() {
  const { currentRole, currentOrg } = useOrg();
  const { data: myEmployeeId } = useMyEmployeeId(currentOrg?.id);
  const canView = !!currentRole;
  const canEdit = currentRole === "owner" || currentRole === "admin";
  const canSeeFinancial = currentRole === "owner";
  const canReviewTimeOff = currentRole === "owner" || currentRole === "admin";
  return {
    canView,
    canEdit,
    canSeeFinancial,
    canReviewTimeOff,
    role: currentRole,
    myEmployeeId: myEmployeeId ?? null,
  };
}

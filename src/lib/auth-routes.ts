import type { User } from "@/types";

export function getPortalPathForRole(role: User["role"]): string {
  switch (role) {
    case "Customer":
      return "/portal";
    case "Lab Coordinator":
    case "Lab Staff":
      return "/coordinator";
    case "Admin":
    default:
      return "/app";
  }
}

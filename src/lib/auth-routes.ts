import type { User } from "@/types";

export const AUTH_ROUTES = {
  login: "/login",
  register: "/register",
  verifyEmail: "/verify-email",
  forgotPassword: "/forgot-password",
  resetPassword: "/reset-password",
} as const;

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

export function getVerifyEmailPath(email?: string): string {
  if (!email) return AUTH_ROUTES.verifyEmail;
  return `${AUTH_ROUTES.verifyEmail}?email=${encodeURIComponent(email)}`;
}

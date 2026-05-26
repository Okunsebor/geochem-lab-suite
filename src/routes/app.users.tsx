import { createFileRoute } from "@tanstack/react-router";
import { UsersRolesPanel } from "../features/administration";

export const Route = createFileRoute("/app/users")({ component: UsersPage });

function UsersPage() {
  return <UsersRolesPanel />;
}

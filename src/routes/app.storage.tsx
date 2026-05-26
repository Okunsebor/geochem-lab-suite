import { createFileRoute } from "@tanstack/react-router";
import { StorageMap } from "../features/operations";

export const Route = createFileRoute("/app/storage")({ component: Storage });

function Storage() {
  return <StorageMap />;
}

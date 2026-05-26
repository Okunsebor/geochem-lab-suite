import { createFileRoute } from "@tanstack/react-router";
import { RegisterForm } from "../features/auth/components/register-form";

export const Route = createFileRoute("/register")({ component: Register });

function Register() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <RegisterForm />
    </div>
  );
}

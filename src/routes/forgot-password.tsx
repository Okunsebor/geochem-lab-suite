import { createFileRoute, Link } from "@tanstack/react-router";
import { FlaskConical } from "lucide-react";
import { ForgotPasswordForm } from "../features/auth/components/forgot-password-form";

export const Route = createFileRoute("/forgot-password")({ component: ForgotPassword });

function ForgotPassword() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden lg:flex relative flex-col justify-between p-10 bg-sidebar text-sidebar-foreground overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-50" />
        <div className="relative">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid size-9 place-items-center rounded-md gradient-primary text-white">
              <FlaskConical className="size-4" />
            </div>
            <span className="text-white font-semibold">GeoChem Suite</span>
          </Link>
        </div>
        <div className="relative">
          <blockquote className="text-xl text-white/90 leading-snug">
            "Security and precision are the bedrocks of modern geochemical intelligence."
          </blockquote>
          <p className="mt-4 text-sm text-sidebar-foreground/70">
            — Chief Security Officer, GeoChem Labs
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center p-6 sm:p-10 bg-background">
        <ForgotPasswordForm />
      </div>
    </div>
  );
}

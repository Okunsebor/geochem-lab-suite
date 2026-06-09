import { createFileRoute, Link } from "@tanstack/react-router";
import { FlaskConical } from "lucide-react";

export const Route = createFileRoute("/reset-password")({
  component: ResetPassword,
});

function ResetPassword() {
  const search: any = Route.useSearch();
  
  const isExpired = search.error === "access_denied" && search.error_code === "otp_expired";
  
  if (isExpired) {
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
          </div>
        </div>
        <div className="flex items-center justify-center p-6 sm:p-10 bg-background">
          <div className="max-w-md w-full bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col items-center text-center">
            <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
              <FlaskConical className="h-6 w-6 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Link Expired</h2>
            <p className="text-sm text-muted-foreground mb-6">
              This invite link has expired. Please contact your administrator to send a new invitation.
            </p>
            <Link
              to="/login"
              className="w-full inline-flex justify-center rounded-md gradient-primary px-4 py-2 text-sm font-medium text-white shadow-sm hover:opacity-90 transition-opacity"
            >
              Back to sign in
            </Link>
          </div>
        </div>
      </div>
    );
  }

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
      </div>
      <div className="flex items-center justify-center p-6 sm:p-10 bg-background">
        <div className="max-w-md w-full">
          <h2 className="text-2xl font-bold mb-2">Reset Password</h2>
          <p className="text-muted-foreground text-sm mb-6">Enter your new password below.</p>
          <div className="p-4 bg-card border border-border rounded-lg text-center text-sm text-muted-foreground">
            Reset password form placeholder
          </div>
        </div>
      </div>
    </div>
  );
}

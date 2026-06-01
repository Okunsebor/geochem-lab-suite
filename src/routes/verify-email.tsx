import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";
import { VerifyEmailPage } from "@/features/auth/components/verify-email-page";
import { BRAND_ASSETS } from "@/lib/branding";
import { OptimizedImage } from "@/components/shared/OptimizedImage";

const verifySearchSchema = z.object({
  email: z.string().optional(),
});

export const Route = createFileRoute("/verify-email")({
  validateSearch: verifySearchSchema,
  component: VerifyEmailRoute,
});

function VerifyEmailRoute() {
  const { email } = Route.useSearch();
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden lg:block relative overflow-hidden">
        <OptimizedImage
          src={BRAND_ASSETS.entrance}
          alt="UniPod Nsuk"
          className="absolute inset-0 w-full h-full object-cover"
          width={1200}
          height={900}
        />
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(135deg, rgba(11,31,51,0.92) 0%, rgba(0,174,239,0.25) 100%)",
          }}
        />
        <div className="relative flex flex-col justify-end p-10 min-h-full text-white max-w-md">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/70 mb-3">
            Trusted laboratory access
          </p>
          <h2 className="text-2xl font-bold font-display leading-snug">
            Enterprise-grade identity verification
          </h2>
          <p className="mt-3 text-sm text-white/80 leading-relaxed">
            Your account is protected with email verification before portal access ù the same
            standard used by leading research and mining platforms.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center p-6 sm:p-10 bg-background">
        <VerifyEmailPage initialEmail={email} />
      </div>
    </div>
  );
}

import { createFileRoute, useSearch } from "@tanstack/react-router";
import { z } from "zod";
import { LoginForm } from "../features/auth/components/login-form";
import { BRAND_ASSETS } from "@/lib/branding";
import { UniPodLogo } from "@/components/branding/UniPodLogo";

const loginSearchSchema = z.object({
  intent: z.string().optional(),
});

export const Route = createFileRoute("/login")({
  validateSearch: loginSearchSchema,
  component: Login,
});

function Login() {
  const { intent } = useSearch({ from: "/login" });

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden lg:block relative overflow-hidden">
        <img
          src={BRAND_ASSETS.entrance}
          alt="UniPod Nsuk"
          className="absolute inset-0 w-full h-full object-cover"
          loading="lazy"
          decoding="async"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent" />
        <div className="relative flex flex-col justify-between p-10 min-h-full text-white">
          <UniPodLogo height={36} linkToHome showTagline />
          <blockquote className="text-xl leading-snug max-w-md">
            &ldquo;Precision geochemistry for exploration and mining — from UniPod Nsuk.&rdquo;
          </blockquote>
        </div>
      </div>
      <div className="flex items-center justify-center p-6 sm:p-10 bg-background">
        <LoginForm portalIntent={intent === "portal"} />
      </div>
    </div>
  );
}

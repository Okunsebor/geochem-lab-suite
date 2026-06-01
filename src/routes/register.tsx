import { createFileRoute } from "@tanstack/react-router";
import { RegisterForm } from "../features/auth/components/register-form";
import { BRAND_ASSETS } from "@/lib/branding";
import { OptimizedImage } from "@/components/shared/OptimizedImage";

export const Route = createFileRoute("/register")({ component: Register });

function Register() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden lg:block relative overflow-hidden">
        <OptimizedImage
          src={BRAND_ASSETS.labInterior}
          alt="UniPod geochemistry laboratory"
          className="absolute inset-0 w-full h-full object-cover"
          width={1200}
          height={900}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0B1F33]/85 to-transparent" />
        <div className="relative p-10 flex flex-col justify-end min-h-full text-white max-w-lg">
          <h2 className="text-2xl font-bold font-display">UniPod Geochemistry Laboratory</h2>
          <p className="mt-2 text-sm text-white/85 leading-relaxed">
            Register once to unlock sample submission, live tracking, and secure certificate delivery.
          </p>
        </div>
      </div>
      <div className="flex items-center justify-center p-6 sm:p-10 bg-background">
        <RegisterForm />
      </div>
    </div>
  );
}

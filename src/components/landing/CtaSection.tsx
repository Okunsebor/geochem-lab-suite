import { ArrowRight, Lock } from "lucide-react";
import { ThemeLink } from "./shared/ThemeButton";

export default function CtaSection() {
  return (
    <section
      id="register-cta"
      className="relative border-t border-border bg-gradient-to-b from-black via-black/95 to-[#F5B800]/25 text-white overflow-hidden"
    >
      {/* Subtle entrance background image */}
      <div
        className="absolute inset-0 bg-cover bg-center opacity-25 pointer-events-none"
        style={{ backgroundImage: "url('/branding/unipod-nsuk-entrance.png')" }}
      />
      <div className="relative z-10 mx-auto max-w-7xl px-6 py-20 lg:py-28 text-center space-y-8">
        <p className="text-[10px] font-bold font-mono uppercase tracking-[0.2em] text-accent">
          Secure Intake Gateway
        </p>
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl font-display max-w-3xl mx-auto">
          Access Authorized Infrastructure
        </h2>
        <p className="text-base sm:text-lg text-white/75 max-w-2xl mx-auto leading-relaxed">
          GeoChem Suite is a controlled-access enterprise platform. Access is restricted to
          authorized partners, accredited researchers, and verified institutions.
        </p>
        <div className="flex flex-wrap justify-center gap-4 pt-2">
          <ThemeLink to="/register" variant="gold" className="px-8 py-4 text-base !rounded-xl">
            Get Started <ArrowRight className="size-4" />
          </ThemeLink>
        </div>
        <p className="inline-flex items-center gap-2 text-xs text-white/60 max-w-md mx-auto">
          <Lock className="size-3.5 text-accent shrink-0" />
          Access clearance requires verified cryptographic protocols.
        </p>
      </div>
    </section>
  );
}

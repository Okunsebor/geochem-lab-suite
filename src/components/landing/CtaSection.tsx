import { ArrowRight, Lock } from "lucide-react";
import { ThemeLink } from "./shared/ThemeButton";

export default function CtaSection() {
  return (
    <section id="register-cta" className="border-t border-border bg-gradient-to-b from-[#0B1F33] via-[#0B1F33]/95 to-[#0090C8]/20 text-white">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28 text-center space-y-8">
        <p className="text-[10px] font-bold font-mono uppercase tracking-[0.2em] text-accent">Join hands with us</p>
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl font-display max-w-3xl mx-auto">
          Ready to elevate your laboratory operations?
        </h2>
        <p className="text-base sm:text-lg text-white/75 max-w-2xl mx-auto leading-relaxed">
          Get access to GeoChem Suite — register for the customer portal and start your journey to an
          optimised, traceable geochemistry workflow at UniPod Nsuk.
        </p>
        <div className="flex flex-wrap justify-center gap-4 pt-2">
          <ThemeLink to="/register" variant="gold" className="px-8 py-4 text-base">
            Register now <ArrowRight className="size-4" />
          </ThemeLink>
          <ThemeLink to="/login" search={{}} variant="outline" className="px-8 py-4 text-base !border-white/30 !text-white hover:!text-[#0B1F33]">
            Sign in
          </ThemeLink>
        </div>
        <p className="inline-flex items-center gap-2 text-xs text-white/60 max-w-md mx-auto">
          <Lock className="size-3.5 text-accent shrink-0" />
          Portal access is granted after registration and email verification.
        </p>
      </div>
    </section>
  );
}

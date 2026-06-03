import { useState } from "react";
import { ArrowRight, Lock } from "lucide-react";
import { ThemeLink } from "./shared/ThemeButton";
import PartnershipModal from "./shared/PartnershipModal";

export default function CtaSection() {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <section id="register-cta" className="border-t border-border bg-gradient-to-b from-black via-black/95 to-[#0090C8]/20 text-white">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28 text-center space-y-8">
        <p className="text-[10px] font-bold font-mono uppercase tracking-[0.2em] text-accent">Secure Intake Gateway</p>
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl font-display max-w-3xl mx-auto">
          Access Authorized Infrastructure
        </h2>
        <p className="text-base sm:text-lg text-white/75 max-w-2xl mx-auto leading-relaxed">
          GeoChem Suite is a controlled-access enterprise platform. Access is restricted to authorized partners, accredited researchers, and verified institutions.
        </p>
        <div className="flex flex-wrap justify-center gap-4 pt-2">
          <ThemeLink to="/register" variant="gold" className="px-8 py-4 text-base !rounded-xl">
            Request Access <ArrowRight className="size-4" />
          </ThemeLink>
          <button
            onClick={() => setIsModalOpen(true)}
            className="px-8 py-4 text-base rounded-full font-semibold border-2 border-white/30 text-white bg-transparent hover:bg-white hover:text-black hover:border-transparent transition-all duration-[180ms] ease-out hover:-translate-y-[2px] active:translate-y-[1px] hover:shadow-lg hover:shadow-white/20 !rounded-xl cursor-pointer"
          >
            Institutional Partnership
          </button>
        </div>
        <p className="inline-flex items-center gap-2 text-xs text-white/60 max-w-md mx-auto">
          <Lock className="size-3.5 text-accent shrink-0" />
          Access clearance requires verified cryptographic protocols.
        </p>
      </div>

      <PartnershipModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} />
    </section>
  );
}

import { motion } from "framer-motion";
import { LandingSectionHeader } from "./shared/LandingSectionHeader";

const PARTNERS = [
  "UNDP",
  "Timbuktoo Initiative",
  "Tertiary Education Trust Fund (TETFund)",
  "Federal Government of Nigeria",
  "Lagos State Ministry of Tertiary Education",
  "University of Lagos (UNILAG)",
  "Nasarawa State University, Keffi (NSUK)",
  "Lagos State University (LASU)",
  "Ahmadu Bello University (ABU)",
  "Podex Associates Limited",
  "Zindi",
  "Data Science Nigeria (DSN)",
  "GIZ",
  "Wenovation Hub",
  "Microsoft Research AI for Good Labs",
  "UN Women Nigeria",
];

export default function TrustedBySection() {
  return (
    <section id="trusted" className="border-t border-border bg-gradient-to-b from-muted/40 to-background overflow-hidden">
      <div className="mx-auto max-w-7xl px-6 py-20 lg:py-24">
        <LandingSectionHeader
          eyebrow="Success stories"
          title="Trusted by top brands"
          subtitle="GeoChem Suite at UniPod Nsuk is backed by leading institutions, development partners, and innovation ecosystems."
        />

        <div className="landing-marquee-mask mb-6 motion-reduce:hidden" aria-hidden>
          <div className="landing-marquee-track-slow flex gap-8 py-4">
            {[...PARTNERS, ...PARTNERS].map((name, i) => (
              <PartnerChip key={`a-${name}-${i}`} name={name} />
            ))}
          </div>
        </div>

        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {PARTNERS.map((name, idx) => (
            <motion.li
              key={name}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: Math.min(idx * 0.02, 0.3) }}
              className="rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm px-4 py-3 text-center text-xs font-semibold text-foreground/80 hover:border-accent/50 transition-colors"
            >
              {name}
            </motion.li>
          ))}
        </ul>
      </div>
    </section>
  );
}

function PartnerChip({ name }: { name: string }) {
  return (
    <span className="inline-flex shrink-0 items-center justify-center rounded-full border border-primary/20 bg-card px-6 py-3 text-xs sm:text-sm font-bold text-foreground/70 whitespace-nowrap">
      {name}
    </span>
  );
}

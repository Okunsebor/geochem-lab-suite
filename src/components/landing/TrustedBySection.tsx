import { motion } from "framer-motion";

const LOGOS: { src: string; alt: string }[] = [
  { src: "/trusted-by/UNDP.png", alt: "UNDP" },
  { src: "/trusted-by/Timbuktoo.png", alt: "Timbuktoo Initiative" },
  { src: "/trusted-by/TETFUND.png", alt: "TETFund" },
  { src: "/trusted-by/FGN.png", alt: "Federal Government of Nigeria" },
  { src: "/trusted-by/NSUK.png", alt: "Nasarawa State University, Keffi" },
];

export default function TrustedBySection() {
  return (
    <section
      id="trusted"
      className="border-t border-border bg-gradient-to-b from-muted/40 to-background overflow-hidden"
    >
      <div className="mx-auto max-w-7xl px-6 py-20 lg:py-24">
        {/* Heading only — no eyebrow, no subtitle */}
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5 }}
          className="mb-14 text-center text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold tracking-tight text-foreground font-display leading-tight"
        >
          Trusted by top brands
        </motion.h2>

        {/* Infinite scrolling logo strip */}
        <div className="landing-marquee-mask" aria-label="Partner logos">
          <div className="landing-marquee-track flex items-center gap-16 py-4">
            {/* Duplicate logos so the scroll feels truly seamless */}
            {[...LOGOS, ...LOGOS, ...LOGOS].map((logo, i) => (
              <LogoCard key={`logo-${i}`} src={logo.src} alt={logo.alt} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function LogoCard({ src, alt }: { src: string; alt: string }) {
  return (
    <div className="inline-flex shrink-0 items-center justify-center rounded-2xl border border-border/70 bg-card/80 backdrop-blur-sm px-10 py-6 shadow-sm hover:border-primary/40 hover:shadow-md transition-all duration-300 group">
      <img
        src={src}
        alt={alt}
        className="h-12 w-auto max-w-[140px] object-contain grayscale opacity-60 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300"
        loading="lazy"
        draggable={false}
      />
    </div>
  );
}

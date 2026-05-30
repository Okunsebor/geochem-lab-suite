import { motion } from "framer-motion";

const TESTIMONIALS = [
  {
    quote:
      "GeoChem replaced four spreadsheets and a paper logbook. Turnaround dropped from 9 days to 3.",
    author: "Lab Manager",
    org: "Auric Mining Ltd",
  },
  {
    quote:
      "QA/QC flags surface before they reach the certificate. We catch duplicate spreads the same day now.",
    author: "QA Lead",
    org: "Pacific Assay Group",
  },
  {
    quote:
      "Our geology team submits batches online and downloads certificates without chasing email threads.",
    author: "Client Geologist",
    org: "Strata Exploration",
  },
];

export default function TestimonialsSection() {
  return (
    <section className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-6 py-24 lg:py-28">
        <div className="max-w-3xl mx-auto text-center mb-14">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground font-display">
            Trusted by lab teams and their clients
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {TESTIMONIALS.map((t, idx) => (
            <motion.blockquote
              key={t.author}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.08 }}
              className="rounded-xl border border-border bg-card/50 backdrop-blur-sm p-6 lg:p-8 flex flex-col"
            >
              <p className="text-sm sm:text-base text-foreground/90 leading-relaxed flex-1">
                &ldquo;{t.quote}&rdquo;
              </p>
              <footer className="mt-6 pt-4 border-t border-border/60">
                <cite className="not-italic">
                  <span className="text-sm font-bold text-foreground block">{t.author}</span>
                  <span className="text-xs text-muted-foreground">{t.org}</span>
                </cite>
              </footer>
            </motion.blockquote>
          ))}
        </div>
      </div>
    </section>
  );
}

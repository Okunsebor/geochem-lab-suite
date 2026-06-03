import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Building2, Users, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

function AudienceCard({
  card,
  index,
  children,
}: {
  card: { icon: LucideIcon; title: string; description: string; bullets: string[]; accent: string };
  index: number;
  children: ReactNode;
}) {
  const Icon = card.icon;
  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ delay: index * 0.1 }}
      className={`relative rounded-2xl border bg-gradient-to-br ${card.accent} bg-card/40 backdrop-blur-xl p-8 lg:p-10 flex flex-col`}
    >
      <div className="grid size-12 place-items-center rounded-xl bg-primary/10 text-primary mb-6">
        <Icon className="size-6" />
      </div>
      <h3 className="text-2xl font-bold text-foreground font-display">{card.title}</h3>
      <p className="mt-3 text-sm text-muted-foreground leading-relaxed">{card.description}</p>
      <ul className="mt-6 space-y-2.5 flex-1">
        {card.bullets.map((b) => (
          <li key={b} className="flex items-start gap-2 text-sm text-foreground/90">
            <span className="mt-1.5 size-1.5 rounded-full bg-primary shrink-0" />
            {b}
          </li>
        ))}
      </ul>
      {children}
    </motion.article>
  );
}

const LAB_CARD = {
  icon: Building2,
  title: "For laboratories",
  description:
    "Provision your organization workspace with intake, preparation, analysis, QA/QC, and reporting in one system.",
  bullets: [
    "Sample intake with barcodes & custody",
    "Instrument queues & QA/QC engine",
    "Branded certificate generation",
    "Invite clients to your portal",
  ],
  cta: "Create workspace",
  accent: "from-primary/20 to-primary/5 border-primary/30",
};

const CLIENT_CARD = {
  icon: Users,
  title: "For clients",
  description:
    "Mining companies and exploration teams track submissions, monitor turnaround, and download certificates securely.",
  bullets: [
    "Submit sample batches online",
    "Real-time custody & status tracking",
    "Secure report download vault",
    "Dedicated support desk",
  ],
  cta: "Access portal",
  accent: "from-accent/20 to-accent/5 border-accent/40",
};

export default function AudienceSplitSection() {
  return (
    <section id="audiences" className="border-t border-border bg-background">
      <div className="mx-auto max-w-7xl px-6 py-12 md:py-16 lg:py-20">
        <div className="max-w-3xl mx-auto text-center mb-14">
          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground font-display">
            Built for labs and their clients
          </h2>
          <p className="mt-4 text-base text-muted-foreground leading-relaxed">
            Whether you run the assay facility or submit samples as a client, GeoChem Suite connects
            both sides of the workflow.
          </p>
        </div>
        <div className="grid gap-8 lg:grid-cols-2">
          <AudienceCard card={LAB_CARD} index={0}>
            <Link
              to="/register"
              className="mt-8 btn-theme-cyan text-sm w-fit"
            >
              {LAB_CARD.cta} <ArrowRight className="size-4" />
            </Link>
          </AudienceCard>
          <AudienceCard card={CLIENT_CARD} index={1}>
            <Link
              to="/login"
              search={{ intent: "portal" }}
              className="mt-8 btn-theme-cyan text-sm w-fit"
            >
              {CLIENT_CARD.cta} <ArrowRight className="size-4" />
            </Link>
          </AudienceCard>
        </div>
      </div>
    </section>
  );
}

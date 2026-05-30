import { motion } from "framer-motion";
import { Shield, Lock, FileCheck, Database } from "lucide-react";

const FEATURES = [
  {
    icon: Shield,
    title: "Role-based access control",
    description: "Separate permissions for administrators, technicians, and customer portal users.",
  },
  {
    icon: FileCheck,
    title: "Immutable audit trail",
    description: "Every custody handoff, status change, and report approval is logged with timestamps.",
  },
  {
    icon: Lock,
    title: "Secure authentication",
    description: "Supabase-backed sign-in with email verification and organization-scoped workspaces.",
  },
  {
    icon: Database,
    title: "Data integrity",
    description: "Structured specimen records replace spreadsheet risk with validated QA/QC checkpoints.",
  },
];

export default function SecurityComplianceSection() {
  return (
    <section id="security" className="border-t border-border bg-card/20" aria-labelledby="security-heading">
      <div className="mx-auto max-w-7xl px-6 py-12 md:py-16 lg:py-20">
        <div className="max-w-3xl mx-auto text-center mb-14">
          <h2 id="security-heading" className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground font-display">
            Security & compliance built in
          </h2>
          <p className="mt-4 text-base text-muted-foreground leading-relaxed">
            Designed for assay laboratories that need defensible chain of custody and audit-ready
            operations — not bolt-on security after the fact.
          </p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((f, idx) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.06 }}
              className="rounded-xl border border-border/80 bg-card/60 backdrop-blur-sm p-6 hover:border-primary/40 transition-colors"
            >
              <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary mb-4">
                <f.icon className="size-5" />
              </div>
              <h3 className="font-bold text-foreground text-sm">{f.title}</h3>
              <p className="mt-2 text-xs sm:text-sm text-muted-foreground leading-relaxed">{f.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

import { motion } from "framer-motion";
import { LandingSectionHeader } from "./shared/LandingSectionHeader";

const TECH_STACK = [
  { name: "React 19", category: "Frontend" },
  { name: "TanStack Start", category: "Framework" },
  { name: "TypeScript", category: "Language" },
  { name: "Tailwind CSS v4", category: "Styling" },
  { name: "Framer Motion", category: "Motion" },
  { name: "Supabase", category: "Auth & API" },
  { name: "PostgreSQL", category: "Database" },
  { name: "Vite 7", category: "Build" },
];

export default function TechnologyStackSection() {
  return (
    <section id="technology" className="border-t border-border bg-muted/30 relative overflow-hidden">
      <div className="absolute inset-0 landing-grid-fine opacity-40 pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-6 py-16 lg:py-20">
        <LandingSectionHeader
          eyebrow="Language & database"
          title="Technology we use"
          subtitle="A modern, production-grade stack engineered for performance, security, and long-term maintainability."
        />

        <div className="flex flex-wrap justify-center gap-4 md:gap-6">
          {TECH_STACK.map((tech, idx) => (
            <motion.div
              key={tech.name}
              initial={{ opacity: 0, scale: 0.9, rotateY: -12 }}
              whileInView={{ opacity: 1, scale: 1, rotateY: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.05, type: "spring", stiffness: 120 }}
              whileHover={{ y: -4 }}
              className="landing-tech-badge group"
            >
              <span className="block text-lg sm:text-xl font-extrabold font-display text-foreground group-hover:text-primary transition-colors">
                {tech.name}
              </span>
              <span className="block text-[10px] font-mono uppercase tracking-widest text-muted-foreground mt-1 group-hover:text-accent transition-colors">
                {tech.category}
              </span>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

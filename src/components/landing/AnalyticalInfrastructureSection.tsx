import { motion } from "framer-motion";
import { LandingSectionHeader } from "./shared/LandingSectionHeader";

const EQUIPMENT_LIST = [
  {
    name: "ICP-OES",
    description: "Multi-element analysis with laboratory-grade precision.",
    imgSrc: "/equipment/ICP.png",
  },
  {
    name: "Atomic Absorption Spectrometer (AAS)",
    description: "Accurate trace metal and mineral quantification.",
    imgSrc: "/equipment/AAS.png",
  },
  {
    name: "Microwave Digestion System",
    description: "Advanced sample preparation for reliable results.",
    imgSrc: "/equipment/microwave.png",
  },
  {
    name: "X-Ray Fluorescence Spectrometer (XRF)",
    description: "Rapid non-destructive elemental characterization.",
    imgSrc: "/equipment/x-ray.png",
  },
  {
    name: "UV-Visible Spectrophotometer",
    description: "Chemical and environmental analysis solutions.",
    imgSrc: "/equipment/uv-visible.png",
  },
];

const STATS = [
  { label: "Advanced Instruments", value: "6+" },
  { label: "Analytical Accuracy", value: "99.9%" },
  { label: "Workflows", value: "ISO-Compliant" },
  { label: "Turnaround Time", value: "Fast" },
];

export default function AnalyticalInfrastructureSection() {
  return (
    <section
      id="infrastructure"
      className="border-t border-border bg-background relative overflow-hidden"
    >
      <div className="absolute inset-0 landing-grid-fine opacity-30 pointer-events-none" />

      <div className="relative mx-auto max-w-7xl px-6 py-20 lg:py-28">
        <LandingSectionHeader
          eyebrow="Capabilities & Precision"
          title="World-Class Instruments. Institutional-Grade Accuracy."
          subtitle="Every instrument in the GeoChem Suite facility is calibrated, maintained, and operated under strict quality assurance protocols to deliver results you can publish, submit, and defend."
        />

        {/* Mobile: CSS Snap Carousel, Desktop: CSS Grid */}
        <div className="mt-12 flex overflow-x-auto pb-8 snap-x snap-mandatory hide-scrollbar md:grid md:grid-cols-2 lg:grid-cols-3 gap-6 md:pb-0 md:overflow-visible">
          {EQUIPMENT_LIST.map((item, idx) => (
            <motion.article
              key={item.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: idx * 0.1, duration: 0.6, ease: "easeOut" }}
              className="snap-center shrink-0 w-[85vw] md:w-auto group rounded-2xl border border-border/60 dark:border-white/10 bg-white/60 dark:bg-black/40 backdrop-blur-md overflow-hidden shadow-lg shadow-black/[0.02] dark:shadow-black/20 transition-all hover:shadow-2xl hover:border-primary/40 relative"
            >
              <div className="aspect-[4/3] w-full overflow-hidden bg-muted/20 relative">
                <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent z-10" />
                <motion.img
                  src={item.imgSrc}
                  alt={item.name}
                  className="w-full h-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  initial={false}
                />
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold font-display text-foreground group-hover:text-primary transition-colors">
                  {item.name}
                </h3>
                <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
                  {item.description}
                </p>
              </div>
              {/* Premium Glass Top Edge Highlight */}
              <div className="absolute inset-0 pointer-events-none rounded-2xl shadow-[inset_0_1px_1px_rgba(255,255,255,0.8)] dark:shadow-[inset_0_1px_1px_rgba(255,255,255,0.15)]" />
            </motion.article>
          ))}
        </div>

        {/* Statistics Strip */}
        <div className="mt-20 lg:mt-28 bg-foreground text-background rounded-2xl overflow-hidden shadow-2xl relative border border-white/10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-accent/20 opacity-30 pointer-events-none" />
          <div className="grid grid-cols-2 lg:grid-cols-4 divide-x divide-y lg:divide-y-0 divide-background/20 relative z-10">
            {STATS.map((stat, idx) => (
              <div key={stat.label} className="p-8 text-center flex flex-col justify-center">
                <motion.span
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + idx * 0.1, type: "spring" }}
                  className="block text-3xl md:text-4xl font-extrabold font-display text-primary drop-shadow-md"
                >
                  {stat.value}
                </motion.span>
                <span className="block mt-2 text-sm md:text-base font-semibold text-background/80">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import { ArrowRight, Beaker, Microscope, FileCheck } from "lucide-react";
import { BRAND_ASSETS } from "@/lib/branding";

export default function LaboratorySection() {
  return (
    <section id="laboratory" className="border-t border-border bg-card/20">
      <div className="mx-auto max-w-7xl px-6 py-12 md:py-16 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-2 items-center">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative rounded-2xl overflow-hidden border border-border shadow-xl order-2 lg:order-1"
          >
            <img
              src={BRAND_ASSETS.labInterior}
              alt="UniPod geochemistry laboratory interior"
              className="w-full aspect-[4/3] object-cover"
            />
            <div className="absolute top-4 left-4 rounded-full bg-accent px-3 py-1 text-[10px] font-bold font-mono uppercase tracking-widest text-accent-foreground shadow-md">
              ISO 17025-ready facility
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6 order-1 lg:order-2"
          >
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground font-display">
              World-class geochemistry at UniPod Nsuk
            </h2>
            <p className="text-base text-muted-foreground leading-relaxed">
              Our laboratory delivers precision assay workflows — from sample reception through
              preparation, instrumental analysis, QA/QC validation, and certificate release.
            </p>
            <ul className="space-y-4">
              {[
                { icon: Beaker, title: "Full assay pipeline", desc: "ICP-MS/OES queues with real-time preparation tracking." },
                { icon: Microscope, title: "Rigorous QA/QC", desc: "Duplicates, CRMs, and calibration validation built in." },
                { icon: FileCheck, title: "Certified reporting", desc: "Branded PDF certificates delivered via your portal." },
              ].map((item) => (
                <li key={item.title} className="flex gap-3">
                  <div className="grid size-10 place-items-center rounded-lg bg-primary/10 text-primary shrink-0">
                    <item.icon className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-foreground text-sm">{item.title}</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">{item.desc}</p>
                  </div>
                </li>
              ))}
            </ul>
            <Link
              to="/register"
              className="btn-theme-cyan text-sm"
            >
              Register for laboratory access <ArrowRight className="size-4" />
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

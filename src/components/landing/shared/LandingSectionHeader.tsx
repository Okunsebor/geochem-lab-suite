import { motion } from "framer-motion";

type Props = {
  eyebrow: string;
  title: string;
  subtitle?: string;
  align?: "center" | "left";
  id?: string;
};

export function LandingSectionHeader({ eyebrow, title, subtitle, align = "center", id }: Props) {
  const centered = align === "center";
  return (
    <motion.header
      id={id}
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5 }}
      className={`mb-12 md:mb-16 ${centered ? "text-center mx-auto max-w-3xl" : "text-left max-w-2xl"}`}
    >
      <span className="inline-block text-[10px] font-bold font-mono uppercase tracking-[0.2em] text-accent mb-3">
        {eyebrow}
      </span>
      <h2 className="text-3xl sm:text-4xl lg:text-[2.75rem] font-extrabold tracking-tight text-foreground font-display leading-tight">
        {title}
      </h2>
      {subtitle && (
        <p className={`mt-4 text-base sm:text-lg text-muted-foreground leading-relaxed ${centered ? "" : "max-w-xl"}`}>
          {subtitle}
        </p>
      )}
    </motion.header>
  );
}

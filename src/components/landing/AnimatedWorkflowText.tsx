import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";

const WORKFLOW_STEPS = [
  "Received",
  "Verified",
  "Barcoded",
  "Prepared",
  "Analyzed",
  "Validated",
  "Reported"
];

export function AnimatedWorkflowText() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % WORKFLOW_STEPS.length);
    }, 2800);
    return () => clearInterval(timer);
  }, []);

  return (
    <span className="relative inline-block overflow-hidden h-[1.15em] w-full align-bottom">
      <AnimatePresence mode="popLayout">
        <motion.span
          key={index}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -40 }}
          transition={{
            type: "spring",
            stiffness: 80,
            damping: 20,
            mass: 1,
          }}
          className="absolute left-0 text-primary font-bold bg-clip-text text-transparent bg-gradient-to-r from-primary to-[#4A9BD4]"
        >
          {WORKFLOW_STEPS[index]}
        </motion.span>
      </AnimatePresence>
    </span>
  );
}

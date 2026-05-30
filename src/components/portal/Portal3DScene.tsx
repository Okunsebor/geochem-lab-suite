import type { ReactNode } from "react";
import { motion, useReducedMotion } from "framer-motion";

/** Ambient 3D mesh background for the customer portal */
export function Portal3DScene() {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return (
      <div
        className="pointer-events-none fixed inset-0 -z-10 opacity-40"
        style={{
          background:
            "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(0,174,239,0.15), transparent), radial-gradient(ellipse 40% 30% at 100% 100%, rgba(245,184,0,0.1), transparent)",
        }}
      />
    );
  }

  return (
    <div className="portal-3d-scene pointer-events-none fixed inset-0 -z-10 overflow-hidden">
      <motion.div
        className="portal-3d-orb portal-3d-orb--cyan"
        animate={{ x: [0, 40, -20, 0], y: [0, -30, 20, 0], scale: [1, 1.08, 0.95, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="portal-3d-orb portal-3d-orb--gold"
        animate={{ x: [0, -50, 30, 0], y: [0, 40, -25, 0], scale: [1, 0.92, 1.05, 1] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="portal-3d-grid"
        animate={{ rotateX: [55, 58, 55], rotateZ: [0, 2, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
    </div>
  );
}

/** 3D tilt card wrapper for portal dashboard widgets */
export function Portal3DCard({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24, rotateX: 8 }}
      animate={{ opacity: 1, y: 0, rotateX: 0 }}
      transition={{ delay, duration: 0.5, type: "spring", stiffness: 80 }}
      whileHover={{ y: -4, rotateX: -2, transition: { duration: 0.2 } }}
      className={`portal-3d-card ${className}`}
      style={{ transformStyle: "preserve-3d", perspective: 1000 }}
    >
      {children}
    </motion.div>
  );
}

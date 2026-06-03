import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShieldCheck, Mail, Building, User, ChevronRight, Lock, CheckCircle } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface PartnershipModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function PartnershipModal({ isOpen, onClose }: PartnershipModalProps) {
  const [step, setStep] = useState<"form" | "success">("form");
  const [formData, setFormData] = useState({
    name: "",
    institution: "",
    email: "",
    interest: "research",
    notes: "",
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API request to secure backend
    setTimeout(() => {
      setLoading(false);
      setStep("success");
    }, 1200);
  };

  const handleClose = () => {
    onClose();
    // Reset state after animation leaves
    setTimeout(() => {
      setStep("form");
      setFormData({
        name: "",
        institution: "",
        email: "",
        interest: "research",
        notes: "",
      });
    }, 300);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleClose(); }}>
      <DialogContent className="sm:max-w-[500px] border border-primary/20 bg-background/95 backdrop-blur-2xl shadow-2xl text-foreground overflow-hidden">
        {/* Cinematic ambient background glow inside modal */}
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/5 pointer-events-none z-0" />
        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <AnimatePresence mode="wait">
            {step === "form" ? (
              <motion.div
                key="form-step"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
              >
                <DialogHeader className="space-y-3">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-xs text-primary font-mono w-fit tracking-wide">
                    <Lock className="size-3" /> SECURE CHANNEL
                  </div>
                  <DialogTitle className="text-2xl font-extrabold font-display tracking-tight text-foreground">
                    Institutional Partnership
                  </DialogTitle>
                  <DialogDescription className="text-sm text-muted-foreground leading-relaxed">
                    Initiate a formal collaboration or request custom enterprise-level deployment access for research and government bodies.
                  </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="mt-6 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono" htmlFor="inst-name">
                      Full Name
                    </label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <input
                        id="inst-name"
                        required
                        type="text"
                        placeholder="Dr. Sarah Connor"
                        className="w-full pl-10 pr-4 py-2.5 bg-muted/40 border border-border/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono" htmlFor="inst-institution">
                      Institution / Agency
                    </label>
                    <div className="relative">
                      <Building className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <input
                        id="inst-institution"
                        required
                        type="text"
                        placeholder="Nasarawa State University, Keffi"
                        className="w-full pl-10 pr-4 py-2.5 bg-muted/40 border border-border/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        value={formData.institution}
                        onChange={(e) => setFormData({ ...formData, institution: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono" htmlFor="inst-email">
                      Official Email
                    </label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                      <input
                        id="inst-email"
                        required
                        type="email"
                        placeholder="s.connor@nsuk.edu.ng"
                        className="w-full pl-10 pr-4 py-2.5 bg-muted/40 border border-border/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono" htmlFor="inst-interest">
                      Collaboration Scope
                    </label>
                    <select
                      id="inst-interest"
                      className="w-full px-4 py-2.5 bg-muted/40 border border-border/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary transition-all appearance-none cursor-pointer"
                      value={formData.interest}
                      onChange={(e) => setFormData({ ...formData, interest: e.target.value })}
                    >
                      <option value="research">Geochemical Infrastructure Research</option>
                      <option value="laboratory">Analytical Facility Partnership</option>
                      <option value="enterprise">Restricted Enterprise Deployment</option>
                      <option value="pilot">University Technology Pilot Program</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground font-mono" htmlFor="inst-notes">
                      Brief Partnership Objective
                    </label>
                    <textarea
                      id="inst-notes"
                      rows={3}
                      placeholder="Outline collaboration scope or target facility infrastructure access requirements..."
                      className="w-full px-4 py-2.5 bg-muted/40 border border-border/80 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent transition-all resize-none"
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full btn-theme-cyan inline-flex items-center justify-center gap-2 mt-2 !rounded-xl"
                  >
                    {loading ? (
                      <span className="flex items-center gap-2">
                        <span className="size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                        Establishing Secure Channel...
                      </span>
                    ) : (
                      <>
                        Submit Request <ChevronRight className="size-4" />
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            ) : (
              <motion.div
                key="success-step"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="text-center py-6 space-y-6"
              >
                <div className="mx-auto size-16 rounded-full bg-primary/10 text-primary flex items-center justify-center border border-primary/20">
                  <CheckCircle className="size-8" />
                </div>

                <div className="space-y-2">
                  <h3 className="text-2xl font-extrabold tracking-tight">Request Logged</h3>
                  <p className="text-sm text-muted-foreground max-w-sm mx-auto leading-relaxed">
                    Your institutional inquiry has been logged securely under protocol key:
                  </p>
                  <div className="mt-3 px-4 py-2 rounded-lg bg-muted border border-border font-mono text-sm text-primary tracking-widest select-all inline-block">
                    GP-PARTNER-{Math.floor(1000 + Math.random() * 9000)}-X
                  </div>
                </div>

                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  Our institutional relations office will initiate contact within 24 business hours using verified cryptographic channels.
                </p>

                <button
                  type="button"
                  onClick={handleClose}
                  className="btn-theme-outline w-full !rounded-xl"
                >
                  Close Secure Channel
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </DialogContent>
    </Dialog>
  );
}

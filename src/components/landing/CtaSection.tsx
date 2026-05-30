import { Link } from "@tanstack/react-router";
import { ArrowRight, Lock } from "lucide-react";

export default function CtaSection() {
  return (
    <section className="border-t border-border bg-gradient-to-b from-primary/5 via-background to-accent/5">
      <div className="mx-auto max-w-7xl px-6 py-12 md:py-16 lg:py-20 text-center space-y-8">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-foreground font-display max-w-3xl mx-auto">
          Register to access the GeoChem customer portal
        </h2>
        <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Laboratory services at UniPod Nsuk are available to registered clients only. Create your
          account to submit specimens and receive certified analytical reports online.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link
            to="/register"
            className="inline-flex items-center gap-2 rounded-lg gradient-primary px-8 py-4 text-sm font-semibold text-white shadow-lg hover:shadow-primary/30 transition-all hover:-translate-y-0.5 font-display"
          >
            Register now <ArrowRight className="size-4" />
          </Link>
          <Link
            to="/login"
            search={{}}
            className="inline-flex items-center gap-2 rounded-lg border-2 border-primary/30 bg-card px-8 py-4 text-sm font-semibold hover:bg-primary/5 transition-all"
          >
            Sign in
          </Link>
        </div>
        <p className="inline-flex items-center gap-2 text-xs text-muted-foreground max-w-md mx-auto">
          <Lock className="size-3.5 text-primary shrink-0" />
          Portal access is granted after registration and email verification.
        </p>
      </div>
    </section>
  );
}

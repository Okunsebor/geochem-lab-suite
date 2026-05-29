import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";

export default function CtaSection() {
  return (
    <section id="security" className="border-t border-border bg-gradient-to-b from-background to-card/25">
      <div className="mx-auto max-w-7xl px-6 py-24 text-center space-y-6">
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
          Ready to digitize your lab operations?
        </h2>
        <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto leading-relaxed">
          Experience modern laboratory operations at scale. Spin up the sandbox demo system with sample barcode readers, analytical worksheets, and real Supabase integration instantly.
        </p>
        <div className="flex flex-wrap justify-center gap-3 pt-2">
          <Link to="/app" className="inline-flex items-center gap-2 rounded-lg gradient-primary px-6 py-3 text-sm font-semibold text-white shadow-md hover:shadow-lg hover:shadow-primary/10 transition-all hover:-translate-y-0.5">
            Launch live LIMS <ArrowRight className="size-4" />
          </Link>
          <Link to="/login" className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-6 py-3 text-sm font-semibold hover:bg-muted text-foreground transition-all hover:-translate-y-0.5">
            Sign in to custody
          </Link>
        </div>
      </div>
    </section>
  );
}

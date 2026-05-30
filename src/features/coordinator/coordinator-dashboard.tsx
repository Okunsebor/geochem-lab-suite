import { Link } from "@tanstack/react-router";
import { ScanBarcode, Workflow, Beaker, ShieldCheck, ArrowRight } from "lucide-react";
import { StatCard } from "@/components/shared/StatCard";
import { useLimsState } from "@/hooks/use-lims-state";

export function CoordinatorDashboardFeature() {
  const { samples } = useLimsState();
  const inPrep = samples.filter((s) => s.status === "In Preparation").length;
  const inAnalysis = samples.filter((s) => s.status === "In Analysis").length;
  const qaFlagged = samples.filter((s) => s.status === "Verified" && s.priority === "High").length;

  return (
    <div className="space-y-8">
      <div>
        <p className="text-[10px] font-bold font-mono uppercase tracking-widest text-accent">Lab Coordinator Portal</p>
        <h1 className="text-2xl font-bold text-foreground tracking-tight font-display mt-1">
          Operations command center
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage intake, preparation queues, analysis handoffs, and QA/QC escalations.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="In preparation" value={String(inPrep)} icon={<Workflow className="size-4" />} />
        <StatCard label="In analysis" value={String(inAnalysis)} icon={<Beaker className="size-4" />} />
        <StatCard label="QA flagged" value={String(qaFlagged)} icon={<ShieldCheck className="size-4" />} />
        <StatCard label="Active samples" value={String(samples.length)} icon={<ScanBarcode className="size-4" />} />
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { to: "/coordinator/intake", label: "Sample intake", icon: ScanBarcode },
          { to: "/coordinator/preparation", label: "Preparation board", icon: Workflow },
          { to: "/coordinator/analysis", label: "Analysis queue", icon: Beaker },
          { to: "/coordinator/qa-qc", label: "QA / QC monitor", icon: ShieldCheck },
        ].map((card) => (
          <Link
            key={card.to}
            to={card.to}
            className="group rounded-xl border border-border bg-card/80 backdrop-blur-sm p-5 hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5 transition-all"
          >
            <card.icon className="size-5 text-primary mb-3" />
            <p className="font-bold text-sm text-foreground group-hover:text-primary transition-colors">{card.label}</p>
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground mt-2 group-hover:text-primary">
              Open <ArrowRight className="size-3" />
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

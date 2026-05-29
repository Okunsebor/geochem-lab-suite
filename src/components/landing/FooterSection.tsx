import { FlaskConical } from "lucide-react";

export default function FooterSection() {
  return (
    <footer className="border-t border-border bg-muted/10">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-6 py-10 text-xs sm:text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <div className="grid size-6 place-items-center rounded bg-primary text-white font-bold"><FlaskConical className="size-3" /></div>
          <span className="font-semibold text-foreground">© 2026 GeoChem Suite · ISO 17025 Compliant LIMS.</span>
        </div>
        <div className="flex gap-6 font-semibold">
          <a href="#" className="hover:text-primary transition-colors">Documentation</a>
          <a href="#" className="hover:text-primary transition-colors">Security Audit</a>
          <a href="#" className="hover:text-primary transition-colors">Contact Support</a>
        </div>
      </div>
    </footer>
  );
}

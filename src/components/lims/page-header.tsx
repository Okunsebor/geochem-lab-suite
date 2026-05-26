import type { ReactNode } from "react";

interface Crumb { label: string; to?: string }
export function PageHeader({
  title, description, actions, crumbs,
}: { title: string; description?: string; actions?: ReactNode; crumbs?: Crumb[] }) {
  return (
    <div className="flex flex-col gap-3 border-b border-border pb-5">
      {crumbs && (
        <nav className="flex items-center gap-1.5 text-xs text-muted-foreground">
          {crumbs.map((c, i) => (
            <span key={i} className="flex items-center gap-1.5">
              {i > 0 && <span className="opacity-50">/</span>}
              <span className={i === crumbs.length - 1 ? "text-foreground" : ""}>{c.label}</span>
            </span>
          ))}
        </nav>
      )}
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">{title}</h1>
          {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
        </div>
        {actions && <div className="flex items-center gap-2">{actions}</div>}
      </div>
    </div>
  );
}

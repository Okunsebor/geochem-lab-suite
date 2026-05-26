import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/app/settings/")({ component: Org });

function Org() {
  return (
    <div className="space-y-6">
      <Section title="Organization">
        {[["Name","GeoChem Labs Inc."],["Workspace URL","geochemlabs.suite.io"],["Timezone","UTC+01 · Lagos"],["Default currency","USD"]].map(f=>(
          <Field key={f[0]} label={f[0]} value={f[1]}/>
        ))}
      </Section>
      <Section title="Billing">
        <div className="rounded-lg border border-border p-4">
          <p className="text-sm font-medium">Enterprise Plan</p>
          <p className="text-xs text-muted-foreground">Unlimited samples · 50 users · ISO 17025 templates</p>
          <button className="mt-3 rounded-md gradient-primary px-3 py-1.5 text-xs text-white">Manage plan</button>
        </div>
      </Section>
    </div>
  );
}

export function Section({title,children}:{title:string;children:React.ReactNode}) {
  return <div className="rounded-xl border border-border bg-card p-6"><h2 className="text-base font-semibold">{title}</h2><div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div></div>;
}
export function Field({label,value}:{label:string;value:string}) {
  return <div><label className="text-xs font-medium">{label}</label><input defaultValue={value} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"/></div>;
}

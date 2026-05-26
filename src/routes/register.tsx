import { createFileRoute, Link } from "@tanstack/react-router";
import { FlaskConical } from "lucide-react";

export const Route = createFileRoute("/register")({ component: Register });

function Register() {
  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="w-full max-w-md rounded-xl border border-border bg-card p-8">
        <Link to="/" className="flex items-center gap-2"><div className="grid size-8 place-items-center rounded-md gradient-primary text-white"><FlaskConical className="size-4" /></div><span className="font-semibold">GeoChem Suite</span></Link>
        <h1 className="mt-6 text-2xl font-semibold">Request access</h1>
        <p className="mt-1 text-sm text-muted-foreground">Set up your organization workspace.</p>
        <form className="mt-6 space-y-3" onSubmit={(e) => { e.preventDefault(); window.location.href = "/app"; }}>
          {[["Full name","Adaeze Nwosu"],["Work email","you@lab.com"],["Organization","GeoChem Labs"],["Role","Laboratory Manager"]].map(([l,p]) => (
            <div key={l}>
              <label className="text-xs font-medium">{l}</label>
              <input placeholder={p} className="mt-1 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" />
            </div>
          ))}
          <button className="w-full rounded-md gradient-primary px-3 py-2 text-sm font-medium text-white">Create workspace</button>
        </form>
      </div>
    </div>
  );
}

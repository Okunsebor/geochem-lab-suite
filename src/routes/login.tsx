import { createFileRoute, Link } from "@tanstack/react-router";
import { FlaskConical, Mail, Lock, ArrowRight } from "lucide-react";

export const Route = createFileRoute("/login")({ component: Login });

function Login() {
  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden lg:flex relative flex-col justify-between p-10 bg-sidebar text-sidebar-foreground overflow-hidden">
        <div className="absolute inset-0 gradient-mesh opacity-50" />
        <div className="relative">
          <Link to="/" className="flex items-center gap-2">
            <div className="grid size-9 place-items-center rounded-md gradient-primary text-white"><FlaskConical className="size-4" /></div>
            <span className="text-white font-semibold">GeoChem Suite</span>
          </Link>
        </div>
        <div className="relative">
          <blockquote className="text-xl text-white/90 leading-snug">
            "GeoChem replaced four spreadsheets and a paper logbook. Turnaround dropped from 9 days to 3."
          </blockquote>
          <p className="mt-4 text-sm text-sidebar-foreground/70">— Lab Manager, Auric Mining Ltd</p>
        </div>
      </div>
      <div className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-sm">
          <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
          <p className="mt-1 text-sm text-muted-foreground">Sign in to continue to GeoChem Suite.</p>
          <form className="mt-8 space-y-4" onSubmit={(e) => { e.preventDefault(); window.location.href = "/app"; }}>
            <div>
              <label className="text-xs font-medium">Email</label>
              <div className="mt-1 relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input defaultValue="adaeze@geochem.io" className="w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm" />
              </div>
            </div>
            <div>
              <div className="flex justify-between">
                <label className="text-xs font-medium">Password</label>
                <a href="#" className="text-xs text-primary hover:underline">Forgot?</a>
              </div>
              <div className="mt-1 relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <input type="password" defaultValue="••••••••" className="w-full rounded-md border border-input bg-background pl-9 pr-3 py-2 text-sm" />
              </div>
            </div>
            <label className="flex items-center gap-2 text-xs"><input type="checkbox" defaultChecked /> Keep me signed in</label>
            <button className="w-full inline-flex items-center justify-center gap-1.5 rounded-md gradient-primary px-3 py-2 text-sm font-medium text-white">
              Sign in <ArrowRight className="size-4" />
            </button>
          </form>
          <div className="mt-6 grid grid-cols-3 gap-2">
            {["Admin", "Lab Staff", "Customer"].map((r) => (
              <Link key={r} to="/app" className="rounded-md border border-border bg-card px-2 py-2 text-xs text-center hover:border-primary/40">
                Enter as {r}
              </Link>
            ))}
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            No account? <Link to="/register" className="text-primary hover:underline">Request access</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

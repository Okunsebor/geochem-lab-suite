import { createFileRoute } from "@tanstack/react-router";
import { Section } from "./app.settings.index";

export const Route = createFileRoute("/app/settings/branding")({ component: Branding });
function Branding(){return(<Section title="Report Branding">
  <div><label className="text-xs font-medium">Primary color</label><div className="mt-1 flex gap-2">{["#2563eb","#059669","#9333ea","#f59e0b","#ef4444"].map(c=><button key={c} className="size-8 rounded-md border border-border" style={{background:c}}/>)}</div></div>
  <div><label className="text-xs font-medium">Logo</label><div className="mt-1 grid h-20 place-items-center rounded-md border-2 border-dashed border-border text-xs text-muted-foreground">Upload</div></div>
  <div className="sm:col-span-2"><label className="text-xs font-medium">Report footer</label><textarea defaultValue="© GeoChem Labs Inc. · ISO 17025 Accredited · contact@geochem.io" className="mt-1 w-full rounded-md border border-input bg-background p-2 text-sm min-h-[80px]"/></div>
</Section>);}

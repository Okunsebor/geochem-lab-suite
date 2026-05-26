import { createFileRoute } from "@tanstack/react-router";
import { Section } from "./app.settings.index";

export const Route = createFileRoute("/app/settings/api")({ component: ApiKeys });
function ApiKeys(){return(<><Section title="API Keys">
  <div className="sm:col-span-2 rounded-lg border border-border p-3 text-sm font-mono">sk_live_••••••••••••••a92f <button className="ml-2 text-xs text-primary">Reveal</button></div>
  <button className="sm:col-span-2 rounded-md gradient-primary px-3 py-2 text-xs text-white">Create new key</button>
</Section>
<Section title="Webhooks">
  {["sample.created","report.approved","qa.flag.raised"].map((e)=>(
    <div key={e} className="sm:col-span-2 flex items-center justify-between rounded border border-border px-3 py-2 text-sm">
      <span className="font-mono">{e}</span>
      <span className="text-xs text-muted-foreground">https://hooks.geochem.io/{e}</span>
    </div>
  ))}
</Section></>);}

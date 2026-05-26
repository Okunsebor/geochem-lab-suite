import { createFileRoute } from "@tanstack/react-router";
import { Section } from "./app.settings.index";

export const Route = createFileRoute("/app/settings/security")({ component: Sec });
function Sec(){return(<><Section title="Security">
  {[["Require 2FA","All users must enable two-factor"],["SSO (SAML)","Connect identity provider"],["Session timeout","30 minutes idle"],["IP allowlist","Restrict by IP range"]].map((r)=>(
    <label key={r[0]} className="sm:col-span-2 flex items-center justify-between rounded border border-border px-3 py-2.5 text-sm">
      <div><p className="font-medium">{r[0]}</p><p className="text-xs text-muted-foreground">{r[1]}</p></div>
      <input type="checkbox" defaultChecked={r[0].includes("2FA")}/>
    </label>
  ))}
</Section></>);}

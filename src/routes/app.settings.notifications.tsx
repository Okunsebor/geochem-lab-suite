import { createFileRoute } from "@tanstack/react-router";
import { Section } from "./app.settings.index";

export const Route = createFileRoute("/app/settings/notifications")({ component: Notif });
function Notif(){return(<Section title="Notification Preferences">
  {["Report awaiting approval","QA anomaly raised","Sample overdue","Instrument calibration due","Weekly summary"].map((t)=>(
    <label key={t} className="sm:col-span-2 flex items-center justify-between rounded border border-border px-3 py-2.5 text-sm"><span>{t}</span><input type="checkbox" defaultChecked/></label>
  ))}
</Section>);}

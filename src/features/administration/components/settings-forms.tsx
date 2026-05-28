import React from "react";
import { toast } from "sonner";
import { InputField, CheckboxField, TextAreaField } from "../../../components/shared/form-controls";
import { useLimsState } from "../../../hooks/use-lims-state";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">{children}</div>
    </div>
  );
}

// 1. Organization Settings
export function OrgSettingsFields() {
  const { settings, updateSettings } = useLimsState();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    updateSettings({
      orgName: data.get("orgName") as string,
      orgUrl: data.get("orgUrl") as string,
      timezone: data.get("timezone") as string,
      currency: data.get("currency") as string,
    });
    toast.success("Organization preferences saved successfully");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Section title="Organization">
        <InputField label="Name" name="orgName" defaultValue={settings.orgName} />
        <InputField label="Workspace URL" name="orgUrl" defaultValue={settings.orgUrl} />
        <InputField label="Timezone" name="timezone" defaultValue={settings.timezone} />
        <InputField label="Default currency" name="currency" defaultValue={settings.currency} />
      </Section>
      
      <Section title="Billing">
        <div className="rounded-lg border border-border p-4 bg-muted/10 sm:col-span-2">
          <p className="text-sm font-semibold text-foreground">Enterprise Plan</p>
          <p className="text-xs text-muted-foreground mt-0.5 font-medium leading-normal">
            Unlimited samples · 50 users · ISO 17025 templates
          </p>
          <button
            type="button"
            onClick={() => toast.success("Opening billing dashboard...")}
            className="mt-3 rounded-md gradient-primary px-3 py-1.5 text-xs text-white font-semibold cursor-pointer hover:opacity-90 shadow-sm transition"
          >
            Manage plan
          </button>
        </div>
      </Section>
      
      <div className="flex justify-end">
        <button
          type="submit"
          className="rounded-md gradient-primary px-4 py-2 text-sm text-white font-semibold cursor-pointer hover:opacity-90 transition"
        >
          Save preferences
        </button>
      </div>
    </form>
  );
}

// 2. Laboratory Settings
export function LabSettingsFields() {
  const { settings, updateSettings } = useLimsState();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    updateSettings({
      labProtocol: data.get("labProtocol") as string,
      calInterval: data.get("calInterval") as string,
      auditRetention: data.get("auditRetention") as string,
      matrixType: data.get("matrixType") as string,
    });
    toast.success("Laboratory standards configurations saved");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Section title="Laboratory Standard Configurations">
        <InputField label="Standard Protocol" name="labProtocol" defaultValue={settings.labProtocol} />
        <InputField label="Default Calibration Interval" name="calInterval" defaultValue={settings.calInterval} />
        <InputField label="Audit Log Retention" name="auditRetention" defaultValue={settings.auditRetention} />
        <InputField label="Default Matrix Type" name="matrixType" defaultValue={settings.matrixType} />
      </Section>
      <div className="flex justify-end">
        <button
          type="submit"
          className="rounded-md gradient-primary px-4 py-2 text-sm text-white font-semibold cursor-pointer hover:opacity-90 transition"
        >
          Save laboratory configs
        </button>
      </div>
    </form>
  );
}

// 3. Branding Settings
export function BrandingSettingsFields() {
  const { settings, updateSettings } = useLimsState();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    updateSettings({
      reportFooter: data.get("reportFooter") as string,
    });
    toast.success("Certificate layout branding saved");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Section title="Report Branding">
        <div className="space-y-1">
          <label className="text-xs font-semibold text-foreground">Primary color</label>
          <div className="mt-1 flex gap-2">
            {["#2563eb", "#059669", "#9333ea", "#f59e0b", "#ef4444"].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  updateSettings({ primaryColor: c });
                  toast.success(`Selected theme primary: ${c}`);
                }}
                className={`size-8 rounded-md border cursor-pointer transition-all hover:scale-105 ${
                  settings.primaryColor === c ? "border-foreground ring-2 ring-primary scale-110" : "border-border"
                }`}
                style={{ background: c }}
              />
            ))}
          </div>
        </div>
        
        <div>
          <label className="text-xs font-semibold text-foreground">Logo</label>
          <div
            onClick={() => toast.success("Opening logo selector...")}
            className="mt-1 grid h-20 place-items-center rounded-md border-2 border-dashed border-border text-xs text-muted-foreground font-semibold cursor-pointer hover:bg-muted/30 transition-colors"
          >
            Upload (Click to browse)
          </div>
        </div>
        
        <div className="sm:col-span-2">
          <TextAreaField
            label="Report footer"
            name="reportFooter"
            defaultValue={settings.reportFooter}
          />
        </div>
      </Section>
      <div className="flex justify-end">
        <button
          type="submit"
          className="rounded-md gradient-primary px-4 py-2 text-sm text-white font-semibold cursor-pointer hover:opacity-90 transition"
        >
          Save branding
        </button>
      </div>
    </form>
  );
}

// 4. Notifications Settings
export function NotificationsSettingsFields() {
  const { settings, updateSettings } = useLimsState();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    const selectedTriggers = data.getAll("triggers") as string[];
    updateSettings({
      triggers: selectedTriggers,
    });
    toast.success("Notification preferences synchronized");
  };

  const triggersList = [
    "Report awaiting approval",
    "QA anomaly raised",
    "Sample overdue",
    "Instrument calibration due",
    "New customer signup",
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Section title="Alerts & Notification Subscriptions">
        <div className="sm:col-span-2 space-y-3">
          {triggersList.map((t) => (
            <CheckboxField
              key={t}
              label={t}
              name="triggers"
              value={t}
              defaultChecked={settings.triggers?.includes(t)}
            />
          ))}
        </div>
      </Section>
      <div className="flex justify-end">
        <button
          type="submit"
          className="rounded-md gradient-primary px-4 py-2 text-sm text-white font-semibold cursor-pointer hover:opacity-90 transition"
        >
          Save alert triggers
        </button>
      </div>
    </form>
  );
}

// 5. Security Settings
export function SecuritySettingsFields() {
  const { settings, updateSettings } = useLimsState();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    updateSettings({
      require2fa: data.get("require2fa") === "on",
      sessionExpire: data.get("sessionExpire") === "on",
      passRotation: data.get("passRotation") as string,
      maxFailures: data.get("maxFailures") as string,
    });
    toast.success("Security policies saved successfully");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Section title="Security & Authentication Policies">
        <CheckboxField
          label="Require Two-Factor Authentication (2FA) for admin roles"
          name="require2fa"
          defaultChecked={settings.require2fa}
        />
        <CheckboxField
          label="Auto-expire session after 15 minutes of inactivity"
          name="sessionExpire"
          defaultChecked={settings.sessionExpire}
        />
        <InputField
          label="Password rotation interval"
          name="passRotation"
          defaultValue={settings.passRotation}
          containerClassName="mt-2"
        />
        <InputField
          label="Max login failures before lockout"
          name="maxFailures"
          defaultValue={settings.maxFailures}
          containerClassName="mt-2"
        />
      </Section>
      <div className="flex justify-end">
        <button
          type="submit"
          className="rounded-md gradient-primary px-4 py-2 text-sm text-white font-semibold cursor-pointer hover:opacity-90 transition"
        >
          Save security setup
        </button>
      </div>
    </form>
  );
}

// 6. API & Webhooks Settings
export function ApiWebhooksFields() {
  const { settings, updateSettings } = useLimsState();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const data = new FormData(e.currentTarget);
    updateSettings({
      webhookUrl: data.get("webhookUrl") as string,
    });
    toast.success("API keys and webhook endpoints stored");
  };

  const handleRegenerateKey = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let newKey = "sk_live_";
    for (let i = 0; i < 32; i++) {
      newKey += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    updateSettings({ apiKey: newKey });
    toast.success("New API key regenerated successfully!");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Section title="API Keys & Webhooks integrations">
        <div className="sm:col-span-2 space-y-4">
          <InputField
            label="Live Secret API Key"
            type="password"
            value={settings.apiKey}
            disabled
          />
          <button
            type="button"
            onClick={handleRegenerateKey}
            className="rounded border border-border bg-background px-2.5 py-1 text-xs hover:bg-muted font-semibold cursor-pointer transition"
          >
            Regenerate key
          </button>
          
          <div className="border-t border-border pt-4 mt-2">
            <InputField
              label="Webhook Ingestion Endpoint"
              name="webhookUrl"
              defaultValue={settings.webhookUrl}
            />
            <InputField
              label="Secret Signing Hash"
              type="password"
              value={settings.webhookHash}
              disabled
            />
          </div>
        </div>
      </Section>
      <div className="flex justify-end">
        <button
          type="submit"
          className="rounded-md gradient-primary px-4 py-2 text-sm text-white font-semibold cursor-pointer hover:opacity-90 transition"
        >
          Save API settings
        </button>
      </div>
    </form>
  );
}

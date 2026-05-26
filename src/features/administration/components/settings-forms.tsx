import React from "react";
import { toast } from "sonner";
import { InputField, CheckboxField, TextAreaField } from "../../../components/shared/form-controls";

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
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Organization preferences saved successfully");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Section title="Organization">
        <InputField label="Name" defaultValue="GeoChem Labs Inc." />
        <InputField label="Workspace URL" defaultValue="geochemlabs.suite.io" />
        <InputField label="Timezone" defaultValue="UTC+01 · Lagos" />
        <InputField label="Default currency" defaultValue="USD" />
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
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Laboratory standards configurations saved");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Section title="Laboratory Standard Configurations">
        <InputField label="Standard Protocol" defaultValue="ISO 17025 Accreditation" />
        <InputField label="Default Calibration Interval" defaultValue="14 days" />
        <InputField label="Audit Log Retention" defaultValue="7 years" />
        <InputField label="Default Matrix Type" defaultValue="Sulphide" />
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
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
                onClick={() => toast.success(`Selected theme primary: ${c}`)}
                className="size-8 rounded-md border border-border cursor-pointer transition hover:scale-105"
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
            defaultValue="© GeoChem Labs Inc. · ISO 17025 Accredited · contact@geochem.io"
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
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Notification preferences synchronized");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Section title="Alerts & Notification Subscriptions">
        <div className="sm:col-span-2 space-y-3">
          {[
            "Report awaiting approval",
            "QA anomaly raised",
            "Sample overdue",
            "Instrument calibration due",
            "New customer signup",
          ].map((t) => (
            <CheckboxField key={t} label={t} defaultChecked />
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
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Security policies saved successfully");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Section title="Security & Authentication Policies">
        <CheckboxField label="Require Two-Factor Authentication (2FA) for admin roles" defaultChecked />
        <CheckboxField label="Auto-expire session after 15 minutes of inactivity" defaultChecked />
        <InputField label="Password rotation interval" defaultValue="90 days" containerClassName="mt-2" />
        <InputField label="Max login failures before lockout" defaultValue="5 attempts" containerClassName="mt-2" />
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
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("API keys and webhook endpoints stored");
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Section title="API Keys & Webhooks integrations">
        <div className="sm:col-span-2 space-y-4">
          <InputField
            label="Live Secret API Key"
            type="password"
            defaultValue="sk_live_51Ny931Jkdsj92842Jksdlf..."
            disabled
          />
          <button
            type="button"
            onClick={() => toast.success("New API key regenerated successfully!")}
            className="rounded border border-border bg-background px-2.5 py-1 text-xs hover:bg-muted font-semibold cursor-pointer transition"
          >
            Regenerate key
          </button>
          
          <div className="border-t border-border pt-4 mt-2">
            <InputField label="Webhook Ingestion Endpoint" defaultValue="https://api.geochemlabs.io/v1/webhooks" />
            <InputField label="Secret Signing Hash" type="password" defaultValue="whsec_kdjf892429..." disabled />
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

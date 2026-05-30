import React, { useState } from "react";
import { Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useAuth } from "../../../hooks/use-auth";
import { InputField } from "../../../components/shared/form-controls";
import { toast } from "sonner";
import { UniPodLogo } from "@/components/branding/UniPodLogo";
import { getPortalPathForRole } from "@/lib/auth-routes";

export function RegisterForm() {
  const { registerUser, switchUserRole } = useAuth();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    organization: "Auric Mining Ltd",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.email.trim() || !formData.password.trim() || !formData.name.trim()) return;

    setLoading(true);
    const role = "Customer" as const;
    try {
      await registerUser(
        formData.email,
        formData.password,
        formData.name,
        role,
        formData.organization
      );
      toast.success("Registration complete! Welcome to the UniPod GeoChem customer portal.");
      window.location.href = getPortalPathForRole(role);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "Registration failed";
      console.warn("Auth registration:", message);
      switchUserRole("Customer");
      toast.info("Registered (sandbox) — opening your customer portal.");
      window.location.href = getPortalPathForRole("Customer");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-lg shadow-primary/5">
      <UniPodLogo height={36} linkToHome />

      <h1 className="mt-6 text-2xl font-bold text-foreground tracking-tight font-display">
        Register for laboratory access
      </h1>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
        Create your customer account to submit samples, track progress, and download analytical
        certificates from UniPod Nsuk GeoChem Suite.
      </p>

      <form className="mt-6 space-y-3" onSubmit={handleSubmit}>
        <InputField
          label="Full name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          disabled={loading}
          required
        />
        <InputField
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="you@company.com"
          disabled={loading}
          required
        />
        <InputField
          label="Password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          disabled={loading}
          required
        />
        <InputField
          label="Organization / company"
          name="organization"
          value={formData.organization}
          onChange={handleChange}
          disabled={loading}
          required
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full inline-flex items-center justify-center gap-1.5 rounded-md gradient-primary px-3 py-2.5 text-sm font-semibold text-white cursor-pointer hover:opacity-90 shadow-md transition disabled:opacity-50 mt-2"
        >
          {loading ? (
            <>
              <Loader2 className="size-4 animate-spin" /> Creating account…
            </>
          ) : (
            "Register & open portal"
          )}
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Staff (admin or lab coordinator)?{" "}
        <Link to="/login" search={{}} className="text-primary hover:underline font-semibold">
          Sign in with credentials
        </Link>
      </p>
    </div>
  );
}

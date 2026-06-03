import React, { useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { useAuth, formatAuthError } from "../../../hooks/use-auth";
import { InputField } from "../../../components/shared/form-controls";
import { toast } from "sonner";
import { UniPodLogo } from "@/components/branding/UniPodLogo";
import { getVerifyEmailPath } from "@/lib/auth-routes";

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  organization: string;
  phone: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  firstName?: string;
  lastName?: string;
  email?: string;
  organization?: string;
  phone?: string;
  password?: string;
  confirmPassword?: string;
}

function validateForm(data: FormState): FormErrors {
  const errors: FormErrors = {};
  if (!data.firstName.trim()) errors.firstName = "First name is required.";
  if (!data.lastName.trim()) errors.lastName = "Last name is required.";
  if (!data.email.trim()) errors.email = "Email address is required.";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) errors.email = "Enter a valid email address.";
  if (!data.organization.trim()) errors.organization = "Organization is required.";
  if (!data.phone.trim()) errors.phone = "Phone number is required.";
  if (!data.password) errors.password = "Password is required.";
  else if (data.password.length < 8) errors.password = "Password must be at least 8 characters.";
  if (data.password !== data.confirmPassword) errors.confirmPassword = "Passwords do not match.";
  return errors;
}

export function RegisterForm() {
  const { registerUser } = useAuth();
  const navigate = useNavigate();
  const [formData, setFormData] = useState<FormState>({
    firstName: "",
    lastName: "",
    email: "",
    organization: "",
    phone: "",
    password: "",
    confirmPassword: "",
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateForm(formData);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      return;
    }

    setLoading(true);
    try {
      const result = await registerUser({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        organization: formData.organization,
        phone: formData.phone,
      });
      if (result.needsVerification) {
        toast.success(
          result.verificationEmailSent
            ? "Verification code sent. Check your inbox and spam folder."
            : "Continue verification with the latest code we sent you."
        );
        await navigate({ to: getVerifyEmailPath(result.email) });
      } else {
        toast.success("Account created. You can sign in now.");
        await navigate({ to: "/login", search: { intent: "portal" } });
      }
    } catch (err: unknown) {
      toast.error(formatAuthError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md rounded-xl border border-border bg-card p-8 shadow-lg shadow-primary/5">
      <UniPodLogo height={36} linkToHome />

      <h1 className="mt-6 text-2xl font-bold text-foreground tracking-tight font-display">
        Create your account
      </h1>
      <p className="mt-2 text-sm text-muted-foreground leading-relaxed">
        Register as a UniPod GeoChem customer to submit samples, track progress, and
        download analytical certificates.
      </p>

      <form className="mt-6 space-y-3" onSubmit={handleSubmit} noValidate>
        <div className="grid grid-cols-2 gap-3">
          <InputField
            label="First name"
            name="firstName"
            value={formData.firstName}
            onChange={handleChange}
            disabled={loading}
            error={errors.firstName}
            required
            autoComplete="given-name"
          />
          <InputField
            label="Last name"
            name="lastName"
            value={formData.lastName}
            onChange={handleChange}
            disabled={loading}
            error={errors.lastName}
            required
            autoComplete="family-name"
          />
        </div>
        <InputField
          label="Email address"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
          placeholder="you@company.com"
          disabled={loading}
          error={errors.email}
          required
          autoComplete="email"
        />
        <InputField
          label="Organization"
          name="organization"
          value={formData.organization}
          onChange={handleChange}
          placeholder="Your company or institution"
          disabled={loading}
          error={errors.organization}
          required
          autoComplete="organization"
        />
        <InputField
          label="Phone number"
          name="phone"
          type="tel"
          value={formData.phone}
          onChange={handleChange}
          placeholder="+234 ..."
          disabled={loading}
          error={errors.phone}
          required
          autoComplete="tel"
        />
        <InputField
          label="Password"
          name="password"
          type="password"
          value={formData.password}
          onChange={handleChange}
          disabled={loading}
          error={errors.password}
          required
          autoComplete="new-password"
        />
        <InputField
          label="Confirm password"
          name="confirmPassword"
          type="password"
          value={formData.confirmPassword}
          onChange={handleChange}
          disabled={loading}
          error={errors.confirmPassword}
          required
          autoComplete="new-password"
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
            "Create account"
          )}
        </button>
      </form>

      <p className="mt-4 text-center text-xs text-muted-foreground">
        Already registered?{" "}
        <Link to="/login" search={{ intent: "portal" }} className="text-primary hover:underline font-semibold">
          Sign in to your portal
        </Link>
      </p>
      <p className="mt-2 text-center text-xs text-muted-foreground">
        Laboratory staff?{" "}
        <Link to="/login" search={{}} className="text-primary hover:underline font-semibold">
          Staff sign in
        </Link>
      </p>
    </div>
  );
}

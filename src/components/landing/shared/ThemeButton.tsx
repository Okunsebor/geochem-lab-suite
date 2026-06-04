import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "cyan" | "gold" | "outline";

const variantClass: Record<Variant, string> = {
  cyan: "btn-theme-cyan",
  gold: "btn-theme-gold",
  outline: "btn-theme-outline",
};

type BaseProps = {
  children: ReactNode;
  className?: string;
  variant?: Variant;
};

type ButtonProps = BaseProps & React.ButtonHTMLAttributes<HTMLButtonElement>;
type LinkProps = BaseProps & {
  to: string;
  search?: Record<string, unknown>;
};

export function ThemeButton({ children, className, variant = "cyan", ...props }: ButtonProps) {
  return (
    <button type="button" className={cn(variantClass[variant], className)} {...props}>
      {children}
    </button>
  );
}

export function ThemeLink({ children, className, variant = "cyan", to, search }: LinkProps) {
  const linkProps = search !== undefined ? { to, search } : { to };
  return (
    <Link
      {...linkProps}
      className={cn(
        variantClass[variant],
        "inline-flex items-center justify-center gap-2",
        className,
      )}
    >
      {children}
    </Link>
  );
}

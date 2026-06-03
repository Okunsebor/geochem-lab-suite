import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium interactive-motion interactive-button focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default:
          "border border-transparent bg-primary text-primary-foreground shadow hover:bg-primary/90 hover:border-primary/30 hover:shadow-[0_4px_12px_rgba(37,99,235,0.35)]",
        destructive:
          "border border-transparent bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90 hover:border-destructive/30 hover:shadow-[0_4px_12px_rgba(239,68,68,0.28)]",
        outline:
          "border border-input bg-background shadow-sm hover:border-slate-300 hover:bg-accent hover:text-accent-foreground hover:shadow-[var(--elevation-2)]",
        secondary:
          "border border-transparent bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80 hover:border-slate-300 hover:shadow-[var(--elevation-2)]",
        ghost:
          "border border-transparent hover:border-border hover:bg-accent hover:text-accent-foreground hover:shadow-[var(--elevation-1)]",
        link: "text-primary underline-offset-4 hover:underline hover:!translate-y-0 active:!translate-y-0 hover:shadow-none active:shadow-none",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />
    );
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };

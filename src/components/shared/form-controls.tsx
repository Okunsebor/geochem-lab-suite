import React from "react";
import { cn } from "../../lib/utils";

interface InputFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  icon?: React.ReactNode;
  error?: string;
  containerClassName?: string;
}

export const InputField = React.forwardRef<HTMLInputElement, InputFieldProps>(
  ({ label, icon, error, className, containerClassName, ...props }, ref) => {
    return (
      <div className={cn("space-y-1 w-full", containerClassName)}>
        {label && <label className="text-xs font-medium text-foreground">{label}</label>}
        <div className="relative">
          {icon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground">
              {icon}
            </div>
          )}
          <input
            ref={ref}
            className={cn(
              "w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50",
              icon && "pl-9",
              error && "border-destructive focus-visible:ring-destructive",
              className,
            )}
            {...props}
          />
        </div>
        {error && <p className="text-[10px] font-medium text-destructive">{error}</p>}
      </div>
    );
  },
);
InputField.displayName = "InputField";

interface SelectFieldProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { label: string; value: string | number }[];
  containerClassName?: string;
}

export const SelectField = React.forwardRef<HTMLSelectElement, SelectFieldProps>(
  ({ label, error, options, className, containerClassName, ...props }, ref) => {
    return (
      <div className={cn("space-y-1 w-full", containerClassName)}>
        {label && <label className="text-xs font-medium text-foreground">{label}</label>}
        <select
          ref={ref}
          className={cn(
            "w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-destructive focus-visible:ring-destructive",
            className,
          )}
          {...props}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        {error && <p className="text-[10px] font-medium text-destructive">{error}</p>}
      </div>
    );
  },
);
SelectField.displayName = "SelectField";

interface TextAreaFieldProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  containerClassName?: string;
}

export const TextAreaField = React.forwardRef<HTMLTextAreaElement, TextAreaFieldProps>(
  ({ label, error, className, containerClassName, ...props }, ref) => {
    return (
      <div className={cn("space-y-1 w-full", containerClassName)}>
        {label && <label className="text-xs font-medium text-foreground">{label}</label>}
        <textarea
          ref={ref}
          className={cn(
            "w-full rounded-md border border-input bg-background p-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px]",
            error && "border-destructive focus-visible:ring-destructive",
            className,
          )}
          {...props}
        />
        {error && <p className="text-[10px] font-medium text-destructive">{error}</p>}
      </div>
    );
  },
);
TextAreaField.displayName = "TextAreaField";

interface CheckboxFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  containerClassName?: string;
}

export const CheckboxField = React.forwardRef<HTMLInputElement, CheckboxFieldProps>(
  ({ label, error, className, containerClassName, ...props }, ref) => {
    return (
      <div className={cn("space-y-1", containerClassName)}>
        <label className="inline-flex items-center gap-1.5 text-xs cursor-pointer select-none font-medium">
          <input
            ref={ref}
            type="checkbox"
            className={cn(
              "rounded border-input text-primary focus:ring-ring focus:ring-offset-background",
              className,
            )}
            {...props}
          />
          {label}
        </label>
        {error && <p className="text-[10px] font-medium text-destructive">{error}</p>}
      </div>
    );
  },
);
CheckboxField.displayName = "CheckboxField";

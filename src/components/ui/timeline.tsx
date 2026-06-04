import * as React from "react";
import { CheckCircle2, Circle } from "lucide-react";
import { cn } from "@/lib/utils";

export interface TimelineStep {
  id: string | number;
  label: string;
  description?: string;
  status: "completed" | "active" | "pending";
  icon?: React.ReactNode;
}

export interface TimelineProps extends React.HTMLAttributes<HTMLDivElement> {
  steps: TimelineStep[];
  orientation?: "horizontal" | "vertical";
  onStepClick?: (step: TimelineStep) => void;
}

export const Timeline = React.forwardRef<HTMLDivElement, TimelineProps>(
  ({ className, steps, orientation = "horizontal", onStepClick, ...props }, ref) => {
    const isHorizontal = orientation === "horizontal";

    return (
      <div
        ref={ref}
        className={cn(
          "flex w-full font-sans select-none",
          isHorizontal ? "flex-row items-center justify-between gap-4" : "flex-col gap-6",
          className,
        )}
        {...props}
      >
        {steps.map((step, idx) => {
          const isCompleted = step.status === "completed";
          const isActive = step.status === "active";

          return (
            <React.Fragment key={step.id}>
              {/* Step item */}
              <div
                onClick={() => onStepClick && onStepClick(step)}
                className={cn(
                  "flex items-start gap-3 group relative cursor-pointer active-scale-spring",
                  isHorizontal ? "flex-col items-center text-center flex-1" : "flex-row text-left",
                )}
              >
                {/* Node Container */}
                <div
                  className={cn(
                    "relative z-10 flex size-9 items-center justify-center rounded-full border-2 transition-all duration-300",
                    isCompleted
                      ? "border-primary bg-primary text-white shadow-md shadow-primary/20"
                      : isActive
                        ? "border-accent bg-accent/10 text-accent animate-pulse"
                        : "border-border bg-card text-muted-foreground group-hover:border-primary/50",
                  )}
                >
                  {step.icon ? (
                    step.icon
                  ) : isCompleted ? (
                    <CheckCircle2 className="size-5 shrink-0" />
                  ) : (
                    <span className="text-xs font-semibold font-mono">{idx + 1}</span>
                  )}
                </div>

                {/* Content */}
                <div className={cn("space-y-0.5", isHorizontal ? "mt-2" : "flex-1")}>
                  <div
                    className={cn(
                      "text-xs font-bold font-display tracking-tight transition-colors",
                      isActive ? "text-accent" : "text-foreground group-hover:text-primary",
                    )}
                  >
                    {step.label}
                  </div>
                  {step.description && (
                    <p className="text-[10px] text-muted-foreground leading-normal max-w-[150px] mx-auto">
                      {step.description}
                    </p>
                  )}
                </div>
              </div>

              {/* Line connector */}
              {idx < steps.length - 1 && (
                <div
                  className={cn(
                    "flex-1 transition-colors duration-300",
                    isHorizontal ? "h-0.5" : "w-0.5 min-h-[24px] ml-[17px] -my-2",
                    isCompleted ? "bg-primary" : "bg-border",
                  )}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  },
);

Timeline.displayName = "Timeline";

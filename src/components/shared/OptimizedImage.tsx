import type { ImgHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type Props = ImgHTMLAttributes<HTMLImageElement> & {
  /** LCP hero images � eager load + high priority */
  priority?: boolean;
};

export function OptimizedImage({
  priority = false,
  className,
  loading,
  decoding = "async",
  fetchPriority,
  ...props
}: Props) {
  return (
    <img
      {...props}
      className={cn(className)}
      loading={priority ? "eager" : loading ?? "lazy"}
      decoding={decoding}
      fetchPriority={priority ? "high" : fetchPriority}
    />
  );
}

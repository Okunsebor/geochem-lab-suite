import { Link } from "@tanstack/react-router";
import { BRAND_ASSETS } from "@/lib/branding";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  showTagline?: boolean;
  linkToHome?: boolean;
  height?: number;
};

export function UniPodLogo({ className, showTagline = false, linkToHome = true, height = 36 }: Props) {
  const img = (
    <img
      src={BRAND_ASSETS.logo}
      alt="UniPod"
      height={height}
      className={cn("h-auto w-auto object-contain", className)}
      style={{ height }}
    />
  );

  const content = (
    <div className="flex flex-col items-start gap-0.5">
      {img}
      {showTagline && (
        <span className="text-[9px] italic text-muted-foreground pl-1">powered by timbuktoo</span>
      )}
    </div>
  );

  if (linkToHome) {
    return (
      <Link to="/" className="inline-flex shrink-0">
        {content}
      </Link>
    );
  }
  return content;
}

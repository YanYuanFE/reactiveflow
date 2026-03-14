import { useId } from "react";
import { cn } from "@/lib/utils";

interface LogoIconProps {
  size?: number;
  className?: string;
}

/**
 * Gradient lightning bolt SVG — matches the generated Pulse Architecture logo.
 * Uses useId() so multiple instances don't collide on gradient IDs.
 */
export function LogoIcon({ size = 20, className }: LogoIconProps) {
  const id = useId();
  const gid = `bolt-${id}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      className={className}
    >
      <defs>
        <linearGradient
          id={gid}
          x1="12"
          y1="2"
          x2="12"
          y2="22"
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0%" stopColor="#e0e7ff" />
          <stop offset="100%" stopColor="#818cf8" />
        </linearGradient>
      </defs>
      <path
        d="M3.75 13.5 L14.25 2.25 L12 10.5 H20.25 L9.75 21.75 L12 13.5 Z"
        fill={`url(#${gid})`}
      />
    </svg>
  );
}

interface LogoProps {
  size?: "sm" | "md" | "lg";
  showText?: boolean;
  className?: string;
}

const CONTAINER = {
  sm: { box: "size-6", icon: 14 },
  md: { box: "size-8", icon: 18 },
  lg: { box: "size-10", icon: 22 },
};

const TEXT = {
  sm: "text-sm",
  md: "text-lg",
  lg: "text-xl",
};

/**
 * Full logo lockup — dark-bg bolt mark + "ReactiveFlow" wordmark.
 */
export function Logo({
  size = "md",
  showText = true,
  className,
}: LogoProps) {
  const { box, icon } = CONTAINER[size];

  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <div
        className={cn(
          "flex items-center justify-center rounded-lg bg-[#1e1b4b]",
          box,
        )}
      >
        <LogoIcon size={icon} />
      </div>
      {showText && (
        <span className={cn("font-heading font-bold", TEXT[size])}>
          ReactiveFlow
        </span>
      )}
    </div>
  );
}

import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface CircularProgressProps {
  value: number;
  max?: number;
  size?: number;
  strokeWidth?: number;
  variant?: "primary" | "accent" | "warning" | "destructive" | "success";
  className?: string;
  children?: React.ReactNode;
}

export function CircularProgress({
  value,
  max = 100,
  size = 120,
  strokeWidth = 8,
  variant = "primary",
  className,
  children,
}: CircularProgressProps) {
  const [animatedOffset, setAnimatedOffset] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const percent = Math.min(100, (value / max) * 100);
  const targetOffset = circumference - (percent / 100) * circumference;

  useEffect(() => {
    setIsAnimating(true);
    const duration = 1000;
    const startOffset = animatedOffset || circumference;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out-cubic)
      const eased = 1 - Math.pow(1 - progress, 3);
      const currentOffset = startOffset + (targetOffset - startOffset) * eased;
      
      setAnimatedOffset(currentOffset);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        setIsAnimating(false);
      }
    };

    requestAnimationFrame(animate);
  }, [value, max]);

  const gradientIds: Record<string, string> = {
    primary: "gradient-primary-ring",
    accent: "gradient-accent-ring",
    warning: "gradient-warning-ring",
    destructive: "gradient-destructive-ring",
    success: "gradient-success-ring",
  };

  const gradientColors: Record<string, [string, string, string]> = {
    primary: ["hsl(210, 100%, 60%)", "hsl(225, 100%, 65%)", "hsl(240, 100%, 70%)"],
    accent: ["hsl(180, 100%, 50%)", "hsl(190, 100%, 55%)", "hsl(200, 100%, 60%)"],
    warning: ["hsl(35, 100%, 55%)", "hsl(40, 100%, 58%)", "hsl(45, 100%, 60%)"],
    destructive: ["hsl(0, 100%, 60%)", "hsl(10, 100%, 58%)", "hsl(15, 100%, 55%)"],
    success: ["hsl(150, 100%, 45%)", "hsl(160, 100%, 43%)", "hsl(170, 100%, 40%)"],
  };

  const glowColors: Record<string, string> = {
    primary: "rgba(59, 130, 246, 0.6)",
    accent: "rgba(0, 255, 255, 0.6)",
    warning: "rgba(251, 191, 36, 0.6)",
    destructive: "rgba(239, 68, 68, 0.6)",
    success: "rgba(34, 197, 94, 0.6)",
  };

  return (
    <div className={cn("relative inline-flex items-center justify-center", className)}>
      {/* Outer glow ring */}
      <div 
        className={cn(
          "absolute rounded-full transition-opacity duration-500",
          isAnimating && "animate-pulse"
        )}
        style={{
          width: size + 10,
          height: size + 10,
          background: `radial-gradient(circle, ${glowColors[variant]} 0%, transparent 70%)`,
          opacity: 0.3,
        }}
      />
      
      <svg width={size} height={size} className="transform -rotate-90 relative z-10">
        <defs>
          {/* Enhanced gradient with 3 stops */}
          <linearGradient id={gradientIds[variant]} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={gradientColors[variant][0]}>
              <animate
                attributeName="stop-color"
                values={`${gradientColors[variant][0]};${gradientColors[variant][1]};${gradientColors[variant][0]}`}
                dur="3s"
                repeatCount="indefinite"
              />
            </stop>
            <stop offset="50%" stopColor={gradientColors[variant][1]} />
            <stop offset="100%" stopColor={gradientColors[variant][2]}>
              <animate
                attributeName="stop-color"
                values={`${gradientColors[variant][2]};${gradientColors[variant][0]};${gradientColors[variant][2]}`}
                dur="3s"
                repeatCount="indefinite"
              />
            </stop>
          </linearGradient>
          
          {/* Enhanced glow filter */}
          <filter id={`glow-${variant}`} x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="coloredBlur" />
            <feMerge>
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="coloredBlur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          {/* Drop shadow */}
          <filter id={`shadow-${variant}`}>
            <feDropShadow dx="0" dy="0" stdDeviation="3" floodColor={glowColors[variant]} floodOpacity="0.5"/>
          </filter>
        </defs>
        
        {/* Background track with subtle pattern */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth}
          opacity={0.2}
          strokeDasharray="4 2"
        />
        
        {/* Secondary background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="hsl(var(--muted))"
          strokeWidth={strokeWidth - 2}
          opacity={0.1}
        />
        
        {/* Progress arc with gradient and glow */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={`url(#${gradientIds[variant]})`}
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={animatedOffset || circumference}
          filter={`url(#glow-${variant})`}
          className="transition-none"
        />

        {/* Highlight dot at the end of progress */}
        {percent > 5 && (
          <circle
            cx={size / 2 + radius * Math.cos(Math.PI * 2 * (percent / 100) - Math.PI / 2)}
            cy={size / 2 + radius * Math.sin(Math.PI * 2 * (percent / 100) - Math.PI / 2)}
            r={strokeWidth / 2}
            fill={gradientColors[variant][0]}
            filter={`url(#shadow-${variant})`}
            className={cn(isAnimating && "animate-pulse")}
          />
        )}
      </svg>
      
      {/* Center content with glow background */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div 
          className="absolute w-3/4 h-3/4 rounded-full opacity-10"
          style={{
            background: `radial-gradient(circle, ${glowColors[variant]} 0%, transparent 70%)`,
          }}
        />
        <div className="relative z-10">
          {children}
        </div>
      </div>
    </div>
  );
}

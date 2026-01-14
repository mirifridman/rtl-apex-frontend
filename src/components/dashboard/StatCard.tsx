import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { CircularProgress } from "@/components/ui/circular-progress";
import { useEffect, useState, useRef } from "react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  maxValue?: number;
  trend?: {
    value: number;
    positive: boolean;
  };
  variant?: "default" | "primary" | "accent" | "warning" | "destructive";
  className?: string;
}

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  maxValue = 100,
  trend, 
  variant = "default",
  className 
}: StatCardProps) {
  const [animatedValue, setAnimatedValue] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isHovered, setIsHovered] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for reveal animation
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
        }
      },
      { threshold: 0.1 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isVisible) return;
    
    const numValue = typeof value === 'number' ? value : parseInt(value.toString()) || 0;
    
    if (animatedValue !== numValue) {
      setIsAnimating(true);
      const duration = 1000;
      const steps = 40;
      const stepValue = (numValue - animatedValue) / steps;
      let current = animatedValue;
      let step = 0;
      
      const interval = setInterval(() => {
        step++;
        current += stepValue;
        setAnimatedValue(Math.round(current));
        
        if (step >= steps) {
          setAnimatedValue(numValue);
          setIsAnimating(false);
          clearInterval(interval);
        }
      }, duration / steps);
      
      return () => clearInterval(interval);
    }
  }, [value, isVisible]);

  const variantStyles = {
    default: "",
    primary: "gradient-border",
    accent: "gradient-border",
    warning: "gradient-border",
    destructive: "gradient-border",
  };

  const progressVariant = {
    default: "primary" as const,
    primary: "primary" as const,
    accent: "accent" as const,
    warning: "warning" as const,
    destructive: "destructive" as const,
  };

  const valueStyles = {
    default: "text-foreground",
    primary: "text-primary text-glow-primary",
    accent: "text-accent text-glow-accent",
    warning: "text-warning text-glow-warning",
    destructive: "text-destructive text-glow-destructive",
  };

  const iconGradients = {
    default: "from-muted to-muted-foreground",
    primary: "from-primary to-blue-400",
    accent: "from-accent to-cyan-300",
    warning: "from-warning to-amber-300",
    destructive: "from-destructive to-red-400",
  };

  const glowColors = {
    default: "hsl(var(--primary) / 0.3)",
    primary: "hsl(var(--primary) / 0.4)",
    accent: "hsl(var(--accent) / 0.4)",
    warning: "hsl(var(--warning) / 0.4)",
    destructive: "hsl(var(--destructive) / 0.4)",
  };

  const numValue = typeof value === 'number' ? value : parseInt(value.toString()) || 0;

  return (
    <div
      ref={cardRef}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={cn(
        "relative p-6 rounded-3xl glass-card overflow-hidden",
        "transition-all duration-500 ease-out",
        "hover-lift group float-3d",
        variantStyles[variant],
        isVisible ? "slide-up-reveal" : "opacity-0",
        isHovered && "breathe-glow",
        className
      )}
      style={{
        '--glow-color': glowColors[variant],
      } as React.CSSProperties}
    >
      {/* Animated background gradient */}
      <div className="absolute inset-0 stat-gradient opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Holographic shimmer on hover */}
      <div className={cn(
        "absolute inset-0 opacity-0 transition-opacity duration-500",
        isHovered && "opacity-100 holo-shimmer"
      )} />

      {/* Data stream effect on top */}
      <div className={cn(
        "absolute top-0 left-0 right-0 h-[2px] opacity-0 transition-opacity duration-300",
        isHovered && "opacity-100 data-stream"
      )} />
      
      <div className="relative flex items-center justify-between">
        <div className="space-y-3 flex-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          
          {/* Value with circular progress */}
          <div className="flex items-center gap-4">
            <CircularProgress
              value={numValue}
              max={maxValue}
              size={80}
              strokeWidth={6}
              variant={progressVariant[variant]}
            >
              <span className={cn(
                "text-2xl font-black tracking-tight transition-all duration-300",
                isAnimating && "counter-animate",
                valueStyles[variant]
              )}>
                {animatedValue}
              </span>
            </CircularProgress>
          </div>
          
          {trend && (
            <p
              className={cn(
                "text-xs font-semibold flex items-center gap-1.5",
                trend.positive ? "text-success" : "text-destructive"
              )}
            >
              <span className={cn(
                "inline-block w-0 h-0 border-x-4 border-x-transparent transition-transform duration-300",
                trend.positive 
                  ? "border-b-4 border-b-success" 
                  : "border-t-4 border-t-destructive",
                isHovered && (trend.positive ? "-translate-y-1" : "translate-y-1")
              )} />
              {Math.abs(trend.value)}% מהשבוע שעבר
            </p>
          )}
        </div>
        
        {/* Icon with gradient fill and pulse */}
        <div className={cn(
          "p-4 rounded-2xl transition-all duration-500",
          "bg-gradient-to-br",
          iconGradients[variant],
          "opacity-20 group-hover:opacity-40",
          isHovered && "scale-110"
        )}>
          <Icon className={cn(
            "w-10 h-10 transition-all duration-500",
            valueStyles[variant],
            isHovered && "electric-pulse"
          )} strokeWidth={1.5} />
        </div>
      </div>

      {/* Corner accent */}
      <div className={cn(
        "absolute bottom-0 right-0 w-20 h-20 opacity-0 transition-opacity duration-500",
        isHovered && "opacity-100"
      )}>
        <svg viewBox="0 0 80 80" className="w-full h-full">
          <path 
            d="M80 80 L80 40 Q80 30 70 30 L30 30" 
            fill="none" 
            stroke={`hsl(var(--${variant === 'default' ? 'primary' : variant}))`}
            strokeWidth="1"
            opacity="0.3"
          />
        </svg>
      </div>
    </div>
  );
}

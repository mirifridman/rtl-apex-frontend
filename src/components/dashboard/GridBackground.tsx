import { cn } from "@/lib/utils";
import { useEffect, useState } from "react";

interface GridBackgroundProps {
  className?: string;
}

export function GridBackground({ className }: GridBackgroundProps) {
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const x = (e.clientX / window.innerWidth) * 100;
      const y = (e.clientY / window.innerHeight) * 100;
      setMousePosition({ x, y });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  return (
    <div className={cn("fixed inset-0 pointer-events-none overflow-hidden", className)}>
      {/* Animated Grid Pattern */}
      <div 
        className="absolute inset-0 opacity-[0.04] circuit-pattern"
        style={{
          backgroundImage: `
            linear-gradient(to right, hsl(var(--primary)) 1px, transparent 1px),
            linear-gradient(to bottom, hsl(var(--primary)) 1px, transparent 1px)
          `,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Hexagon Pattern Overlay */}
      <div className="absolute inset-0 hex-pattern opacity-50" />
      
      {/* Dynamic Spotlight following mouse */}
      <div 
        className="absolute w-[600px] h-[600px] rounded-full transition-all duration-1000 ease-out"
        style={{
          left: `${mousePosition.x}%`,
          top: `${mousePosition.y}%`,
          transform: 'translate(-50%, -50%)',
          background: `radial-gradient(circle, hsl(var(--primary) / 0.08) 0%, transparent 70%)`,
        }}
      />

      {/* Animated Energy Lines */}
      <div className="absolute inset-0 tech-lines" />

      {/* Scanning Line Effect */}
      <div className="absolute inset-0 overflow-hidden">
        <div 
          className="absolute w-full h-[2px] bg-gradient-to-r from-transparent via-primary/30 to-transparent"
          style={{
            animation: 'scanVertical 8s linear infinite',
          }}
        />
      </div>
      
      {/* Floating particles - Enhanced */}
      <div className="absolute top-[10%] right-[15%] w-3 h-3 rounded-full bg-primary/40 particle-float blur-[1px]" style={{ animationDelay: '0s' }} />
      <div className="absolute top-[30%] left-[10%] w-4 h-4 rounded-full bg-accent/30 particle-float blur-[2px]" style={{ animationDelay: '1s' }} />
      <div className="absolute top-[60%] right-[25%] w-2 h-2 rounded-full bg-success/40 particle-float" style={{ animationDelay: '2s' }} />
      <div className="absolute top-[80%] left-[30%] w-3 h-3 rounded-full bg-warning/35 particle-float blur-[1px]" style={{ animationDelay: '3s' }} />
      <div className="absolute top-[20%] left-[40%] w-3.5 h-3.5 rounded-full bg-primary/30 particle-float blur-[2px]" style={{ animationDelay: '4s' }} />
      <div className="absolute top-[50%] right-[10%] w-2 h-2 rounded-full bg-accent/40 particle-float" style={{ animationDelay: '5s' }} />
      <div className="absolute top-[70%] left-[60%] w-2.5 h-2.5 rounded-full bg-primary/35 particle-float blur-[1px]" style={{ animationDelay: '6s' }} />
      <div className="absolute top-[15%] right-[60%] w-2 h-2 rounded-full bg-success/30 particle-float" style={{ animationDelay: '7s' }} />
      
      {/* Orbiting Elements */}
      <div className="absolute top-[30%] left-[20%]">
        <div className="w-1.5 h-1.5 rounded-full bg-primary/50 orbit" style={{ animationDuration: '15s' }} />
      </div>
      <div className="absolute top-[60%] right-[30%]">
        <div className="w-2 h-2 rounded-full bg-accent/40 orbit" style={{ animationDuration: '20s', animationDirection: 'reverse' }} />
      </div>
      
      {/* Gradient orbs with animation */}
      <div className="absolute top-[5%] left-[50%] w-[500px] h-[500px] rounded-full bg-primary/5 blur-3xl animate-pulse-glow" />
      <div className="absolute bottom-[10%] right-[20%] w-[400px] h-[400px] rounded-full bg-accent/5 blur-3xl animate-pulse-glow" style={{ animationDelay: '1s' }} />
      <div className="absolute top-[40%] left-[10%] w-[300px] h-[300px] rounded-full bg-success/5 blur-3xl animate-pulse-glow" style={{ animationDelay: '2s' }} />

      {/* Morphing Background */}
      <div className="absolute inset-0 morph-bg opacity-50" />

      {/* Corner Decorations */}
      <svg className="absolute top-0 right-0 w-64 h-64 text-primary/5" viewBox="0 0 100 100">
        <path d="M100 0 L100 100 L0 100" fill="none" stroke="currentColor" strokeWidth="0.5" className="animate-pulse-glow" />
        <circle cx="100" cy="0" r="2" fill="currentColor" className="animate-pulse-glow" />
      </svg>
      <svg className="absolute bottom-0 left-0 w-64 h-64 text-accent/5" viewBox="0 0 100 100">
        <path d="M0 100 L0 0 L100 0" fill="none" stroke="currentColor" strokeWidth="0.5" className="animate-pulse-glow" />
        <circle cx="0" cy="100" r="2" fill="currentColor" className="animate-pulse-glow" />
      </svg>

      <style>{`
        @keyframes scanVertical {
          0% { top: -10%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 110%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}

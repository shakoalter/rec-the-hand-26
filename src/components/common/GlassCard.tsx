import React from 'react';
import { cn } from '../../utils/cn';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
  compact?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({
  children,
  className,
  glow = false,
  compact = false
}) => {
  return (
    <div
      className={cn(
        'glass-panel rounded-2xl transition-all duration-200',
        compact ? 'p-3' : 'p-3.5 sm:p-4',
        glow && 'neon-active',
        className
      )}
    >
      {children}
    </div>
  );
};

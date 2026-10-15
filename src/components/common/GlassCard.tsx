import React from 'react';
import { clsx } from 'clsx';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  glow?: boolean;
}

export const GlassCard: React.FC<GlassCardProps> = ({ children, className, glow = false }) => {
  return (
    <div
      className={clsx(
        'glass-panel rounded-2xl p-4 transition-all duration-200',
        glow && 'neon-active',
        className
      )}
    >
      {children}
    </div>
  );
};

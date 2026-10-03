import React from 'react';
import { Logo } from './Logo';

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  theme?: 'light' | 'dark';
  label?: string;
  fullScreen?: boolean;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = '',
  theme = 'light',
  label,
  fullScreen = false,
}) => {
  const content = (
    <div className={`flex flex-col items-center justify-center gap-3 ${className}`}>
      <div className="relative flex items-center justify-center p-2">
        {/* Subtle rotating glow ring */}
        <div className="absolute -inset-2 rounded-full border border-sky-400/30 border-t-sky-500 animate-spin [animation-duration:2.5s]" />
        
        {/* Isolated Icon-Only SVG Logo with smooth pulse */}
        <Logo variant="icon" size={size} theme={theme} isPulsing={true} />
      </div>

      {label && (
        <span
          className={`text-xs font-semibold tracking-wider uppercase animate-pulse ${
            theme === 'dark' ? 'text-slate-300' : 'text-slate-600'
          }`}
        >
          {label}
        </span>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div
        className={`fixed inset-0 z-50 flex items-center justify-center backdrop-blur-xs ${
          theme === 'dark' ? 'bg-[#0b0f19]/90' : 'bg-white/90'
        }`}
      >
        {content}
      </div>
    );
  }

  return content;
};

export default LoadingSpinner;

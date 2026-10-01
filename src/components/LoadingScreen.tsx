import React, { useEffect, useState } from 'react';
import { VaultLogo } from './VaultLogo';

interface LoadingScreenProps {
  onLoaded?: () => void;
}

export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onLoaded }) => {
  const [fading, setFading] = useState(false);
  const [hidden, setHidden] = useState(false);

  useEffect(() => {
    // Fades out smoothly after 2 seconds
    const timer = setTimeout(() => {
      setFading(true);
      const hideTimer = setTimeout(() => {
        setHidden(true);
        if (onLoaded) onLoaded();
      }, 500); // 500ms smooth fade-out animation
      return () => clearTimeout(hideTimer);
    }, 2000);

    return () => clearTimeout(timer);
  }, [onLoaded]);

  if (hidden) return null;

  return (
    <div
      id="zeropicbd-loading-screen"
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-[#0b0f19] transition-opacity duration-500 ${
        fading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Luxury Ambient Glow Orbs */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#38bdf8]/15 rounded-full blur-3xl pointer-events-none animate-pulse" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-[#fbbf24]/10 rounded-full blur-3xl pointer-events-none" />

      {/* Main Brand Container */}
      <div className="relative flex flex-col items-center z-10 px-4 text-center">
        {/* Luxury Rotating Orbit Rings around the ZeropicBD Logo */}
        <div className="relative mb-6 flex items-center justify-center p-4">
          {/* Outer Electric Sky Spin Ring */}
          <div className="absolute -inset-4 sm:-inset-6 rounded-full border border-[#38bdf8]/30 border-t-[#38bdf8] border-r-[#38bdf8] animate-spin [animation-duration:3s]" />
          
          {/* Inner Warm Gold Counter Spin Ring */}
          <div className="absolute -inset-2 sm:-inset-3 rounded-full border border-[#fbbf24]/20 border-b-[#fbbf24] border-l-[#fbbf24] animate-spin [animation-direction:reverse] [animation-duration:2s]" />

          {/* High-Resolution Pulsing Official ZeropicBD Logo */}
          <VaultLogo
            size="xl"
            isPulsing={true}
            className="transform hover:scale-105 transition-transform"
          />
        </div>

        {/* Sleek Loading Progress Bar */}
        <div className="w-56 h-1.5 bg-[#151c2c] rounded-full mt-6 overflow-hidden border border-[#1e293b] relative shadow-[0_0_15px_rgba(56,189,248,0.25)]">
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#38bdf8] to-[#fbbf24] rounded-full animate-[shimmer_1.4s_infinite] w-full" />
        </div>
      </div>
    </div>
  );
};


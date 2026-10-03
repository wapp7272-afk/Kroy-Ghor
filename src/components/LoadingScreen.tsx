import React, { useEffect } from 'react';

export interface LoadingScreenProps {
  onLoaded?: () => void;
  brandName?: string;
  tagline?: string;
  autoDismiss?: boolean;
  duration?: number;
}

/**
 * LoadingScreen (Bypassed)
 * Returns null immediately to allow instantaneous website rendering with no splash delay.
 */
export const LoadingScreen: React.FC<LoadingScreenProps> = ({ onLoaded }) => {
  useEffect(() => {
    if (onLoaded) {
      onLoaded();
    }
  }, [onLoaded]);

  return null;
};

export default LoadingScreen;

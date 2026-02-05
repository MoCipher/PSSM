import { useEffect, useState } from 'react';
import './LoadingScreen.css';

interface LoadingScreenProps {
  onLoadComplete?: () => void;
}

function LoadingScreen({ onLoadComplete }: LoadingScreenProps) {
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Wait for DOM and initial resources to load
    const timer = setTimeout(() => {
      setIsLoaded(true);
      if (onLoadComplete) {
        setTimeout(onLoadComplete, 600); // Wait for fade out animation
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [onLoadComplete]);

  return (
    <div className={`loading-screen ${isLoaded ? 'fade-out' : ''}`}>
      <div className="loading-content">
        {/* Animated lock icon */}
        <div className="lock-container">
          <div className="lock-body">
            <div className="lock-shackle"></div>
            <div className="lock-keyhole"></div>
          </div>
          <div className="security-rings">
            <div className="ring ring-1"></div>
            <div className="ring ring-2"></div>
            <div className="ring ring-3"></div>
          </div>
        </div>

        {/* App name with gradient text */}
        <h1 className="app-title">
          <span className="gradient-text">Password Manager</span>
        </h1>

        {/* Loading indicator */}
        <div className="loading-dots">
          <div className="dot"></div>
          <div className="dot"></div>
          <div className="dot"></div>
        </div>

        {/* Security tagline */}
        <p className="tagline">Securing your digital life</p>
      </div>
    </div>
  );
}

export default LoadingScreen;

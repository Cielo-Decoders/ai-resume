import React, { useEffect, useState } from 'react';

export default function LoadingScreen() {
  const [progress, setProgress] = useState(0);
  const [fadeIn, setFadeIn] = useState(false);

  useEffect(() => {
    // Trigger fade-in on mount
    const fadeTimer = setTimeout(() => setFadeIn(true), 50);

    // Animate progress bar
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 2;
      });
    }, 30);

    return () => {
      clearTimeout(fadeTimer);
      clearInterval(interval);
    };
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 flex flex-col items-center justify-center relative overflow-hidden">

      {/* Soft background blobs */}
      <div className="absolute top-[-80px] left-[-80px] w-72 h-72 bg-indigo-200 rounded-full opacity-30 blur-3xl animate-pulse" />
      <div className="absolute bottom-[-80px] right-[-80px] w-72 h-72 bg-purple-200 rounded-full opacity-30 blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />

      {/* Main content */}
      <div
        className="flex flex-col items-center gap-6 z-10 transition-all duration-700 ease-out"
        style={{
          opacity: fadeIn ? 1 : 0,
          transform: fadeIn ? 'scale(1) translateY(0)' : 'scale(0.92) translateY(16px)',
        }}
      >
        {/* Logo with glow ring */}
        <div className="relative flex items-center justify-center">
          {/* Animated glow ring */}
          <div
            className="absolute w-44 h-44 rounded-full border-4 border-indigo-300 opacity-40 animate-ping"
            style={{ animationDuration: '2s' }}
          />
          <div className="absolute w-36 h-36 rounded-full border-2 border-purple-300 opacity-30 animate-ping"
            style={{ animationDuration: '2.5s', animationDelay: '0.3s' }}
          />
          {/* Logo image */}
          <img
            src="/Logo3.png"
            alt="CareerDev AI"
            className="w-32 h-32 object-contain drop-shadow-xl rounded-2xl"
            style={{
              filter: 'drop-shadow(0 8px 24px rgba(99,102,241,0.35))',
            }}
          />
        </div>

        {/* App name */}
        <div className="text-center">
          <h1 className="text-4xl font-extrabold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
            CareerDev AI
          </h1>
          <p className="text-gray-500 text-sm mt-1 italic tracking-wide">
            Your AI-Powered Career Assistant
          </p>
        </div>

        {/* Progress bar */}
        <div className="w-56 h-1.5 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-75 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Bouncing dots */}
        <div className="flex items-center gap-2 mt-1">
          <div className="w-2 h-2 bg-indigo-500 rounded-full animate-bounce" />
          <div className="w-2 h-2 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: '0.15s' }} />
          <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{ animationDelay: '0.3s' }} />
        </div>
      </div>
    </div>
  );
}

import React from 'react';

interface PremiumLoaderProps {
  className?: string;
  colorClass?: string;
}

export default function PremiumLoader({ 
  className = "w-6 h-6", 
  colorClass = "text-emerald-400" 
}: PremiumLoaderProps) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      {/* Outer slow ring - precision tracking line */}
      <svg 
        className={`absolute inset-0 w-full h-full animate-[spin_4s_linear_infinite] ${colorClass} opacity-20`} 
        viewBox="0 0 100 100"
      >
        <circle 
          cx="50" cy="50" r="46" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="1.5" 
          strokeDasharray="20 10 50 20 10 80" 
        />
      </svg>
      
      {/* Middle medium ring - reverse rotation */}
      <svg 
        className={`absolute inset-0 w-full h-full animate-[spin_2s_linear_infinite_reverse] ${colorClass} opacity-60`} 
        viewBox="0 0 100 100"
      >
        <circle 
          cx="50" cy="50" r="34" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="3" 
          strokeDasharray="40 180" 
          strokeLinecap="round" 
        />
      </svg>
      
      {/* Inner fast pulse ring */}
      <svg 
        className={`absolute inset-0 w-full h-full animate-[spin_1s_ease-in-out_infinite] ${colorClass}`} 
        viewBox="0 0 100 100"
      >
        <circle 
          cx="50" cy="50" r="20" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="4" 
          strokeDasharray="25 150" 
          strokeLinecap="round" 
        />
      </svg>
    </div>
  );
}

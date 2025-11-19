import React from 'react';

export const VillageLogo: React.FC<{ className?: string, src?: string, width?: number }> = ({ className, src, width = 160 }) => {
  if (src) {
    return (
      <div className={`flex flex-col items-center ${className}`}>
        <img 
          src={src} 
          alt="Company Logo" 
          className="h-auto object-contain" 
          style={{ width: `${width}px` }}
        />
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center ${className}`}>
      <div className="relative w-24 h-24 mb-2">
        {/* House Body - Blue */}
        <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-md">
          {/* Roof */}
          <path d="M10 40 L50 10 L90 40" fill="none" stroke="#0F1E5E" strokeWidth="4" strokeLinecap="round" />
          
          {/* Main Box */}
          <rect x="20" y="40" width="60" height="50" rx="8" fill="#0F1E5E" />
          
          {/* The White Curve / Road / River */}
          <path d="M25 90 C 40 90, 40 40, 50 40 C 60 40, 60 90, 75 90" fill="none" stroke="white" strokeWidth="8" strokeLinecap="round" />
          
          {/* Leaf Sprout */}
          <path d="M50 40 Q 50 10 70 5 Q 70 25 50 40" fill="#4C9F26" />
          <path d="M50 40 Q 50 15 30 15 Q 30 30 50 40" fill="#4C9F26" />
        </svg>
      </div>
      
      {/* Text Logo */}
      <div className="text-center">
        <h1 className="text-4xl font-script italic font-bold text-village-green leading-none">
          Village
        </h1>
        <p className="text-sm font-serif font-bold text-black tracking-wide mt-1">
          Safety and Quality
        </p>
      </div>
    </div>
  );
};
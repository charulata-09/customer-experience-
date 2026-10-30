import React from 'react';

export const Skeleton = ({ className = '', variant = 'rect' }) => {
  const variants = {
    rect: 'rounded-xl',
    circle: 'rounded-full',
    text: 'rounded-md h-4',
  };

  return (
    <div
      className={`animate-pulse bg-slate-800/80 border border-slate-700/30 ${variants[variant]} ${className}`}
      aria-hidden="true"
    />
  );
};

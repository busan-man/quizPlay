import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
}

export const Card: React.FC<CardProps> = ({ children, className = '', onClick }) => {
  const baseClasses = 'bg-white rounded-lg shadow-md border border-gray-200';
  const clickClasses = onClick ? 'cursor-pointer hover:shadow-lg transition-shadow' : '';
  
  return (
    <div 
      className={`${baseClasses} ${clickClasses} ${className}`}
      onClick={onClick}
    >
      {children}
    </div>
  );
}; 
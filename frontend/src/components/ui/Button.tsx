// src/components/ui/Button.tsx
import React from 'react';

export type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  // Added 'xs' here
  size?: 'xs' | 'sm' | 'md' | 'lg'; 
  loading?: boolean;
  children: React.ReactNode;
}

export const Button = ({ 
  variant = 'primary', 
  size = 'md',
  loading = false, 
  className = '',
  children, 
  disabled,
  ...props 
}: ButtonProps) => {
  const baseStyles = "inline-flex items-center justify-center rounded-lg font-semibold shadow-sm transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-indigo-600 text-white hover:bg-indigo-700 shadow-indigo-100",
    secondary: "text-gray-700 bg-gray-100 hover:bg-gray-200",
    outline: "border border-gray-300 text-gray-700 hover:bg-gray-50 bg-white",
    danger: "bg-red-600 text-white hover:bg-red-700 shadow-red-100",
    ghost: "text-gray-600 hover:bg-gray-100 shadow-none"
  };

  const sizes = {
    // New: Extra Small for dense tables
    xs: "px-2 py-1 text-[10px] leading-tight rounded-md",
    sm: "px-3 py-1.5 text-xs",
    md: "px-5 py-2.5 text-sm",
    lg: "px-6 py-3 text-base"
  };
  
  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading && (
        <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-current" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
};
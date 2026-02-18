import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  isLoading = false,
  className = '',
  disabled,
  ...props
}) => {
  // Base styles for all buttons
  const baseStyles = "px-6 py-3 relative group font-bold transition-all duration-300 flex items-center justify-center gap-2 uppercase tracking-widest font-fantasy text-sm md:text-base overflow-hidden border";

  const primaryStyles = "bg-gradient-to-b from-indigo-900 to-indigo-950 text-amber-100 border-amber-600/50 hover:border-amber-400 shadow-[0_0_15px_rgba(79,70,229,0.3)] hover:shadow-[0_0_25px_rgba(199,160,89,0.4)]";

  return (
    <button
      className={`${baseStyles} ${primaryStyles} ${isLoading || disabled ? 'opacity-50 cursor-not-allowed' : 'hover:-translate-y-0.5 active:translate-y-0'} ${className}`}
      disabled={isLoading || disabled}
      {...props}
    >
      {/* Inner glow effect for primary buttons */}
      {variant === 'primary' && (
        <div className="absolute inset-0 opacity-0 group-hover:opacity-20 bg-gradient-to-t from-amber-400 to-transparent transition-opacity duration-300 pointer-events-none"></div>
      )}

      {isLoading ? (
        <>
          <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-amber-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <span className="text-amber-200">Conjuring...</span>
        </>
      ) : (
        <span className="relative z-10 flex items-center gap-2">
           {children}
        </span>
      )}
    </button>
  );
};
import type { ButtonHTMLAttributes, ReactNode } from 'react';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  icon?: ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  fullWidth?: boolean;
}

export function Button({ children, icon, variant = 'primary', fullWidth = false, className = '', ...props }: ButtonProps) {
  const variants = {
    primary: 'bg-cyan-700 text-white hover:bg-cyan-800 border-cyan-700',
    secondary: 'bg-white text-ink hover:bg-slate-50 border-line',
    danger: 'bg-red-700 text-white hover:bg-red-800 border-red-700',
    ghost: 'bg-transparent text-ink hover:bg-slate-100 border-transparent',
  };

  return (
    <button
      className={`inline-flex min-h-10 items-center justify-center gap-2 rounded-md border px-4 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-60 ${
        variants[variant]
      } ${fullWidth ? 'w-full' : 'w-full sm:w-auto'} ${className}`}
      {...props}
    >
      {icon}
      <span>{children}</span>
    </button>
  );
}

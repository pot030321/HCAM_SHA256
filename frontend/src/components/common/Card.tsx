import type { ReactNode } from 'react';

interface CardProps {
  title?: string;
  subtitle?: string;
  children: ReactNode;
  actions?: ReactNode;
  className?: string;
}

export function Card({ title, subtitle, children, actions, className = '' }: CardProps) {
  return (
    <section className={`rounded-lg border border-line bg-white p-4 shadow-soft md:p-6 ${className}`}>
      {(title || subtitle || actions) && (
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            {title && <h2 className="text-base font-bold md:text-lg">{title}</h2>}
            {subtitle && <p className="mt-1 text-sm text-slate-600">{subtitle}</p>}
          </div>
          {actions}
        </div>
      )}
      {children}
    </section>
  );
}

import type { InputHTMLAttributes } from 'react';

type Props = InputHTMLAttributes<HTMLInputElement> & { label: string };

export function TextField({ label, id, className = '', ...props }: Props) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-bold text-brand-950">
        {label}
      </label>
      <input
        id={id}
        className={`mt-1.5 w-full rounded-chunky border-2 border-brand-950/15 bg-white px-3.5 py-2.5 text-brand-950 placeholder:text-brand-950/35 focus:border-brand-600 focus:outline-none focus:ring-4 focus:ring-brand-100 ${className}`}
        {...props}
      />
    </div>
  );
}

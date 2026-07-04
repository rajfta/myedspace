import type { ButtonHTMLAttributes } from 'react';

type Variant = 'primary' | 'outline';

const base =
  'inline-flex items-center justify-center gap-2 rounded-chunky border-2 border-brand-950 px-5 py-2.5 text-sm font-bold transition-all disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:translate-y-0 disabled:hover:shadow-sticker';

const variants: Record<Variant, string> = {
  primary:
    'bg-accent-400 text-brand-950 shadow-sticker hover:-translate-y-0.5 hover:shadow-sticker-lg active:translate-y-0.5 active:shadow-sticker-sm',
  outline:
    'bg-white text-brand-950 shadow-sticker hover:-translate-y-0.5 hover:shadow-sticker-lg active:translate-y-0.5 active:shadow-sticker-sm',
};

export function buttonClasses(variant: Variant = 'primary', className = '') {
  return `${base} ${variants[variant]} ${className}`.trim();
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant };

export function Button({ variant = 'primary', className = '', ...props }: Props) {
  return <button className={buttonClasses(variant, className)} {...props} />;
}

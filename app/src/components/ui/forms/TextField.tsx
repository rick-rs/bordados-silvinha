import type { InputHTMLAttributes } from 'react';

type TextFieldProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  error?: string;
};

export function TextField({
  error,
  id,
  label,
  className = '',
  ...props
}: TextFieldProps) {
  const inputId = id ?? props.name;
  const errorId = error && inputId ? `${inputId}-error` : undefined;

  return (
    <label className={`grid gap-2 ${className}`.trim()} htmlFor={inputId}>
      <span className="text-sm font-bold text-graphite">{label}</span>
      <input
        aria-describedby={errorId}
        aria-invalid={error ? 'true' : 'false'}
        className={[
          'min-h-12 w-full rounded-lg border border-slate-500 bg-white px-4 text-graphite outline-none transition',
          'placeholder:text-muted',
          'focus:border-primary focus:ring-4 focus:ring-primary/15',
        ].join(' ')}
        id={inputId}
        {...props}
      />
      {error ? (
        <span className="text-sm text-danger" id={errorId} role="alert">
          {error}
        </span>
      ) : null}
    </label>
  );
}

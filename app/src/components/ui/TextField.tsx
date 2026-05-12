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
      <span className="text-sm font-bold text-mauve">{label}</span>
      <input
        aria-describedby={errorId}
        aria-invalid={error ? 'true' : 'false'}
        className={[
          'min-h-12 w-full rounded-lg border border-frenchRose/20 bg-white px-4 text-ink outline-none transition',
          'placeholder:text-mauve/60',
          'focus:border-frenchRose focus:ring-4 focus:ring-frenchRose/15',
        ].join(' ')}
        id={inputId}
        {...props}
      />
      {error ? (
        <span className="text-sm text-rose-800" id={errorId} role="alert">
          {error}
        </span>
      ) : null}
    </label>
  );
}

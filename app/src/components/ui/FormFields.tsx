import type { SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

type SelectFieldProps = SelectHTMLAttributes<HTMLSelectElement> & {
  label: string;
};

export function SelectField({
  children,
  className = '',
  id,
  label,
  name,
  ...props
}: SelectFieldProps) {
  const selectId = id ?? name;

  return (
    <label className={`grid gap-2 ${className}`.trim()} htmlFor={selectId}>
      <span className="text-sm font-bold text-graphite">{label}</span>
      <select
        className="min-h-12 w-full rounded-lg border border-primary/20 bg-white px-4 text-graphite outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/15"
        id={selectId}
        name={name}
        {...props}
      >
        {children}
      </select>
    </label>
  );
}

type TextAreaFieldProps = TextareaHTMLAttributes<HTMLTextAreaElement> & {
  label: string;
};

export function TextAreaField({
  className = '',
  id,
  label,
  name,
  ...props
}: TextAreaFieldProps) {
  const textareaId = id ?? name;

  return (
    <label className={`grid gap-2 ${className}`.trim()} htmlFor={textareaId}>
      <span className="text-sm font-bold text-graphite">{label}</span>
      <textarea
        className="min-h-28 w-full rounded-lg border border-primary/20 bg-white px-4 py-3 text-graphite outline-none transition placeholder:text-muted/60 focus:border-primary focus:ring-4 focus:ring-primary/15"
        id={textareaId}
        name={name}
        {...props}
      />
    </label>
  );
}


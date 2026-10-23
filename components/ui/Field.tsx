import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";

export const inputCls =
  "w-full rounded-xl border bg-white px-4 text-[1rem] text-navy-900 placeholder:text-navy-900/35 outline-none transition-all duration-300 focus:border-gold-500 focus:ring-4 focus:ring-gold-400/20 disabled:bg-navy-900/5";

export function Field({
  label,
  error,
  hint,
  optional,
  children,
  className = "",
  htmlFor,
}: {
  label: string;
  error?: string;
  hint?: string;
  optional?: boolean;
  children: ReactNode;
  className?: string;
  htmlFor?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-2 flex items-baseline justify-between gap-3 text-[0.9rem] font-medium text-navy-900">
        <span>{label}</span>
        {optional && <span className="text-[0.78rem] font-normal text-muted">opcional</span>}
      </label>
      {children}
      {error ? (
        <p role="alert" className="mt-1.5 text-[0.85rem] text-rose-600">
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-[0.82rem] text-muted">{hint}</p>
      ) : null}
    </div>
  );
}

export function TextInput({
  invalid,
  className = "",
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }) {
  return (
    <input
      {...props}
      aria-invalid={invalid || undefined}
      className={`${inputCls} h-13 ${invalid ? "border-rose-400" : "border-navy-900/15"} ${className}`}
    />
  );
}

export function TextArea({
  invalid,
  className = "",
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }) {
  return (
    <textarea
      {...props}
      aria-invalid={invalid || undefined}
      className={`${inputCls} min-h-28 resize-y py-3 ${invalid ? "border-rose-400" : "border-navy-900/15"} ${className}`}
    />
  );
}

export function Select({
  invalid,
  className = "",
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }) {
  return (
    <select
      {...props}
      aria-invalid={invalid || undefined}
      className={`${inputCls} h-13 appearance-none bg-[url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' fill='none' stroke='%231a1e3f' stroke-width='1.8' stroke-linecap='round' stroke-linejoin='round' viewBox='0 0 24 24'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E")] bg-[length:16px] bg-[right_1rem_center] bg-no-repeat pr-11 ${
        invalid ? "border-rose-400" : "border-navy-900/15"
      } ${className}`}
    >
      {children}
    </select>
  );
}

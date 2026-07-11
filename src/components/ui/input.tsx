import { InputHTMLAttributes, forwardRef, useId } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, id, className = "", ...props }, ref) => {
    const generatedId = useId();
    const inputId = id ?? generatedId;

    return (
      <div className="flex flex-col gap-1.5 text-start">
        <label htmlFor={inputId} className="text-sm font-medium text-neutral-700">
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error)}
          aria-describedby={error ? `${inputId}-error` : undefined}
          className={`rounded-lg border px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition-colors
            placeholder:text-neutral-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100
            ${error ? "border-[var(--color-danger)]" : "border-neutral-300"} ${className}`}
          {...props}
        />
        {error && (
          <p id={`${inputId}-error`} className="text-sm text-[var(--color-danger)]">
            {error}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = "Input";

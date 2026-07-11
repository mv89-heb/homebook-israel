import { TextareaHTMLAttributes, forwardRef, useId } from "react";

interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label: string;
  error?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, error, id, className = "", ...props }, ref) => {
    const generatedId = useId();
    const textareaId = id ?? generatedId;

    return (
      <div className="flex flex-col gap-1.5 text-start">
        <label htmlFor={textareaId} className="text-sm font-medium text-neutral-700">
          {label}
        </label>
        <textarea
          ref={ref}
          id={textareaId}
          aria-invalid={Boolean(error)}
          className={`min-h-[80px] rounded-lg border px-3.5 py-2.5 text-sm text-neutral-900 outline-none transition-colors
            placeholder:text-neutral-400 focus:border-brand-500 focus:ring-2 focus:ring-brand-100
            ${error ? "border-[var(--color-danger)]" : "border-neutral-300"} ${className}`}
          {...props}
        />
        {error && <p className="text-sm text-[var(--color-danger)]">{error}</p>}
      </div>
    );
  }
);

Textarea.displayName = "Textarea";

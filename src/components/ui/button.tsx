import { ButtonHTMLAttributes, forwardRef } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  isLoading?: boolean;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-brand-600 text-white shadow-sm hover:bg-brand-700 active:bg-brand-800 focus-visible:outline-brand-600 disabled:bg-brand-300",
  secondary:
    "bg-white text-neutral-900 border border-neutral-200 hover:bg-neutral-50 active:bg-neutral-100 focus-visible:outline-neutral-400 disabled:bg-neutral-50 disabled:text-neutral-400",
  ghost:
    "bg-transparent text-neutral-700 hover:bg-neutral-100 focus-visible:outline-neutral-400",
  danger:
    "bg-white text-[var(--color-danger)] border border-[var(--color-danger)]/30 hover:bg-[var(--color-danger-bg)] focus-visible:outline-[var(--color-danger)]",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", isLoading, disabled, className = "", children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={`inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium
          transition-all duration-150 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2
          disabled:cursor-not-allowed active:scale-[0.98] ${variantClasses[variant]} ${className}`}
        {...props}
      >
        {isLoading && (
          <span
            className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"
            aria-hidden="true"
          />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

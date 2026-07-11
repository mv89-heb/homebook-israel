interface FormAlertProps {
  variant?: "error" | "success" | "info";
  children: React.ReactNode;
}

const variantClasses = {
  error: "bg-[var(--color-danger-bg)] text-[var(--color-danger)] border-[var(--color-danger)]/20",
  success: "bg-[var(--color-success-bg)] text-[var(--color-success)] border-[var(--color-success)]/20",
  info: "bg-brand-50 text-brand-700 border-brand-200",
};

export function FormAlert({ variant = "error", children }: FormAlertProps) {
  return (
    <div
      role={variant === "error" ? "alert" : "status"}
      className={`rounded-lg border px-4 py-3 text-sm ${variantClasses[variant]}`}
    >
      {children}
    </div>
  );
}

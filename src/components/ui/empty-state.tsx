interface EmptyStateProps {
  icon?: string;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-14 text-center">
      {icon && (
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-50 text-3xl">
          {icon}
        </span>
      )}
      <div className="flex flex-col gap-1">
        <p className="font-medium text-neutral-900">{title}</p>
        {description && <p className="text-sm text-neutral-500">{description}</p>}
      </div>
      {action}
    </div>
  );
}

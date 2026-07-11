import React from "react";

export interface TimelineEvent {
  id: string;
  date: string | Date;
  title: string;
  description?: string;
  icon?: React.ReactNode;
  type?: "default" | "success" | "warning";
}

interface TimelineProps {
  events: TimelineEvent[];
}

export function Timeline({ events }: TimelineProps) {
  if (!events || events.length === 0) {
    return (
      <div className="text-center p-8 bg-neutral-50 rounded-2xl border border-neutral-100 border-dashed">
        <span className="text-2xl mb-2 block">📭</span>
        <p className="text-neutral-500 font-medium">אין עדיין היסטוריית טיפולים לפריט זה.</p>
      </div>
    );
  }

  return (
    <div className="relative border-r-2 border-neutral-100 pr-6 ml-4 my-4 space-y-8 before:absolute before:inset-0 before:bg-gradient-to-b before:from-transparent before:via-neutral-200 before:to-transparent">
      {events.map((event, index) => {
        // קביעת הצבעים לפי סוג האירוע
        const colorStyles = 
          event.type === "success" ? "bg-emerald-100 text-emerald-600 border-emerald-200" :
          event.type === "warning" ? "bg-amber-100 text-amber-600 border-amber-200" :
          "bg-brand-50 text-brand-600 border-brand-100";

        // פירמוט תאריך בסיסי
        const formattedDate = new Date(event.date).toLocaleDateString("he-IL", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });

        return (
          <div 
            key={event.id} 
            className="relative group animate-in slide-in-from-bottom-4 fade-in fill-mode-both"
            style={{ animationDelay: `${index * 150}ms` }} // אפקט כניסה מדורג
          >
            {/* הנקודה על ציר הזמן */}
            <span className={`absolute -right-[35px] top-1 flex h-8 w-8 items-center justify-center rounded-full border-2 bg-white shadow-sm transition-transform group-hover:scale-110 ${colorStyles}`}>
              {event.icon || <span className="text-sm">🔧</span>}
            </span>

            {/* תוכן האירוע (הכרטיסייה) */}
            <div className="flex flex-col gap-1.5 p-5 bg-white rounded-2xl border border-neutral-100 shadow-sm transition-all duration-300 group-hover:shadow-md group-hover:border-neutral-200 group-hover:-translate-y-0.5">
              <time className="text-xs font-bold tracking-wider text-neutral-400 uppercase">
                {formattedDate}
              </time>
              <h3 className="text-lg font-bold text-neutral-900 leading-tight">
                {event.title}
              </h3>
              {event.description && (
                <p className="text-sm text-neutral-500 font-medium">
                  {event.description}
                </p>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

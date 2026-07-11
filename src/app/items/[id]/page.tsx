import Link from "next/link";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { items, homes } from "@/db/schema";
import { Timeline, TimelineEvent } from "@/components/ui/timeline";
import { Button } from "@/components/ui/button";

type Props = {
  params: Promise<{ id: string }>;
};

export default async function ItemDetailPage({ params }: Props) {
  const resolvedParams = await params;
  const itemId = resolvedParams.id;

  // שולפים את הפריט הגולמי
  const [rawItem] = await db
    .select()
    .from(items)
    .where(eq(items.id, itemId))
    .limit(1);

  if (!rawItem) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center gap-4">
        <span className="text-6xl">👻</span>
        <h1 className="text-2xl font-bold text-neutral-800">הפריט לא נמצא</h1>
        <Link href="/"><Button>חזרה לדשבורד</Button></Link>
      </div>
    );
  }

  // "מרחיבים" את הטיפוס כדי ש-TypeScript לא יכשיל את הבילד
  // במידה והשדות האלו לא קיימים רשמית ב-Schema עדיין
  const item = rawItem as typeof rawItem & {
    warrantyEndDate?: string | Date | null;
    hasReceipt?: boolean;
  };

  const [home] = await db
    .select()
    .from(homes)
    .where(eq(homes.id, rawItem.homeId))
    .limit(1);

  const mockEvents: TimelineEvent[] = [
    {
      id: "1",
      date: new Date().toISOString(),
      title: "בדיקת תקינות שנתית",
      description: "בוצעה בדיקה שוטפת, נוקה פילטר והכל נמצא תקין. הפריט עובד מצוין.",
      type: "success",
      icon: "✓"
    },
    {
      id: "2",
      date: new Date(Date.now() - 180 * 24 * 60 * 60 * 1000).toISOString(),
      title: "החלפת חלק בלוי",
      description: "הטכנאי החליף את הכבל הראשי במסגרת האחריות.",
      type: "warning",
      icon: "⚠️"
    },
    {
      id: "3",
      date: new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString(),
      title: "רכישה והתקנה",
      description: "הפריט נרכש והותקן בהצלחה בנכס.",
      type: "default",
      icon: "📦"
    }
  ];

  // בדיקה בטוחה של תאריך האחריות
  const isWarrantyValid = item.warrantyEndDate ? new Date(item.warrantyEndDate).getTime() > Date.now() : false;

  return (
    <div className="flex flex-col gap-8 pb-12 animate-in fade-in duration-700 max-w-5xl mx-auto mt-4 px-4 sm:px-0">
      <div className="flex items-center gap-2 text-sm font-medium text-neutral-500">
        <Link href="/" className="hover:text-brand-600 transition-colors">דשבורד</Link>
        <span>/</span>
        <Link href={`/homes/${item.homeId}`} className="hover:text-brand-600 transition-colors">
          {home?.name || "הנכס שלי"}
        </Link>
        <span>/</span>
        <span className="text-neutral-900">{item.name}</span>
      </div>

      <div className="relative p-8 rounded-[2rem] overflow-hidden shadow-sm border border-neutral-100 bg-white">
        <div className="absolute inset-0 bg-gradient-to-r from-brand-50/50 to-transparent z-0"></div>
        <div className="absolute -top-20 -right-20 w-64 h-64 bg-brand-200/30 rounded-full blur-[60px] z-0"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex flex-col gap-2">
            <h1 className="text-3xl md:text-4xl font-extrabold text-neutral-900 tracking-tight">
              {item.name}
            </h1>
            <div className="flex items-center gap-3 mt-2">
              <span className={`px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full ${isWarrantyValid ? 'bg-emerald-100 text-emerald-700' : 'bg-neutral-100 text-neutral-600'}`}>
                {isWarrantyValid ? 'אחריות בתוקף' : 'ללא אחריות'}
              </span>
              {item.hasReceipt && (
                <span className="px-3 py-1 text-xs font-bold uppercase tracking-wider rounded-full bg-blue-100 text-blue-700">
                  📄 קבלה שמורה
                </span>
              )}
            </div>
          </div>
          
          <Button variant="secondary" className="rounded-full shadow-sm hover:shadow-md transition-all font-medium">
            ✎ עריכת פרטים
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-start">
        <div className="md:col-span-2 flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-neutral-900">היסטוריית טיפולים</h2>
            <Button className="rounded-full text-sm font-medium h-9 bg-neutral-900 hover:bg-neutral-800">
              + הוסף טיפול
            </Button>
          </div>
          <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm">
            <Timeline events={mockEvents} />
          </div>
        </div>

        <div className="md:col-span-1 flex flex-col gap-4">
          <div className="bg-white p-6 rounded-3xl border border-neutral-100 shadow-sm flex flex-col gap-5">
            <h3 className="font-bold text-neutral-900 text-lg">תעודת זהות</h3>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">תאריך סיום אחריות</span>
              <span className="font-medium text-neutral-800">
                {item.warrantyEndDate 
                  ? new Date(item.warrantyEndDate).toLocaleDateString("he-IL") 
                  : "לא הוזן/לא זמין"}
              </span>
            </div>
            <hr className="border-neutral-100" />
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-neutral-400 uppercase tracking-wider">שיוך לנכס</span>
              <span className="font-medium text-neutral-800 flex items-center gap-2">
                🏠 {home?.name}
              </span>
            </div>
            <hr className="border-neutral-100" />
            <Button variant="secondary" className="w-full rounded-xl justify-center font-semibold text-brand-700 bg-brand-50 hover:bg-brand-100 border-none">
              📁 צפה במסמכים מקושרים
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import { count, eq, inArray } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { homes, items, documents, users } from "@/db/schema"; 
import { Button } from "@/components/ui/button";
import { Card, CardLink } from "@/components/ui/card";
import { ProgressCircle } from "@/components/ui/progress-circle";
import { generateHomeHealthReport, Item, MaintenanceLog } from "@/lib/healthScoreEngine"; 
// 1. הוספנו את פונקציית ההפניה מ-Next.js
import { redirect } from "next/navigation"; 

export default async function DashboardPage() {
  const session = await auth();

  // 2. ההגנה שלנו: אם אין חיבור, ננתב למסך ההתחברות במקום לקרוס
  if (!session || !session.user) {
    redirect("/api/auth/signin"); // אם נתיב ההתחברות שלך שונה, עדכן אותו כאן
  }

  const userId = session.user.id;

  const [profile] = await db
    .select({ fullName: users.fullName })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  // ... (מכאן והלאה הקוד ממשיך בדיוק כפי שהיה)

  const userHomes = await db.select().from(homes).where(eq(homes.ownerId, userId)).orderBy(homes.createdAt);
  const homeIds = userHomes.map(h => h.id);

  // שימוש בטיפוסים המוגדרים למניעת שגיאות ה-Linter
  let userItems: Item[] = [];
  const userLogs: MaintenanceLog[] = []; // מוגדר כ-const כדי לעבור את בדיקות ה-Linter
  let documentsCountValue = 0;

  if (homeIds.length > 0) {
    const [itemsResult, docsResult] = await Promise.all([
      db.select().from(items).where(inArray(items.homeId, homeIds)),
      db.select({ value: count() }).from(documents).where(inArray(documents.homeId, homeIds)),
    ]);
    
    // המרה בטוחה כדי למנוע שגיאות טיפוסים של TypeScript
    userItems = itemsResult as unknown as Item[];
    documentsCountValue = docsResult[0]?.value || 0;
  }

  const firstName = profile?.fullName?.split(" ")[0] || "";

  // הפעלת מנוע התובנות
  const healthReport = generateHomeHealthReport(userItems, userLogs);
  const { score, insights } = healthReport;

  const topInsights = insights.filter(i => i.type === 'WARNING' || i.type === 'INFO').slice(0, 3);

  const stats = [
    { icon: "🏠", label: "נכסים מנוהלים", value: userHomes.length },
    { icon: "📦", label: "פריטים תחת מעקב", value: userItems.length },
    { icon: "📄", label: "מסמכים וקבלות", value: documentsCountValue },
  ];

  return (
    <div className="flex flex-col gap-10 pb-12 animate-in fade-in duration-700">
      
      {/* --- HERO SECTION: MESH GRADIENT & GLASSMORPHISM --- */}
      <div className="relative flex flex-col md:flex-row items-start md:items-center justify-between gap-8 p-8 md:p-10 rounded-[2rem] overflow-hidden shadow-sm border border-neutral-100">
        
        {/* רקע מעוצב (Mesh Background) */}
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-50 to-neutral-100/50 z-0"></div>
        <div className="absolute -top-32 -right-32 w-96 h-96 bg-brand-200/40 rounded-full blur-[80px] z-0"></div>
        <div className="absolute -bottom-32 -left-32 w-96 h-96 bg-blue-200/40 rounded-full blur-[80px] z-0"></div>

        {/* תוכן ה-Hero */}
        <div className="relative z-10 max-w-xl">
          <h1 className="font-display text-4xl md:text-5xl font-extrabold text-transparent bg-clip-text bg-gradient-to-br from-neutral-900 to-neutral-500 tracking-tight leading-tight">
            {firstName ? `שלום, ${firstName} 👋` : "שלום 👋"}
          </h1>
          <p className="mt-4 text-lg text-neutral-600 font-medium leading-relaxed">
            {userHomes.length > 0 
              ? `יש לנו ${topInsights.length > 0 ? 'כמה המלצות חשובות' : 'חדשות מעולות, הכל תקין'} לגבי הנכסים שלך.`
              : "ברוכים הבאים ללוח הבקרה. המקום בו הבית שלך הופך לחכם, מאורגן ונקי מדאגות."}
          </p>
          
          {userHomes.length === 0 && (
            <div className="mt-6">
              <Link href="/homes/new">
                <Button className="rounded-full px-8 py-6 text-md font-semibold shadow-xl shadow-brand-500/20 hover:scale-105 transition-transform">
                  ✨ הוסף את הבית הראשון שלך
                </Button>
              </Link>
            </div>
          )}
        </div>
        
        {/* כרטיסיית הציון הצפה (Glassmorphism) */}
        {userHomes.length > 0 && (
          <div className="relative z-10 bg-white/60 backdrop-blur-xl p-6 rounded-3xl shadow-xl shadow-neutral-200/50 border border-white flex items-center gap-8 hover:bg-white/80 transition-colors">
            <ProgressCircle score={score} size={110} strokeWidth={10} />
            <div className="flex flex-col gap-2">
              <span className="text-sm font-bold uppercase tracking-wider text-brand-600">מדד משוקלל</span>
              <span className="text-sm font-medium text-neutral-500 max-w-[120px] leading-snug">
                מבוסס על ניתוח של {userItems.length} פריטים
              </span>
            </div>
          </div>
        )}
      </div>

      {/* --- PROACTIVE INSIGHTS --- */}
      {topInsights.length > 0 && (
        <div className="flex flex-col gap-4">
          <h2 className="text-xl font-bold text-neutral-900 px-2">נקודות לתשומת לב 💡</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {topInsights.map((insight, idx) => (
              <div key={idx} className={`relative overflow-hidden p-6 rounded-2xl border flex flex-col gap-3 transition-all hover:-translate-y-1 hover:shadow-lg ${insight.type === 'WARNING' ? 'bg-gradient-to-br from-amber-50 to-white border-amber-200 shadow-amber-100/50' : 'bg-gradient-to-br from-blue-50 to-white border-blue-200 shadow-blue-100/50'}`}>
                <div className={`absolute top-0 right-0 w-16 h-16 rounded-full blur-2xl -mr-8 -mt-8 ${insight.type === 'WARNING' ? 'bg-amber-300/30' : 'bg-blue-300/30'}`}></div>
                <span className="text-2xl relative z-10">{insight.type === 'WARNING' ? '⚠️' : 'ℹ️'}</span>
                <span className="text-base font-semibold text-neutral-800 relative z-10">{insight.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- STATS CARDS --- */}
      {userHomes.length > 0 && (
        <div className="grid grid-cols-3 gap-4 sm:gap-6">
          {stats.map((stat) => (
            <Card key={stat.label} className="group flex flex-col items-center gap-2 text-center sm:items-start sm:text-start bg-white border border-neutral-100 shadow-sm hover:shadow-xl hover:border-brand-200 transition-all duration-300 p-6 rounded-3xl overflow-hidden relative">
              <div className="absolute -right-4 -top-4 w-24 h-24 bg-brand-50 rounded-full blur-xl group-hover:bg-brand-100 transition-colors opacity-50"></div>
              <span className="relative z-10 flex h-14 w-14 items-center justify-center rounded-2xl bg-brand-50 text-2xl text-brand-600 shadow-inner">
                {stat.icon}
              </span>
              <span className="mt-3 text-4xl font-black text-neutral-900 tracking-tight relative z-10">{stat.value}</span>
              <span className="text-sm font-semibold text-neutral-500 relative z-10">{stat.label}</span>
            </Card>
          ))}
        </div>
      )}

      {/* --- HOMES LIST --- */}
      {userHomes.length > 0 && (
        <div className="flex flex-col gap-6 mt-4">
          <div className="flex items-center justify-between px-2">
            <h2 className="text-xl font-bold text-neutral-900">
              הנכסים שלי
            </h2>
            <Link href="/homes/new">
              <Button variant="secondary" className="rounded-full shadow-sm hover:bg-neutral-100 text-sm font-medium">
                + נכס חדש
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {userHomes.map((home) => (
              <CardLink key={home.id} href={`/homes/${home.id}`} className="group flex flex-col gap-3 p-6 rounded-3xl border border-neutral-200 bg-white hover:border-brand-300 hover:shadow-xl hover:-translate-y-1 transition-all duration-300">
                <div className="flex items-start justify-between">
                  <span className="text-xl font-bold text-neutral-900 group-hover:text-brand-600 transition-colors">{home.name}</span>
                  <div className="h-10 w-10 rounded-full bg-neutral-50 flex items-center justify-center text-xl group-hover:bg-brand-50 transition-colors">🏠</div>
                </div>
                {(home.address || home.city) && (
                  <span className="text-sm font-medium text-neutral-500 bg-neutral-50 inline-flex px-3 py-1.5 rounded-lg w-fit">
                    {[home.address, home.city].filter(Boolean).join(", ")}
                  </span>
                )}
              </CardLink>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

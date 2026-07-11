import Link from "next/link";
import { count, eq, inArray } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { homes, items, documents, users } from "@/db/schema"; 
import { Button } from "@/components/ui/button";
import { Card, CardLink } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ProgressCircle } from "@/components/ui/progress-circle";
import { generateHomeHealthReport, Item, MaintenanceLog } from "@/lib/healthScoreEngine"; 

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [profile] = await db
    .select({ fullName: users.fullName })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const userHomes = await db.select().from(homes).where(eq(homes.ownerId, userId)).orderBy(homes.createdAt);
  const homeIds = userHomes.map(h => h.id);

  // שימוש בטיפוסים המוגדרים במקום any
  let userItems: Item[] = [];
  const userLogs: MaintenanceLog[] = []; // תוקן ל-const
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

  const healthReport = generateHomeHealthReport(userItems, userLogs);
  const { score, insights } = healthReport;

  const topInsights = insights.filter(i => i.type === 'WARNING' || i.type === 'INFO').slice(0, 3);

  const stats = [
    { icon: "🏠", label: "בתים", value: userHomes.length },
    { icon: "📦", label: "פריטים", value: userItems.length },
    { icon: "📄", label: "מסמכים", value: documentsCountValue },
  ];

  return (
    <div className="flex flex-col gap-8 pb-12">
      
      {/* --- HERO SECTION --- */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 bg-brand-50/50 p-6 rounded-3xl border border-brand-100">
        <div>
          <h1 className="font-display text-3xl font-medium text-neutral-900">
            {firstName ? `שלום, ${firstName} 👋` : "שלום 👋"}
          </h1>
          <p className="mt-2 text-neutral-600 max-w-md">
            {userHomes.length > 0 
              ? `הבתים שלך מתפקדים בצורה יפה. יש לנו ${topInsights.length > 0 ? 'כמה המלצות בשבילך' : 'הכל נראה מצוין!'}`
              : "ברוכים הבאים! בואו נתחיל לנהל את הבתים שלכם בצורה חכמה."}
          </p>
        </div>
        
        {userHomes.length > 0 && (
          <div className="bg-white p-4 rounded-2xl shadow-sm border border-neutral-100 flex items-center gap-6">
            <ProgressCircle score={score} size={100} strokeWidth={8} />
            <div className="flex flex-col gap-1 text-sm">
              <span className="font-semibold text-neutral-900">סטטוס כללי</span>
              <span className="text-neutral-500">מבוסס על {userItems.length} פריטים ותיעוד</span>
            </div>
          </div>
        )}
      </div>

      {/* --- PROACTIVE INSIGHTS --- */}
      {topInsights.length > 0 && (
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-semibold text-neutral-900">תובנות שכדאי לשים לב אליהן 💡</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {topInsights.map((insight, idx) => (
              <div key={idx} className={`p-4 rounded-xl border flex flex-col gap-2 ${insight.type === 'WARNING' ? 'bg-amber-50 border-amber-200' : 'bg-blue-50 border-blue-200'}`}>
                <span className="text-xl">{insight.type === 'WARNING' ? '⚠️' : 'ℹ️'}</span>
                <span className="text-sm font-medium text-neutral-800">{insight.message}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* --- STATS --- */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="flex flex-col items-center gap-1 text-center sm:items-start sm:text-start shadow-sm hover:shadow-md transition-shadow">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-xl">
              {stat.icon}
            </span>
            <span className="mt-2 text-2xl font-bold text-neutral-900">{stat.value}</span>
            <span className="text-xs text-neutral-500 sm:text-sm font-medium">{stat.label}</span>
          </Card>
        ))}
      </div>

      {/* --- HOMES LIST --- */}
      {userHomes.length === 0 ? (
        <EmptyState
          icon="🏠"
          title="עדיין לא הוספתם בית"
          description="בואו נתחיל לארגן — הוספת בית ראשון לוקחת פחות מדקה."
          action={
            <Link href="/homes/new">
              <Button>הוספת בית ראשון</Button>
            </Link>
          }
        />
      ) : (
        <div className="flex flex-col gap-4 mt-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-neutral-900">
              הבתים שלי ({userHomes.length})
            </h2>
            <Link href="/homes/new">
              <Button variant="secondary" className="rounded-full shadow-sm">+ הוספת בית</Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {userHomes.map((home) => (
              <CardLink key={home.id} href={`/homes/${home.id}`} className="flex flex-col gap-2 p-5 border-neutral-200 hover:border-brand-300">
                <div className="flex items-start justify-between">
                  <span className="text-lg font-semibold text-neutral-900">{home.name}</span>
                  <span className="text-2xl">🏠</span>
                </div>
                {(home.address || home.city) && (
                  <span className="text-sm text-neutral-500">
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

import Link from "next/link";
import { count, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { homes, items, documents, users } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Card, CardLink } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";

export default async function DashboardPage() {
  const session = await auth();
  const userId = session!.user.id;

  const [profile] = await db
    .select({ fullName: users.fullName })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);

  const [userHomes, [itemsCount], [documentsCount]] = await Promise.all([
    db.select().from(homes).where(eq(homes.ownerId, userId)).orderBy(homes.createdAt),
    db
      .select({ value: count() })
      .from(items)
      .innerJoin(homes, eq(homes.id, items.homeId))
      .where(eq(homes.ownerId, userId)),
    db
      .select({ value: count() })
      .from(documents)
      .innerJoin(homes, eq(homes.id, documents.homeId))
      .where(eq(homes.ownerId, userId)),
  ]);

  const firstName = profile?.fullName?.split(" ")[0];

  const stats = [
    { icon: "🏠", label: "בתים", value: userHomes.length },
    { icon: "📦", label: "פריטים", value: itemsCount.value },
    { icon: "📄", label: "מסמכים", value: documentsCount.value },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="font-display text-3xl font-medium text-neutral-900">
          {firstName ? `שלום, ${firstName} 👋` : "שלום 👋"}
        </h1>
        <p className="mt-1 text-neutral-500">הנה מה שקורה בבתים שלכם</p>
      </div>

      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        {stats.map((stat) => (
          <Card key={stat.label} className="flex flex-col items-center gap-1 text-center sm:items-start sm:text-start">
            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-50 text-xl">
              {stat.icon}
            </span>
            <span className="mt-1 text-2xl font-semibold text-neutral-900">{stat.value}</span>
            <span className="text-xs text-neutral-500 sm:text-sm">{stat.label}</span>
          </Card>
        ))}
      </div>

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
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-neutral-900">
              {userHomes.length} {userHomes.length === 1 ? "בית" : "בתים"}
            </h2>
            <Link href="/homes/new">
              <Button variant="secondary">+ הוספת בית</Button>
            </Link>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {userHomes.map((home) => (
              <CardLink key={home.id} href={`/homes/${home.id}`} className="flex flex-col gap-1">
                <span className="text-lg font-semibold text-neutral-900">{home.name}</span>
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

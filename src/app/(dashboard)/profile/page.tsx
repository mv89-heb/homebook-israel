import { eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { ProfileForm } from "./profile-form";

export default async function ProfilePage() {
  const session = await auth();

  const [profile] = await db
    .select({ fullName: users.fullName, phone: users.phone, email: users.email })
    .from(users)
    .where(eq(users.id, session!.user.id))
    .limit(1);

  return (
    <div className="flex max-w-md flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-medium text-neutral-900">פרופיל</h1>
        <p className="mt-1 text-neutral-500">עדכנו את הפרטים האישיים שלכם</p>
      </div>
      <ProfileForm
        email={profile?.email ?? session!.user.email ?? ""}
        fullName={profile?.fullName ?? null}
        phone={profile?.phone ?? null}
      />
    </div>
  );
}

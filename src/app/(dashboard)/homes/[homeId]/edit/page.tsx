import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { getOwnedHome } from "@/lib/db/ownership";
import { HomeForm } from "../../home-form";

export default async function EditHomePage({
  params,
}: {
  params: Promise<{ homeId: string }>;
}) {
  const { homeId } = await params;
  const session = await auth();
  const home = await getOwnedHome(homeId, session!.user.id);

  if (!home) {
    notFound();
  }

  return (
    <div className="flex max-w-md flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-medium text-neutral-900">עריכת בית</h1>
      </div>
      <HomeForm home={home} />
    </div>
  );
}

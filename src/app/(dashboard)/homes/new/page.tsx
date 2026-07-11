import { HomeForm } from "../home-form";

export default function NewHomePage() {
  return (
    <div className="flex max-w-md flex-col gap-6">
      <div>
        <h1 className="font-display text-2xl font-medium text-neutral-900">בית חדש</h1>
        <p className="mt-1 text-neutral-500">הוסיפו בית כדי להתחיל לנהל חדרים ופריטים</p>
      </div>
      <HomeForm />
    </div>
  );
}

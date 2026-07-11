import { redirect } from "next/navigation";

export default function RootPage() {
  // הפניה אוטומטית של מי שמגיע לעמוד הראשי ישירות ללוח הבקרה המעוצב
  redirect("/dashboard");
}

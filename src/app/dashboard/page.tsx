import { redirect } from "next/navigation";

export default async function DashboardPage() {
  // Redirect to the new profile page
  redirect("/profile");
}
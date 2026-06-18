import { redirect } from "next/navigation";

export default function Home() {
  // Middleware sends unauthenticated users to /login; everyone else lands here.
  redirect("/dashboard");
}

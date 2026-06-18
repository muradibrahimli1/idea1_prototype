import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import ReviewForm from "@/components/ReviewForm";
import { StatusBadge, Price } from "@/components/badges";
import type { Submission, Task, Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

type SubWithSolver = Submission & { solver: Pick<Profile, "full_name"> | null };
type SubWithTask = Submission & { task: Pick<Task, "id" | "title"> | null };

export default async function DashboardPage() {
  const profile = await requireProfile();
  const supabase = createClient();

  // ---- Creator side: my tasks + submissions to review ----------------------
  const { data: myTasks } = await supabase
    .from("tasks")
    .select("*")
    .eq("creator_id", profile.id)
    .order("created_at", { ascending: false });

  const createdTasks = (myTasks ?? []) as Task[];
  const taskIds = createdTasks.map((t) => t.id);

  let incoming: SubWithSolver[] = [];
  const signedUrls: Record<string, string> = {};

  if (taskIds.length > 0) {
    const { data: subs } = await supabase
      .from("submissions")
      .select("*, solver:profiles!submissions_solver_id_fkey(full_name)")
      .in("task_id", taskIds)
      .order("created_at", { ascending: false });

    incoming = (subs ?? []) as SubWithSolver[];

    // Pre-sign download links for each submission file.
    await Promise.all(
      incoming.map(async (s) => {
        const { data } = await supabase.storage
          .from("submissions")
          .createSignedUrl(s.file_path, 60 * 60);
        if (data?.signedUrl) signedUrls[s.id] = data.signedUrl;
      }),
    );
  }

  const taskTitle = (id: string) =>
    createdTasks.find((t) => t.id === id)?.title ?? "Task";

  // ---- Solver side: my purchases + my submissions --------------------------
  const { data: purchases } = await supabase
    .from("purchases")
    .select("task:tasks(*)")
    .eq("solver_id", profile.id)
    .order("created_at", { ascending: false });

  const purchasedTasks = ((purchases ?? []) as { task: Task | Task[] | null }[])
    .map((p) => (Array.isArray(p.task) ? p.task[0] : p.task))
    .filter(Boolean) as Task[];

  const { data: mySubsData } = await supabase
    .from("submissions")
    .select("*, task:tasks(id, title)")
    .eq("solver_id", profile.id)
    .order("created_at", { ascending: false });

  const mySubs = (mySubsData ?? []) as SubWithTask[];

  const pendingReviews = incoming.filter((s) => !s.reviewed_at).length;

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-2xl font-bold">
          Welcome back, {profile.full_name || "there"}
        </h1>
        <p className="text-sm text-gray-500">
          Everything you create and solve lives here.
        </p>
      </div>

      {/* ============ CREATOR PANEL ============ */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">
            Tasks you created{" "}
            {pendingReviews > 0 && (
              <span className="badge bg-brand-400 text-white">
                {pendingReviews} to review
              </span>
            )}
          </h2>
          <Link href="/tasks/create" className="btn-ghost text-xs">
            + New task
          </Link>
        </div>

        {createdTasks.length === 0 ? (
          <p className="card text-sm text-gray-500">
            You haven&apos;t published any tasks yet.{" "}
            <Link href="/tasks/create" className="font-medium text-brand-400">
              Create one
            </Link>
            .
          </p>
        ) : (
          <div className="space-y-4">
            {createdTasks.map((task) => {
              const subs = incoming.filter((s) => s.task_id === task.id);
              return (
                <div key={task.id} className="card">
                  <div className="flex items-center justify-between">
                    <Link
                      href={`/tasks/${task.id}`}
                      className="font-semibold hover:text-brand-400"
                    >
                      {task.title}
                    </Link>
                    <span className="text-xs text-gray-400">
                      {subs.length} submission{subs.length === 1 ? "" : "s"}
                    </span>
                  </div>

                  {subs.length > 0 && (
                    <ul className="mt-3 space-y-3">
                      {subs.map((s) => (
                        <li
                          key={s.id}
                          className="rounded-lg border border-gray-200 bg-gray-50 p-3"
                        >
                          <div className="flex items-center justify-between">
                            <div className="text-sm">
                              <span className="font-medium">
                                {s.solver?.full_name || "Solver"}
                              </span>{" "}
                              ·{" "}
                              {signedUrls[s.id] ? (
                                <a
                                  href={signedUrls[s.id]}
                                  className="text-brand-400 underline"
                                  target="_blank"
                                  rel="noreferrer"
                                >
                                  {s.file_name}
                                </a>
                              ) : (
                                <span>{s.file_name}</span>
                              )}
                            </div>
                            <StatusBadge value={s.status} />
                          </div>
                          {s.notes && (
                            <p className="mt-1 whitespace-pre-wrap text-xs text-gray-500">
                              “{s.notes}”
                            </p>
                          )}
                          <ReviewForm submission={s} />
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ============ SOLVER PANEL ============ */}
      <section>
        <h2 className="mb-3 text-lg font-semibold">Tasks you&apos;re solving</h2>

        {purchasedTasks.length === 0 ? (
          <p className="card text-sm text-gray-500">
            You haven&apos;t bought any tasks yet.{" "}
            <Link href="/marketplace" className="font-medium text-brand-400">
              Browse the marketplace
            </Link>
            .
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {purchasedTasks.map((task) => {
              const subs = mySubs.filter((s) => s.task_id === task.id);
              const latest = subs[0];
              return (
                <Link
                  key={task.id}
                  href={`/tasks/${task.id}`}
                  className="card block transition hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{task.title}</span>
                    <Price value={task.price} />
                  </div>
                  <div className="mt-2 text-sm text-gray-500">
                    {latest ? (
                      <span className="inline-flex items-center gap-2">
                        Latest: <StatusBadge value={latest.status} />
                        {latest.reviewed_at && latest.score != null && (
                          <span className="font-medium text-gray-700">
                            {latest.score}/100
                          </span>
                        )}
                      </span>
                    ) : (
                      "Not submitted yet"
                    )}
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}

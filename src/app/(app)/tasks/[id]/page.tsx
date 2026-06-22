import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { buyTask, submitSolution } from "@/app/actions";
import { DifficultyBadge, Price, StatusBadge } from "@/components/badges";
import type { Submission, Task } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function TaskPage({ params }: { params: { id: string } }) {
  const profile = await requireProfile();
  const supabase = createClient();

  // All three key off the task id directly — run them together.
  const [taskRes, purchaseRes, mySubsRes] = await Promise.all([
    supabase.from("tasks").select("*").eq("id", params.id).single(),
    supabase
      .from("purchases")
      .select("id")
      .eq("task_id", params.id)
      .eq("solver_id", profile.id)
      .maybeSingle(),
    supabase
      .from("submissions")
      .select("*")
      .eq("task_id", params.id)
      .eq("solver_id", profile.id)
      .order("created_at", { ascending: false }),
  ]);

  if (!taskRes.data) notFound();
  const t = taskRes.data as Task;

  const isCreator = t.creator_id === profile.id;
  const hasAccess = isCreator || !!purchaseRes.data;
  const submissions = (mySubsRes.data ?? []) as Submission[];

  return (
    <div className="mx-auto max-w-3xl">
      <Link href="/marketplace" className="text-sm text-brand-400">
        ← Back to marketplace
      </Link>

      <div className="card mt-3">
        <div className="mb-3 flex items-start justify-between gap-4">
          <h1 className="text-2xl font-bold leading-tight">{t.title}</h1>
          <Price value={t.price} />
        </div>

        <div className="mb-4 flex flex-wrap gap-1.5">
          <DifficultyBadge value={t.difficulty} />
          {t.role && <span className="badge bg-brand-50 text-brand-400">{t.role}</span>}
          {t.domain && <span className="badge bg-gray-100 text-gray-600">{t.domain}</span>}
        </div>

        {t.summary && <p className="text-gray-600">{t.summary}</p>}

        {/* Full brief only after purchase (or to the creator). */}
        {hasAccess ? (
          <div className="mt-5 space-y-4">
            <Section title="Brief" body={t.description} />
            <Section title="Acceptance criteria" body={t.acceptance_criteria} />
            <Section title="Review rubric" body={t.review_rubric} />
            {t.starter_repo_url && (
              <div>
                <h3 className="mb-1 text-sm font-semibold text-gray-700">
                  Starter repo / dataset
                </h3>
                <a
                  href={t.starter_repo_url}
                  target="_blank"
                  rel="noreferrer"
                  className="break-all text-sm text-brand-400 underline"
                >
                  {t.starter_repo_url}
                </a>
              </div>
            )}
          </div>
        ) : (
          <div className="mt-5 rounded-lg border border-dashed border-gray-300 bg-gray-50 p-4 text-sm text-gray-500">
            Buy this task to unlock the full brief, starter repo, acceptance
            criteria, and submission.
          </div>
        )}
      </div>

      {/* Buy (mock) — only for non-owners without access. */}
      {!hasAccess && (
        <form action={buyTask} className="mt-4">
          <input type="hidden" name="task_id" value={t.id} />
          <button type="submit" className="btn-primary w-full">
            Buy task — <Price value={t.price} /> <span className="ml-1 opacity-80">(mock checkout)</span>
          </button>
        </form>
      )}

      {isCreator && (
        <div className="mt-4 rounded-lg bg-brand-50 px-4 py-3 text-sm text-brand-500">
          You created this task. Review incoming submissions from your{" "}
          <Link href="/dashboard" className="font-semibold underline">
            dashboard
          </Link>
          .
        </div>
      )}

      {/* Submit a solution — for solvers who bought it. */}
      {hasAccess && !isCreator && (
        <div className="card mt-4">
          <h2 className="mb-1 text-lg font-semibold">Submit your solution</h2>
          <p className="mb-4 text-sm text-gray-500">
            Upload a PDF, ZIP, or any file with your work. The creator reviews it
            and scores it.
          </p>
          <form action={submitSolution} className="space-y-4">
            <input type="hidden" name="task_id" value={t.id} />
            <div>
              <label className="label">Solution file *</label>
              <input
                type="file"
                name="file"
                required
                accept=".pdf,.zip,.rar,.7z,.tar,.gz,.doc,.docx,.txt,.md,.png,.jpg"
                className="input file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-400"
              />
            </div>
            <div>
              <label className="label">Notes for the reviewer</label>
              <textarea
                name="notes"
                rows={3}
                className="input"
                placeholder="Architecture decisions, trade-offs, how to run it…"
              />
            </div>
            <button type="submit" className="btn-primary">
              Submit for review
            </button>
          </form>

          {submissions.length > 0 && (
            <div className="mt-6 border-t border-gray-100 pt-4">
              <h3 className="mb-3 text-sm font-semibold text-gray-700">
                Your submissions
              </h3>
              <ul className="space-y-3">
                {submissions.map((s) => (
                  <li key={s.id} className="rounded-lg border border-gray-200 p-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{s.file_name}</span>
                      <StatusBadge value={s.status} />
                    </div>
                    {s.reviewed_at ? (
                      <div className="mt-2 text-sm">
                        <p className="font-medium text-gray-700">
                          Score: {s.score ?? "—"}/100
                        </p>
                        {s.feedback && (
                          <p className="mt-1 whitespace-pre-wrap text-gray-600">
                            {s.feedback}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="mt-2 text-xs text-gray-400">
                        Awaiting review.
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function Section({ title, body }: { title: string; body: string }) {
  if (!body) return null;
  return (
    <div>
      <h3 className="mb-1 text-sm font-semibold text-gray-700">{title}</h3>
      <p className="whitespace-pre-wrap text-sm text-gray-600">{body}</p>
    </div>
  );
}

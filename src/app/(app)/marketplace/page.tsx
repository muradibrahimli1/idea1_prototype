import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { DifficultyBadge, Price } from "@/components/badges";
import type { Task, Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

type TaskWithCreator = Task & { creator: Pick<Profile, "full_name"> | null };

export default async function MarketplacePage() {
  const supabase = createClient();

  const { data: tasks } = await supabase
    .from("tasks")
    .select("*, creator:profiles!tasks_creator_id_fkey(full_name)")
    .order("created_at", { ascending: false });

  const list = (tasks ?? []) as TaskWithCreator[];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Marketplace</h1>
          <p className="text-sm text-gray-500">
            Buy a task, build the solution, get it reviewed.
          </p>
        </div>
        <Link href="/tasks/create" className="btn-primary">
          + New task
        </Link>
      </div>

      {list.length === 0 ? (
        <div className="card text-center text-sm text-gray-500">
          No tasks yet. Be the first to{" "}
          <Link href="/tasks/create" className="font-medium text-brand-400">
            publish one
          </Link>
          .
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((task) => (
            <Link key={task.id} href={`/tasks/${task.id}`} className="card block transition hover:shadow-md">
              <div className="mb-2 flex items-center justify-between">
                <DifficultyBadge value={task.difficulty} />
                <Price value={task.price} />
              </div>
              <h3 className="font-semibold leading-snug">{task.title}</h3>
              <p className="mt-1 line-clamp-2 text-sm text-gray-500">
                {task.summary || task.description}
              </p>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {task.role && (
                  <span className="badge bg-brand-50 text-brand-400">{task.role}</span>
                )}
                {task.domain && (
                  <span className="badge bg-gray-100 text-gray-600">{task.domain}</span>
                )}
              </div>
              <p className="mt-3 text-xs text-gray-400">
                by {task.creator?.full_name || "Unknown expert"}
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

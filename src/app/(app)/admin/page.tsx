import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { requireAdmin } from "@/lib/auth";
import { DifficultyBadge, Price, StatusBadge } from "@/components/badges";
import type { Submission, Task, Purchase, Profile } from "@/lib/types";

export const dynamic = "force-dynamic";

type TaskRow = Task & { creator: Pick<Profile, "full_name" | "email"> | null };
type SubRow = Submission & {
  solver: Pick<Profile, "full_name" | "email"> | null;
  task: Pick<Task, "title"> | null;
};
type PurchaseRow = Purchase & {
  solver: Pick<Profile, "full_name"> | null;
  task: Pick<Task, "title"> | null;
};

function fmt(d: string | null) {
  return d ? new Date(d).toLocaleDateString(undefined, { dateStyle: "medium" }) : "—";
}

export default async function AdminPage() {
  await requireAdmin();
  const supabase = createClient();

  const [profilesRes, tasksRes, subsRes, purchasesRes] = await Promise.all([
    supabase.from("profiles").select("*").order("created_at", { ascending: false }),
    supabase
      .from("tasks")
      .select("*, creator:profiles!tasks_creator_id_fkey(full_name, email)")
      .order("created_at", { ascending: false }),
    supabase
      .from("submissions")
      .select(
        "*, solver:profiles!submissions_solver_id_fkey(full_name, email), task:tasks(title)",
      )
      .order("created_at", { ascending: false }),
    supabase
      .from("purchases")
      .select(
        "*, solver:profiles!purchases_solver_id_fkey(full_name), task:tasks(title)",
      )
      .order("created_at", { ascending: false }),
  ]);

  const users = (profilesRes.data ?? []) as Profile[];
  const tasks = (tasksRes.data ?? []) as TaskRow[];
  const subs = (subsRes.data ?? []) as SubRow[];
  const purchases = (purchasesRes.data ?? []) as PurchaseRow[];

  // Sign a download link for every file in every submission.
  const signed: Record<string, { name: string; url: string }[]> = {};
  await Promise.all(
    subs.map(async (s) => {
      if (!s.file_paths?.length) return;
      const { data } = await supabase.storage
        .from("submissions")
        .createSignedUrls(s.file_paths, 60 * 60);
      if (data) {
        signed[s.id] = data
          .map((d, i) => ({ name: s.file_names[i] ?? `file ${i + 1}`, url: d.signedUrl ?? "" }))
          .filter((f) => f.url);
      }
    }),
  );

  const stats = [
    { label: "Users", value: users.length, sub: `${users.filter((u) => u.user_type === "creator").length} creators · ${users.filter((u) => u.user_type === "solver").length} solvers` },
    { label: "Tasks", value: tasks.length },
    { label: "Purchases", value: purchases.length },
    {
      label: "Submissions",
      value: subs.length,
      sub: `${subs.filter((s) => s.status === "pending").length} pending · ${subs.filter((s) => s.status === "approved").length} approved · ${subs.filter((s) => s.status === "rejected").length} rejected`,
    },
  ];

  return (
    <div className="space-y-10">
      <div>
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-bold">Admin</h1>
          <span className="badge bg-brand-400 text-white">god view</span>
        </div>
        <p className="text-sm text-gray-500">
          Everything created and solved across the platform.
        </p>
      </div>

      {/* ---- Stats ---- */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="card">
            <div className="text-3xl font-bold">{s.value}</div>
            <div className="mt-1 text-sm font-medium text-gray-600">{s.label}</div>
            {s.sub && <div className="mt-1 text-xs text-gray-400">{s.sub}</div>}
          </div>
        ))}
      </div>

      {/* ---- Tasks ---- */}
      <Section title={`All tasks (${tasks.length})`}>
        <Table head={["Task", "Creator", "Role / Domain", "Level", "Price", "Created"]}>
          {tasks.map((t) => (
            <tr key={t.id} className="border-t border-gray-100">
              <td className="px-3 py-2">
                <Link href={`/tasks/${t.id}`} className="font-medium text-brand-400 hover:underline">
                  {t.title}
                </Link>
              </td>
              <td className="px-3 py-2 text-gray-600">{t.creator?.full_name || t.creator?.email || "—"}</td>
              <td className="px-3 py-2 text-gray-600">{[t.role, t.domain].filter(Boolean).join(" · ") || "—"}</td>
              <td className="px-3 py-2"><DifficultyBadge value={t.difficulty} /></td>
              <td className="px-3 py-2"><Price value={t.price} /></td>
              <td className="px-3 py-2 text-gray-500">{fmt(t.created_at)}</td>
            </tr>
          ))}
          {tasks.length === 0 && <Empty cols={6} text="No tasks yet." />}
        </Table>
      </Section>

      {/* ---- Submissions ---- */}
      <Section title={`All submissions (${subs.length})`}>
        <Table head={["Task", "Solver", "Files", "Status", "Score", "Submitted"]}>
          {subs.map((s) => (
            <tr key={s.id} className="border-t border-gray-100 align-top">
              <td className="px-3 py-2 text-gray-700">{s.task?.title || "—"}</td>
              <td className="px-3 py-2 text-gray-600">{s.solver?.full_name || s.solver?.email || "—"}</td>
              <td className="px-3 py-2">
                <div className="flex flex-col gap-1">
                  {(signed[s.id] ?? s.file_names.map((n) => ({ name: n, url: "" }))).map((f, i) =>
                    f.url ? (
                      <a key={i} href={f.url} target="_blank" rel="noreferrer" className="text-brand-400 underline">
                        📎 {f.name}
                      </a>
                    ) : (
                      <span key={i} className="text-gray-500">📎 {f.name}</span>
                    ),
                  )}
                </div>
              </td>
              <td className="px-3 py-2"><StatusBadge value={s.status} /></td>
              <td className="px-3 py-2 text-gray-700">{s.score != null ? `${s.score}/100` : "—"}</td>
              <td className="px-3 py-2 text-gray-500">{fmt(s.created_at)}</td>
            </tr>
          ))}
          {subs.length === 0 && <Empty cols={6} text="No submissions yet." />}
        </Table>
      </Section>

      {/* ---- Purchases ---- */}
      <Section title={`All purchases (${purchases.length})`}>
        <Table head={["Task", "Buyer", "When"]}>
          {purchases.map((p) => (
            <tr key={p.id} className="border-t border-gray-100">
              <td className="px-3 py-2 text-gray-700">{p.task?.title || "—"}</td>
              <td className="px-3 py-2 text-gray-600">{p.solver?.full_name || "—"}</td>
              <td className="px-3 py-2 text-gray-500">{fmt(p.created_at)}</td>
            </tr>
          ))}
          {purchases.length === 0 && <Empty cols={3} text="No purchases yet." />}
        </Table>
      </Section>

      {/* ---- Users ---- */}
      <Section title={`All users (${users.length})`}>
        <Table head={["Name", "Email", "Type", "Admin", "Joined"]}>
          {users.map((u) => (
            <tr key={u.id} className="border-t border-gray-100">
              <td className="px-3 py-2 font-medium text-gray-700">{u.full_name || "—"}</td>
              <td className="px-3 py-2 text-gray-600">{u.email || "—"}</td>
              <td className="px-3 py-2 capitalize text-gray-600">{u.user_type}</td>
              <td className="px-3 py-2">{u.is_admin ? <span className="badge bg-brand-50 text-brand-400">admin</span> : "—"}</td>
              <td className="px-3 py-2 text-gray-500">{fmt(u.created_at)}</td>
            </tr>
          ))}
        </Table>
      </Section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-3 text-lg font-semibold">{title}</h2>
      <div className="overflow-x-auto rounded-xl border border-gray-200 bg-white">
        {children}
      </div>
    </section>
  );
}

function Table({ head, children }: { head: string[]; children: React.ReactNode }) {
  return (
    <table className="w-full text-left text-sm">
      <thead>
        <tr className="bg-gray-50 text-xs uppercase tracking-wide text-gray-500">
          {head.map((h) => (
            <th key={h} className="px-3 py-2 font-medium">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}

function Empty({ cols, text }: { cols: number; text: string }) {
  return (
    <tr>
      <td colSpan={cols} className="px-3 py-6 text-center text-gray-400">{text}</td>
    </tr>
  );
}

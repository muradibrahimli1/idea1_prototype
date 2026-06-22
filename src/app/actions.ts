"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

async function requireUserId() {
  const supabase = createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  return { supabase, userId: user.id };
}

// --- Creator: publish a task ------------------------------------------------
export async function createTask(formData: FormData) {
  const { supabase, userId } = await requireUserId();

  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;

  const { data, error } = await supabase
    .from("tasks")
    .insert({
      creator_id: userId,
      title,
      summary: String(formData.get("summary") ?? ""),
      description: String(formData.get("description") ?? ""),
      role: String(formData.get("role") ?? ""),
      domain: String(formData.get("domain") ?? ""),
      difficulty: String(formData.get("difficulty") ?? "Junior"),
      price: Number(formData.get("price") ?? 0),
      starter_repo_url: String(formData.get("starter_repo_url") ?? ""),
      acceptance_criteria: String(formData.get("acceptance_criteria") ?? ""),
      review_rubric: String(formData.get("review_rubric") ?? ""),
    })
    .select("id")
    .single();

  if (error) throw new Error(error.message);

  revalidatePath("/marketplace");
  revalidatePath("/dashboard");
  redirect(`/tasks/${data.id}`);
}

// --- Solver: mock "buy" a task ----------------------------------------------
export async function buyTask(formData: FormData) {
  const { supabase, userId } = await requireUserId();
  const taskId = String(formData.get("task_id") ?? "");
  if (!taskId) return;

  // Mock payment: simply record the purchase (ignore duplicates).
  const { error } = await supabase
    .from("purchases")
    .insert({ task_id: taskId, solver_id: userId });

  if (error && !error.message.includes("duplicate")) {
    throw new Error(error.message);
  }

  revalidatePath(`/tasks/${taskId}`);
  revalidatePath("/dashboard");
  redirect(`/tasks/${taskId}`);
}

// --- Solver: submit a solution (1..MAX_SUBMISSION_FILES PDF/ZIP files) -------
const MAX_FILES = 5;
const ALLOWED_EXT = /\.(pdf|zip)$/i;

export async function submitSolution(formData: FormData) {
  const { supabase, userId } = await requireUserId();
  const taskId = String(formData.get("task_id") ?? "");
  const notes = String(formData.get("notes") ?? "");
  const files = formData
    .getAll("files")
    .filter((f): f is File => f instanceof File && f.size > 0);

  if (!taskId) throw new Error("Missing task.");
  if (files.length === 0) throw new Error("Attach at least one file.");
  if (files.length > MAX_FILES) {
    throw new Error(`You can upload at most ${MAX_FILES} files.`);
  }
  for (const f of files) {
    if (!ALLOWED_EXT.test(f.name)) {
      throw new Error(`Only PDF or ZIP files are allowed (got "${f.name}").`);
    }
  }

  // Upload all files in parallel. Paths must start with the user's id so the
  // storage RLS upload policy allows them. The index keeps names unique.
  const stamp = Date.now();
  const uploaded = await Promise.all(
    files.map(async (f, i) => {
      const safeName = f.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${userId}/${taskId}/${stamp}-${i}-${safeName}`;
      const { error } = await supabase.storage
        .from("submissions")
        .upload(path, f, { upsert: false });
      if (error) throw new Error(error.message);
      return { path, name: f.name };
    }),
  );

  const { error: insertError } = await supabase.from("submissions").insert({
    task_id: taskId,
    solver_id: userId,
    file_paths: uploaded.map((u) => u.path),
    file_names: uploaded.map((u) => u.name),
    notes,
  });

  if (insertError) throw new Error(insertError.message);

  revalidatePath(`/tasks/${taskId}`);
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

// --- Creator: review a submission -------------------------------------------
export async function reviewSubmission(formData: FormData) {
  const { supabase } = await requireUserId();
  const submissionId = String(formData.get("submission_id") ?? "");
  const status = String(formData.get("status") ?? "pending");
  const score = Number(formData.get("score") ?? 0);
  const feedback = String(formData.get("feedback") ?? "");

  if (!submissionId) return;

  // RLS guarantees only the task creator can update this row.
  const { error } = await supabase
    .from("submissions")
    .update({
      status,
      score: Number.isFinite(score) ? score : null,
      feedback,
      reviewed_at: new Date().toISOString(),
    })
    .eq("id", submissionId);

  if (error) throw new Error(error.message);

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

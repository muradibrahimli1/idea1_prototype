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

// --- Solver: submit a solution file -----------------------------------------
export async function submitSolution(formData: FormData) {
  const { supabase, userId } = await requireUserId();
  const taskId = String(formData.get("task_id") ?? "");
  const notes = String(formData.get("notes") ?? "");
  const file = formData.get("file") as File | null;

  if (!taskId || !file || file.size === 0) {
    throw new Error("A file is required to submit.");
  }

  // Path must start with the user's id so storage RLS allows the upload.
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const path = `${userId}/${taskId}/${Date.now()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("submissions")
    .upload(path, file, { upsert: false });

  if (uploadError) throw new Error(uploadError.message);

  const { error: insertError } = await supabase.from("submissions").insert({
    task_id: taskId,
    solver_id: userId,
    file_path: path,
    file_name: file.name,
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

"use client";

import { deleteTask } from "@/app/actions";

export default function DeleteTaskButton({
  taskId,
  className = "",
  label = "Delete task",
}: {
  taskId: string;
  className?: string;
  label?: string;
}) {
  return (
    <form
      action={deleteTask}
      onSubmit={(e) => {
        if (
          !confirm(
            "Delete this task? Its purchases and submissions will be removed too. This cannot be undone.",
          )
        ) {
          e.preventDefault();
        }
      }}
    >
      <input type="hidden" name="task_id" value={taskId} />
      <button
        type="submit"
        className={`rounded-md border border-red-200 px-2.5 py-1 text-xs font-medium text-red-600 transition hover:bg-red-50 ${className}`}
      >
        {label}
      </button>
    </form>
  );
}

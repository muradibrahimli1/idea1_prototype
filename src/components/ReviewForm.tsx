import { reviewSubmission } from "@/app/actions";
import type { Submission } from "@/lib/types";

export default function ReviewForm({ submission }: { submission: Submission }) {
  const reviewed = !!submission.reviewed_at;

  return (
    <details className="mt-2 rounded-lg border border-gray-200" open={!reviewed}>
      <summary className="cursor-pointer px-3 py-2 text-sm font-medium text-brand-400">
        {reviewed ? "Edit review" : "Review this submission"}
      </summary>
      <form action={reviewSubmission} className="space-y-3 p-3 pt-1">
        <input type="hidden" name="submission_id" value={submission.id} />

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Score (0–100)</label>
            <input
              name="score"
              type="number"
              min="0"
              max="100"
              defaultValue={submission.score ?? 70}
              className="input"
            />
          </div>
          <div>
            <label className="label">Decision</label>
            <select
              name="status"
              className="input"
              defaultValue={submission.status === "pending" ? "approved" : submission.status}
            >
              <option value="approved">Approve (endorse)</option>
              <option value="rejected">Reject</option>
              <option value="pending">Keep pending</option>
            </select>
          </div>
        </div>

        <div>
          <label className="label">Feedback</label>
          <textarea
            name="feedback"
            rows={3}
            defaultValue={submission.feedback}
            className="input"
            placeholder="What was good, what to improve…"
          />
        </div>

        <button type="submit" className="btn-primary">
          {reviewed ? "Update review" : "Submit review"}
        </button>
      </form>
    </details>
  );
}

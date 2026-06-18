import { createTask } from "@/app/actions";
import { DIFFICULTIES, ROLES } from "@/lib/types";

export default function CreateTaskPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="text-2xl font-bold">Create a task</h1>
      <p className="mb-6 text-sm text-gray-500">
        Publish a realistic, sanitized task package into the marketplace.
      </p>

      <form action={createTask} className="card space-y-5">
        <div>
          <label className="label">Title *</label>
          <input
            name="title"
            required
            className="input"
            placeholder="Build an idempotent e-commerce checkout endpoint"
          />
        </div>

        <div>
          <label className="label">Short summary</label>
          <input
            name="summary"
            className="input"
            placeholder="One line shown on the marketplace card"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Role</label>
            <select name="role" className="input" defaultValue="Backend">
              {ROLES.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Domain</label>
            <input name="domain" className="input" placeholder="e-commerce" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="label">Difficulty</label>
            <select name="difficulty" className="input" defaultValue="Junior">
              {DIFFICULTIES.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="label">Price (USD)</label>
            <input
              name="price"
              type="number"
              min="0"
              step="1"
              defaultValue={25}
              className="input"
            />
          </div>
        </div>

        <div>
          <label className="label">Description / brief</label>
          <textarea
            name="description"
            rows={5}
            className="input"
            placeholder="Business context, what to build, expected outputs…"
          />
        </div>

        <div>
          <label className="label">Starter repo / dataset URL</label>
          <input
            name="starter_repo_url"
            className="input"
            placeholder="https://github.com/…"
          />
        </div>

        <div>
          <label className="label">Acceptance criteria</label>
          <textarea
            name="acceptance_criteria"
            rows={3}
            className="input"
            placeholder="- Handles duplicate requests&#10;- Has tests&#10;- …"
          />
        </div>

        <div>
          <label className="label">Review rubric</label>
          <textarea
            name="review_rubric"
            rows={3}
            className="input"
            placeholder="How you'll score the submission"
          />
        </div>

        <button type="submit" className="btn-primary w-full">
          Publish task
        </button>
      </form>
    </div>
  );
}

"use client";

import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { submitSolution } from "@/app/actions";
import { MAX_SUBMISSION_FILES } from "@/lib/types";

const ALLOWED = /\.(pdf|zip)$/i;

function prettySize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function SubmitButton({ disabled }: { disabled: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={disabled || pending} className="btn-primary">
      {pending ? "Submitting…" : "Submit for review"}
    </button>
  );
}

export default function SubmitForm({ taskId }: { taskId: string }) {
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  // Hidden input that actually carries the files to the server action.
  const carrierRef = useRef<HTMLInputElement>(null);
  // Visible picker that we reset after each selection.
  const pickerRef = useRef<HTMLInputElement>(null);

  function syncCarrier(next: File[]) {
    const dt = new DataTransfer();
    next.forEach((f) => dt.items.add(f));
    if (carrierRef.current) carrierRef.current.files = dt.files;
  }

  function addPicked(picked: FileList | null) {
    if (!picked) return;
    const next = [...files];
    let err: string | null = null;
    for (const f of Array.from(picked)) {
      if (!ALLOWED.test(f.name)) {
        err = `Only PDF or ZIP files are allowed (got "${f.name}").`;
        continue;
      }
      if (next.some((m) => m.name === f.name && m.size === f.size)) continue; // dedupe
      if (next.length >= MAX_SUBMISSION_FILES) {
        err = `You can upload at most ${MAX_SUBMISSION_FILES} files.`;
        break;
      }
      next.push(f);
    }
    setFiles(next);
    syncCarrier(next);
    setError(err);
    if (pickerRef.current) pickerRef.current.value = ""; // let the same file be re-picked
  }

  function removeAt(i: number) {
    const next = files.filter((_, idx) => idx !== i);
    setFiles(next);
    syncCarrier(next);
    setError(null);
  }

  return (
    <form
      action={submitSolution}
      className="space-y-4"
      onSubmit={(e) => {
        if (files.length === 0) {
          e.preventDefault();
          setError("Attach at least one file.");
        }
      }}
    >
      <input type="hidden" name="task_id" value={taskId} />
      {/* Canonical file list submitted to the server action. */}
      <input
        ref={carrierRef}
        type="file"
        name="files"
        multiple
        className="hidden"
        tabIndex={-1}
        aria-hidden
      />

      <div>
        <label className="label">
          Solution files * (PDF or ZIP, max {MAX_SUBMISSION_FILES})
        </label>
        <input
          ref={pickerRef}
          type="file"
          multiple
          accept=".pdf,.zip,application/pdf,application/zip,application/x-zip-compressed"
          onChange={(e) => addPicked(e.target.files)}
          disabled={files.length >= MAX_SUBMISSION_FILES}
          className="input file:mr-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-brand-400 disabled:opacity-50"
        />
        <p className="mt-1 text-xs text-gray-400">
          {files.length}/{MAX_SUBMISSION_FILES} selected · pick more to add them
          to the list.
        </p>
      </div>

      {error && (
        <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
          {error}
        </p>
      )}

      {files.length > 0 && (
        <ul className="space-y-2">
          {files.map((f, i) => (
            <li
              key={`${f.name}-${f.size}-${i}`}
              className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 bg-gray-50 px-3 py-2"
            >
              <span className="flex min-w-0 items-center gap-2 text-sm">
                <span className="text-gray-400">📎</span>
                <span className="truncate font-medium">{f.name}</span>
                <span className="shrink-0 text-xs text-gray-400">
                  {prettySize(f.size)}
                </span>
              </span>
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="shrink-0 rounded-md px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}

      <div>
        <label className="label">Notes for the reviewer</label>
        <textarea
          name="notes"
          rows={3}
          className="input"
          placeholder="Architecture decisions, trade-offs, how to run it…"
        />
      </div>

      <SubmitButton disabled={files.length === 0} />
    </form>
  );
}

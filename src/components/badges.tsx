import type { SubmissionStatus } from "@/lib/types";

export function DifficultyBadge({ value }: { value: string }) {
  const color =
    value === "Senior"
      ? "bg-red-50 text-red-600"
      : value === "Middle"
        ? "bg-amber-50 text-amber-600"
        : "bg-green-50 text-green-600";
  return <span className={`badge ${color}`}>{value}</span>;
}

export function StatusBadge({ value }: { value: SubmissionStatus }) {
  const map: Record<SubmissionStatus, string> = {
    pending: "bg-gray-100 text-gray-600",
    approved: "bg-green-50 text-green-600",
    rejected: "bg-red-50 text-red-600",
  };
  return <span className={`badge capitalize ${map[value]}`}>{value}</span>;
}

export function Price({ value }: { value: number }) {
  return (
    <span className="font-semibold text-gray-900">
      {value > 0 ? `$${value}` : "Free"}
    </span>
  );
}

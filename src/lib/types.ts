export type UserType = "creator" | "solver";

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  user_type: UserType;
  is_admin: boolean;
  created_at: string;
};

export type Task = {
  id: string;
  creator_id: string;
  title: string;
  summary: string;
  description: string;
  role: string;
  domain: string;
  difficulty: string;
  price: number;
  starter_repo_url: string;
  acceptance_criteria: string;
  review_rubric: string;
  created_at: string;
};

export type Purchase = {
  id: string;
  task_id: string;
  solver_id: string;
  created_at: string;
};

export type SubmissionStatus = "pending" | "approved" | "rejected";

export const MAX_SUBMISSION_FILES = 5;

export type Submission = {
  id: string;
  task_id: string;
  solver_id: string;
  file_paths: string[];
  file_names: string[];
  notes: string;
  status: SubmissionStatus;
  score: number | null;
  feedback: string;
  reviewed_at: string | null;
  created_at: string;
};

export const DIFFICULTIES = ["Junior", "Middle", "Senior"] as const;

export const ROLES = [
  "Backend",
  "Frontend",
  "Full-stack",
  "DevOps / SRE",
  "QA Automation",
  "Data Engineering",
  "AI / ML",
  "Mobile",
  "Cybersecurity",
] as const;

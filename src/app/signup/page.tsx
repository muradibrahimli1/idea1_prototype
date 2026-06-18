"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { UserType } from "@/lib/types";

export default function SignupPage() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [userType, setUserType] = useState<UserType>("solver");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const supabase = createClient();

    const { data, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: fullName, user_type: userType },
      },
    });

    if (signUpError) {
      setError(signUpError.message);
      setLoading(false);
      return;
    }

    // If email confirmation is OFF, a session exists now and we can route.
    if (!data.session) {
      setError(
        "Account created. Email confirmation appears to be ON — disable it in Supabase Auth settings for the prototype, then log in.",
      );
      setLoading(false);
      return;
    }

    // First-login routing per chosen role.
    const dest = userType === "creator" ? "/tasks/create" : "/marketplace";
    router.push(dest);
    router.refresh();
  }

  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-brand-400">Devex</h1>
          <p className="mt-1 text-sm text-gray-500">Create your account</p>
        </div>

        <form onSubmit={handleSubmit} className="card space-y-4">
          <h2 className="text-lg font-semibold">Sign up</h2>

          {error && (
            <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              {error}
            </p>
          )}

          {/* Role selection — decides where you land after signup. */}
          <div>
            <label className="label">I want to join as</label>
            <div className="grid grid-cols-2 gap-3">
              <RoleCard
                active={userType === "creator"}
                title="Creator"
                desc="Publish tasks & review work"
                onClick={() => setUserType("creator")}
              />
              <RoleCard
                active={userType === "solver"}
                title="Solver"
                desc="Buy tasks & submit solutions"
                onClick={() => setUserType("solver")}
              />
            </div>
            <p className="mt-2 text-xs text-gray-400">
              You can still do everything either way — this just sets where you
              start.
            </p>
          </div>

          <div>
            <label className="label">Full name</label>
            <input
              type="text"
              required
              className="input"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Ada Lovelace"
            />
          </div>

          <div>
            <label className="label">Email</label>
            <input
              type="email"
              required
              className="input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="label">Password</label>
            <input
              type="password"
              required
              minLength={6}
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="At least 6 characters"
            />
          </div>

          <button type="submit" disabled={loading} className="btn-primary w-full">
            {loading ? "Creating account…" : `Sign up as ${userType}`}
          </button>

          <p className="text-center text-sm text-gray-500">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-brand-400">
              Log in
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}

function RoleCard({
  active,
  title,
  desc,
  onClick,
}: {
  active: boolean;
  title: string;
  desc: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-lg border p-3 text-left transition ${
        active
          ? "border-brand-400 bg-brand-50 ring-2 ring-brand-100"
          : "border-gray-300 bg-white hover:border-gray-400"
      }`}
    >
      <span className="block text-sm font-semibold">{title}</span>
      <span className="mt-0.5 block text-xs text-gray-500">{desc}</span>
    </button>
  );
}

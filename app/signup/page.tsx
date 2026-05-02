"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useMemo, useState } from "react";

export default function SignupPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = useMemo(() => searchParams.get("redirect") || "/account", [searchParams]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);

    const formData = new FormData(event.currentTarget);
    const firstName = String(formData.get("first_name") || "").trim();
    const lastName = String(formData.get("last_name") || "").trim();
    const email = String(formData.get("email") || "").trim();
    const password = String(formData.get("password") || "");

    if (!email || !password) {
      setError("Email and password are required.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          email,
          password,
        }),
      });

      const payload = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(payload.error || "Unable to create account");
        return;
      }

      router.push(redirect);
      router.refresh();
    } catch {
      setError("Network error. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-20">
      <div className="flex flex-col items-center text-center mb-10">
        <div className="h-12 w-12 rounded-2xl bg-brand-primary text-white grid place-items-center text-xl font-black shadow-xl shadow-brand-primary/20 mb-6">
          MB
        </div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">
          Create Account
        </h1>
        <p className="mt-2 text-slate-500 font-medium">
          Join MyBestStore for a premium shopping experience.
        </p>
      </div>

      <form onSubmit={onSubmit} className="rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-200/50 p-8 space-y-5">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="first_name" className="mb-2 block text-sm font-bold text-slate-700 uppercase tracking-widest">
              First name
            </label>
            <input
              id="first_name"
              name="first_name"
              type="text"
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm text-slate-900 outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all placeholder:text-slate-400"
            />
          </div>
          <div>
            <label htmlFor="last_name" className="mb-2 block text-sm font-bold text-slate-700 uppercase tracking-widest">
              Last name
            </label>
            <input
              id="last_name"
              name="last_name"
              type="text"
              className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm text-slate-900 outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all placeholder:text-slate-400"
            />
          </div>
        </div>
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-bold text-slate-700 uppercase tracking-widest">
            Email Address
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm text-slate-900 outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all placeholder:text-slate-400"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-bold text-slate-700 uppercase tracking-widest">
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50/50 px-4 text-sm text-slate-900 outline-none focus:border-brand-primary focus:ring-4 focus:ring-brand-primary/10 transition-all placeholder:text-slate-400"
            placeholder="At least 8 characters"
          />
        </div>

        {error ? (
          <div className="p-4 rounded-xl bg-red-50 border border-red-100 flex gap-3 items-center">
             <div className="h-2 w-2 rounded-full bg-red-500" />
             <p className="text-xs font-bold text-red-600 uppercase tracking-tight">{error}</p>
          </div>
        ) : null}

        <button
          type="submit"
          disabled={isLoading}
          className="h-14 w-full rounded-xl bg-slate-900 text-white font-black uppercase tracking-widest text-sm shadow-xl shadow-slate-900/20 hover:bg-brand-primary hover:shadow-brand-primary/30 transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {isLoading ? "Creating Account..." : "Create Account"}
        </button>

        <div className="pt-4 text-center">
          <p className="text-sm text-slate-500 font-medium">
            Already have an account?{" "}
            <Link className="font-bold text-brand-primary hover:underline" href="/login">
              Login
            </Link>
          </p>
        </div>
      </form>
    </div>
  );
}

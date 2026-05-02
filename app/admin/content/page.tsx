"use client";

import { useState } from "react";

const DEFAULT_JSON = JSON.stringify(
  {
    heroSlides: [
      {
        eyebrow: "MyBestStore",
        title: "From Browse To Doorstep",
        subtitle: "A faster shopping flow for Pakistan with seamless PKR checkout.",
        cta: "Shop New Arrivals",
        href: "#new-arrivals",
      },
    ],
    newArrivalsTitle: "New Arrivals",
    categoriesTitle: "Shop by Category",
    stats: [
      { value: "2,291+", label: "Happy Customers" },
      { value: "4.8/5", label: "Average Product Rating" },
    ],
  },
  null,
  2
);

export default function AdminContentPage() {
  const [secret, setSecret] = useState("");
  const [actor, setActor] = useState("admin-portal");
  const [value, setValue] = useState(DEFAULT_JSON);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const load = async () => {
    setIsLoading(true);
    setMessage(null);
    setError(null);

    try {
      const res = await fetch("/api/admin/cms/homepage", {
        headers: {
          "x-admin-secret": secret,
        },
      });
      const payload = (await res.json()) as {
        homepage_content?: unknown;
        error?: string;
      };
      if (!res.ok) {
        setError(payload.error || "Failed to load content");
        return;
      }

      if (payload.homepage_content) {
        setValue(JSON.stringify(payload.homepage_content, null, 2));
      }
    } catch {
      setError("Network error while loading content");
    } finally {
      setIsLoading(false);
    }
  };

  const save = async () => {
    setIsLoading(true);
    setMessage(null);
    setError(null);

    let parsed: unknown;
    try {
      parsed = JSON.parse(value);
    } catch {
      setError("Content JSON is invalid");
      setIsLoading(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/cms/homepage", {
        method: "PUT",
        headers: {
          "content-type": "application/json",
          "x-admin-secret": secret,
        },
        body: JSON.stringify({ homepage_content: parsed, actor }),
      });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(payload.error || "Failed to save content");
        return;
      }

      setMessage("Homepage content saved successfully.");
    } catch {
      setError("Network error while saving content");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <h1 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
        Homepage Content CMS
      </h1>
      <p className="mt-2 text-sm text-foreground/70">
        Manage hero slides, section titles, and homepage stats through Digital Soft store metadata.
      </p>

      <div className="mt-6 grid gap-4 rounded-2xl border border-foreground/10 bg-background p-5">
        <div>
          <label className="mb-1 block text-sm text-foreground/80" htmlFor="secret">
            Admin secret
          </label>
          <input
            id="secret"
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            className="h-11 w-full rounded-xl border border-foreground/15 bg-background px-3 text-sm outline-none focus:border-brand-cyan/60"
            placeholder="Matches ADMIN_PORTAL_SECRET"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-foreground/80" htmlFor="actor">
            Actor label for audit log
          </label>
          <input
            id="actor"
            type="text"
            value={actor}
            onChange={(e) => setActor(e.target.value)}
            className="h-11 w-full rounded-xl border border-foreground/15 bg-background px-3 text-sm outline-none focus:border-brand-cyan/60"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm text-foreground/80" htmlFor="content-json">
            Homepage content JSON
          </label>
          <textarea
            id="content-json"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            className="min-h-[360px] w-full rounded-xl border border-foreground/15 bg-background p-3 font-mono text-xs outline-none focus:border-brand-cyan/60"
          />
        </div>

        {error ? <p className="text-sm text-red-600">{error}</p> : null}
        {message ? <p className="text-sm text-green-700">{message}</p> : null}

        <div className="flex gap-3">
          <button
            type="button"
            onClick={load}
            disabled={!secret || isLoading}
            className="h-10 rounded-full border border-foreground/15 bg-background px-4 text-sm disabled:opacity-50"
          >
            Load from Digital Soft
          </button>
          <button
            type="button"
            onClick={save}
            disabled={!secret || isLoading}
            className="h-10 rounded-full bg-foreground px-4 text-sm text-background disabled:opacity-50"
          >
            {isLoading ? "Saving..." : "Save Content"}
          </button>
        </div>
      </div>
    </div>
  );
}

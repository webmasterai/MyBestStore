"use client";

import { FormEvent, useMemo, useState } from "react";

type Product = {
  id: string;
  title?: string;
  handle?: string;
  status?: string;
};

export default function AdminProductsPage() {
  const [secret, setSecret] = useState("");
  const [actor, setActor] = useState("admin-portal");
  const [products, setProducts] = useState<Product[]>([]);
  const [title, setTitle] = useState("");
  const [handle, setHandle] = useState("");
  const [status, setStatus] = useState("draft");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  const canRun = useMemo(() => Boolean(secret.trim()), [secret]);

  async function load() {
    if (!canRun) return;
    setIsBusy(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/products", {
        headers: { "x-admin-secret": secret },
      });
      const payload = (await res.json()) as { products?: Product[]; error?: string };
      if (!res.ok) {
        setError(payload.error || "Unable to load products");
        return;
      }
      setProducts(payload.products || []);
      setMessage("Products loaded.");
    } catch {
      setError("Network error while loading products.");
    } finally {
      setIsBusy(false);
    }
  }

  async function createProduct(e: FormEvent) {
    e.preventDefault();
    if (!canRun) return;

    const confirmed = window.confirm("Create this product now?");
    if (!confirmed) return;

    setIsBusy(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/products", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "x-admin-secret": secret,
        },
        body: JSON.stringify({
          title,
          handle,
          status,
          metadata: { actor },
        }),
      });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(payload.error || "Failed to create product");
        return;
      }

      setMessage("Product created.");
      setTitle("");
      setHandle("");
      setStatus("draft");
      await load();
    } catch {
      setError("Network error while creating product.");
    } finally {
      setIsBusy(false);
    }
  }

  async function updateProduct(p: Product) {
    if (!canRun) return;
    const nextTitle = window.prompt("New product title", p.title || "");
    if (!nextTitle) return;

    const confirmed = window.confirm(`Apply changes to ${p.title || p.id}?`);
    if (!confirmed) return;

    setIsBusy(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/products/${p.id}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          "x-admin-secret": secret,
        },
        body: JSON.stringify({ title: nextTitle, metadata: { actor } }),
      });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(payload.error || "Failed to update product");
        return;
      }
      setMessage("Product updated.");
      await load();
    } catch {
      setError("Network error while updating product.");
    } finally {
      setIsBusy(false);
    }
  }

  async function deleteProduct(p: Product) {
    if (!canRun) return;

    const confirmed = window.confirm(
      `Delete product ${p.title || p.id}? This cannot be undone.`
    );
    if (!confirmed) return;

    setIsBusy(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/products/${p.id}`, {
        method: "DELETE",
        headers: {
          "x-admin-secret": secret,
        },
      });
      const payload = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) {
        setError(payload.error || "Failed to delete product");
        return;
      }
      setMessage("Product deleted.");
      await load();
    } catch {
      setError("Network error while deleting product.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
        Admin Products
      </h1>
      <p className="mt-2 text-sm text-foreground/70">
        In-app product CRUD with confirmation prompts for edit and delete.
      </p>

      <div className="mt-6 grid gap-4 rounded-2xl border border-foreground/10 bg-background p-5 md:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm text-foreground/80">Admin secret</label>
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            className="h-11 w-full rounded-xl border border-foreground/15 px-3 text-sm"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm text-foreground/80">Actor</label>
          <input
            type="text"
            value={actor}
            onChange={(e) => setActor(e.target.value)}
            className="h-11 w-full rounded-xl border border-foreground/15 px-3 text-sm"
          />
        </div>

        <form onSubmit={createProduct} className="md:col-span-2 grid gap-3 rounded-xl border border-foreground/10 p-4">
          <h2 className="text-base font-semibold">Create Product</h2>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Title"
            className="h-11 rounded-xl border border-foreground/15 px-3 text-sm"
            required
          />
          <input
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="Handle"
            className="h-11 rounded-xl border border-foreground/15 px-3 text-sm"
            required
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="h-11 rounded-xl border border-foreground/15 px-3 text-sm"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={load}
              disabled={!canRun || isBusy}
              className="h-10 rounded-full border border-foreground/15 px-4 text-sm disabled:opacity-50"
            >
              Load
            </button>
            <button
              type="submit"
              disabled={!canRun || isBusy}
              className="h-10 rounded-full bg-foreground px-4 text-sm text-background disabled:opacity-50"
            >
              Create
            </button>
          </div>
        </form>
      </div>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      {message ? <p className="mt-4 text-sm text-green-700">{message}</p> : null}

      <div className="mt-6 overflow-hidden rounded-2xl border border-foreground/10">
        <table className="w-full text-sm">
          <thead className="bg-foreground/5 text-left text-foreground/75">
            <tr>
              <th className="px-4 py-3 font-medium">Title</th>
              <th className="px-4 py-3 font-medium">Handle</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-foreground/10">
                <td className="px-4 py-3">{p.title || "-"}</td>
                <td className="px-4 py-3">{p.handle || "-"}</td>
                <td className="px-4 py-3">{p.status || "-"}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => updateProduct(p)}
                      disabled={!canRun || isBusy}
                      className="h-8 rounded-full border border-foreground/15 px-3 text-xs disabled:opacity-50"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => deleteProduct(p)}
                      disabled={!canRun || isBusy}
                      className="h-8 rounded-full border border-red-300 px-3 text-xs text-red-700 disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 ? (
              <tr>
                <td className="px-4 py-5 text-foreground/70" colSpan={4}>
                  No products loaded yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

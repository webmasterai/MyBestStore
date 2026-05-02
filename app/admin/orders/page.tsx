"use client";

import { useMemo, useState } from "react";

type Order = {
  id: string;
  display_id?: number;
  status?: string;
  payment_status?: string;
  fulfillment_status?: string;
  total?: number;
  currency_code?: string;
  email?: string;
};

function money(total?: number, currency?: string) {
  const c = (currency || "PKR").toUpperCase();
  return new Intl.NumberFormat("en-US", { style: "currency", currency: c }).format(
    (total || 0) / 100
  );
}

export default function AdminOrdersPage() {
  const [secret, setSecret] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const canRun = useMemo(() => Boolean(secret.trim()), [secret]);

  async function load() {
    if (!canRun) return;
    setIsBusy(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/orders", {
        headers: { "x-admin-secret": secret },
      });
      const payload = (await res.json()) as { orders?: Order[]; error?: string };
      if (!res.ok) {
        setError(payload.error || "Unable to load orders");
        return;
      }
      setOrders(payload.orders || []);
      setMessage("Orders loaded.");
    } catch {
      setError("Network error while loading orders.");
    } finally {
      setIsBusy(false);
    }
  }

  async function updateStatus(order: Order, nextStatus: string) {
    if (!canRun) return;

    const confirmed = window.confirm(
      `Mark order #${order.display_id || order.id.slice(0, 8)} as ${nextStatus}?`
    );
    if (!confirmed) return;

    setIsBusy(true);
    setError(null);
    setMessage(null);

    try {
      const res = await fetch(`/api/admin/orders/${order.id}`, {
        method: "PATCH",
        headers: {
          "content-type": "application/json",
          "x-admin-secret": secret,
        },
        body: JSON.stringify({ status: nextStatus }),
      });
      const payload = (await res.json()) as { error?: string };
      if (!res.ok) {
        setError(payload.error || "Failed to update order");
        return;
      }

      setMessage("Order updated.");
      await load();
    } catch {
      setError("Network error while updating order.");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <h1 className="text-2xl font-semibold" style={{ fontFamily: "var(--font-heading)" }}>
        Admin Orders
      </h1>
      <p className="mt-2 text-sm text-foreground/70">
        Order management with explicit yes/no confirmations before updates.
      </p>

      <div className="mt-6 rounded-2xl border border-foreground/10 bg-background p-5">
        <label className="mb-1 block text-sm text-foreground/80">Admin secret</label>
        <div className="flex gap-3">
          <input
            type="password"
            value={secret}
            onChange={(e) => setSecret(e.target.value)}
            className="h-11 flex-1 rounded-xl border border-foreground/15 px-3 text-sm"
          />
          <button
            type="button"
            onClick={load}
            disabled={!canRun || isBusy}
            className="h-11 rounded-full bg-foreground px-4 text-sm text-background disabled:opacity-50"
          >
            Load Orders
          </button>
        </div>
      </div>

      {error ? <p className="mt-4 text-sm text-red-600">{error}</p> : null}
      {message ? <p className="mt-4 text-sm text-green-700">{message}</p> : null}

      <div className="mt-6 overflow-hidden rounded-2xl border border-foreground/10">
        <table className="w-full text-sm">
          <thead className="bg-foreground/5 text-left text-foreground/75">
            <tr>
              <th className="px-4 py-3 font-medium">Order</th>
              <th className="px-4 py-3 font-medium">Customer</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-t border-foreground/10">
                <td className="px-4 py-3">#{order.display_id || order.id.slice(0, 8)}</td>
                <td className="px-4 py-3">{order.email || "-"}</td>
                <td className="px-4 py-3">
                  {order.status || order.fulfillment_status || order.payment_status || "-"}
                </td>
                <td className="px-4 py-3">{money(order.total, order.currency_code)}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => updateStatus(order, "completed")}
                      disabled={!canRun || isBusy}
                      className="h-8 rounded-full border border-foreground/15 px-3 text-xs disabled:opacity-50"
                    >
                      Mark Completed
                    </button>
                    <button
                      type="button"
                      onClick={() => updateStatus(order, "canceled")}
                      disabled={!canRun || isBusy}
                      className="h-8 rounded-full border border-red-300 px-3 text-xs text-red-700 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {orders.length === 0 ? (
              <tr>
                <td className="px-4 py-5 text-foreground/70" colSpan={5}>
                  No orders loaded yet.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}

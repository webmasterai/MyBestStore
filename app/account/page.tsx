"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatPKR } from "@/lib/currency";

type Customer = {
  email?: string;
  first_name?: string;
  last_name?: string;
};

type Order = {
  id: string;
  display_id?: number;
  status?: string;
  payment_status?: string;
  fulfillment_status?: string;
  total?: number | string;
  subtotal?: number | string;
  item_total?: number | string;
  item_subtotal?: number | string;
  shipping_total?: number | string;
  shipping_subtotal?: number | string;
  currency_code?: string;
  created_at?: string;
};

function toNumber(value: unknown) {
  const n = typeof value === "string" ? Number(value) : typeof value === "number" ? value : NaN;
  return Number.isFinite(n) ? n : 0;
}

function money(value?: number | string, currency?: string) {
  const isPKR = currency?.toUpperCase() === "PKR";
  const numeric = toNumber(value);
  const amount = isPKR ? String(numeric) : String(numeric / 100);

  if (isPKR || !currency) {
    return formatPKR(amount);
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currency.toUpperCase(),
  }).format(Number(amount));
}

function getOrderTotalMinor(order: Order) {
  const total = toNumber(order.total);
  const subtotal = toNumber(order.subtotal);
  const shippingTotal = toNumber(order.shipping_total ?? order.shipping_subtotal);

  // Medusa v2: 'total' is the grand total including shipping and taxes.
  if (total) return total;

  // Fallback if 'total' is missing for some reason
  if (subtotal) {
    return subtotal + shippingTotal;
  }

  // Last-resort: compute from item totals
  const itemTotal = toNumber(order.item_total ?? order.item_subtotal);
  return itemTotal + shippingTotal;
}

export default function AccountPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);

  useEffect(() => {
    let mounted = true;

    async function load() {
      setIsLoading(true);
      try {
        const [meRes, ordersRes] = await Promise.all([
          fetch("/api/auth/me", { cache: "no-store" }),
          fetch("/api/auth/orders", { cache: "no-store" }),
        ]);

        if (!mounted) return;

        if (!meRes.ok) {
          setCustomer(null);
          setOrders([]);
          return;
        }

        const mePayload = (await meRes.json()) as {
          customer?: Customer;
        };
        const ordersPayload = (await ordersRes.json().catch(() => ({}))) as {
          orders?: Order[];
        };

        setCustomer(mePayload.customer || null);
        setOrders(ordersPayload.orders || []);
      } finally {
        if (mounted) setIsLoading(false);
      }
    }

    load();
    return () => {
      mounted = false;
    };
  }, []);

  const logout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    window.location.href = "/login";
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-20 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-10 h-10 border-4 border-brand-primary/20 border-t-brand-primary rounded-full animate-spin" />
        <p className="mt-4 text-sm text-slate-500 font-bold uppercase tracking-widest">Loading Account...</p>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <div className="h-20 w-20 rounded-3xl bg-slate-50 border border-slate-100 grid place-items-center mx-auto mb-8 text-slate-300">
           <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-10 h-10"><path d="M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM20 21a8 8 0 0 0-16 0" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Access Restricted</h1>
        <p className="mt-4 text-slate-500 font-medium leading-relaxed">Please sign in to view your orders, shipping details, and account preferences.</p>
        <Link
          href="/login?redirect=/account"
          className="mt-10 h-14 w-full inline-flex items-center justify-center rounded-xl bg-slate-900 text-white font-black uppercase tracking-widest text-sm shadow-xl shadow-slate-900/20 hover:bg-brand-primary hover:shadow-brand-primary/30 transition-all"
        >
          Go to Sign In
        </Link>
      </div>
    );
  }

  const fullName = [customer.first_name, customer.last_name].filter(Boolean).join(" ");

  return (
    <div className="mx-auto max-w-6xl px-4 py-16 md:py-24">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 pb-12 border-b border-slate-100">
        <div>
          <div className="inline-flex items-center gap-2 rounded-full bg-brand-primary/10 px-4 py-1.5 text-[10px] font-black text-brand-primary uppercase tracking-[0.2em] mb-4">
             Customer Account
          </div>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter">
            {fullName || "Welcome back"}
          </h1>
          <p className="mt-4 text-slate-500 font-medium flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-4 h-4"><path d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            {customer.email}
          </p>
        </div>

        <button
          type="button"
          onClick={logout}
          className="h-12 px-8 rounded-xl border-2 border-slate-100 bg-white text-slate-900 font-black uppercase tracking-widest text-xs hover:bg-slate-50 hover:border-slate-200 transition-all active:scale-[0.98]"
        >
          Sign Out
        </button>
      </div>

      <section className="mt-16">
        <div className="flex items-baseline justify-between mb-8">
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Order History</h2>
          <span className="text-sm font-bold text-slate-400 uppercase tracking-widest">{orders.length} {orders.length === 1 ? 'Order' : 'Orders'}</span>
        </div>

        {orders.length === 0 ? (
          <div className="rounded-3xl border-2 border-dashed border-slate-100 p-20 text-center">
            <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">No orders found in your history</p>
            <Link href="/search" className="mt-6 inline-flex text-brand-primary font-black uppercase tracking-widest text-xs hover:underline">Start your first order</Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl shadow-slate-200/20">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-100">
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Order ID</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Placed On</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Fulfillment</th>
                    <th className="px-6 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Payment</th>
                    <th className="px-6 py-5 text-right text-[10px] font-black text-slate-400 uppercase tracking-widest">Total Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {orders.map((order) => (
                    <tr key={order.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="px-6 py-5 font-black text-slate-900">#{order.display_id || order.id.slice(0, 8)}</td>
                      <td className="px-6 py-5 text-sm text-slate-600 font-medium">
                        {order.created_at
                          ? new Date(order.created_at).toLocaleDateString("en-US", { month: 'short', day: 'numeric', year: 'numeric' })
                          : "-"}
                      </td>
                      <td className="px-6 py-5">
                         <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-600 uppercase tracking-tighter">
                            {order.fulfillment_status || "Processing"}
                         </span>
                      </td>
                      <td className="px-6 py-5">
                         <span className="inline-flex items-center rounded-lg bg-emerald-50 px-2.5 py-1 text-[10px] font-black text-emerald-600 uppercase tracking-tighter">
                            {order.payment_status || "Paid"}
                         </span>
                      </td>
                      <td className="px-6 py-5 text-right font-black text-slate-900">
                        {money(getOrderTotalMinor(order), order.currency_code)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>
    </div>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/context/CartContext";
import { formatPKR } from "@/lib/currency";
import { 
  medusaUpdateCart, 
  medusaGetShippingMethods, 
  medusaGetCart,
  medusaAddShippingMethod,
  medusaCompleteCart,
  medusaGetPaymentProviders,
  medusaInitializePayment
} from "@/lib/commerce/medusa-client";

function dedupeShippingOptions(options: any[]) {
  const seen = new Map<string, any>();

  for (const option of options || []) {
    const key = [
      option?.service_zone_id || option?.service_zone?.id || "",
      option?.shipping_profile_id || "",
      option?.provider_id || "",
      option?.amount ?? option?.calculated_price?.calculated_amount ?? 0,
    ].join("|");

    if (!seen.has(key)) {
      seen.set(key, option);
    }
  }

  return Array.from(seen.values());
}

export default function CheckoutPage() {
  const router = useRouter();
  const { cart, totalQuantity, isLoading: isCartLoading } = useCart();
  const [step, setStep] = useState(1); // 1: Shipping, 2: Payment
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Shipping form state
  const [formData, setFormData] = useState({
    email: "",
    first_name: "",
    last_name: "",
    address_1: "",
    city: "",
    country_code: "pk",
    phone: "",
  });

  const [shippingOptions, setShippingOptions] = useState<any[]>([]);
  const [selectedShipping, setSelectedShipping] = useState<string>("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const goToPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!cart?.id) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // 1. Update cart with email and shipping address
      await medusaUpdateCart(cart.id, {
        email: formData.email,
        shipping_address: {
          first_name: formData.first_name,
          last_name: formData.last_name,
          address_1: formData.address_1,
          city: formData.city,
          country_code: formData.country_code,
          phone: formData.phone,
        }
      });

      // 2. Fetch shipping options
      const { shipping_options } = await medusaGetShippingMethods(cart.id);
      const uniqueShippingOptions = dedupeShippingOptions(shipping_options || []);
      setShippingOptions(uniqueShippingOptions);
      
      // Auto-select first option if available
      if (uniqueShippingOptions.length > 0) {
        setSelectedShipping(uniqueShippingOptions[0].id);
      }

      setStep(2);
    } catch (err: any) {
      setError(err.message || "Failed to update shipping information");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCompleteOrder = async () => {
    if (!cart?.id || !selectedShipping) return;
    
    setIsSubmitting(true);
    setError(null);
    
    try {
      // 1. Add shipping method
      await medusaAddShippingMethod(cart.id, selectedShipping);

      // Re-fetch cart and verify shipping method attached
      const { cart: updatedCart } = await medusaGetCart(cart.id);
      const shippingMethods = (updatedCart as any).shipping_methods || [];
      const attached = shippingMethods.some((m: any) =>
        m.option_id === selectedShipping ||
        m.id === selectedShipping ||
        m.shipping_option_id === selectedShipping ||
        m.shipping_option?.id === selectedShipping ||
        m.shipping_option?.shipping_option_id === selectedShipping
      );

      if (!attached) {
        console.error("[Checkout] attach check failed", { updatedCart });
        throw new Error("Failed to attach selected shipping method to cart. See console for cart debug.");
      }

      // 2. Medusa v2: Fetch and Initialize COD Payment
      const regionId = cart.region?.id;
      if (!regionId) throw new Error("Cart region not found");

      const { payment_providers } = await medusaGetPaymentProviders(regionId);
      
      // Look for a manual or COD provider (v2 usually has pp_system_default or manual)
      const codProvider = payment_providers?.find(p => p.id === "manual" || p.id === "pp_system_default") || payment_providers?.[0];
      
      if (!codProvider) {
        throw new Error("No payment providers available for this region. Please enable manual payment in Medusa Admin.");
      }

      // Initialize session for this provider
      await medusaInitializePayment(cart.id, codProvider.id);
      
      // 3. Complete cart
      const response = await medusaCompleteCart(cart.id);
      
      if (response.type === "order") {
        window.localStorage.removeItem("mybeststore_cart_id");
        router.push("/account");
      } else {
        throw new Error("Order creation failed. Check Medusa Admin for region/payment status.");
      }
    } catch (err: any) {
      console.error("[Checkout Error]:", err);
      setError(err.message || "Failed to complete order.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isCartLoading && !cart) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-primary"></div>
      </div>
    );
  }

  if (!cart || cart.lines.nodes.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-32 text-center">
        <h1 className="text-4xl font-black text-slate-900 tracking-tight">Your cart is empty</h1>
        <p className="mt-4 text-slate-500 font-medium">Add some products to your cart before checking out.</p>
        <Link href="/" className="mt-8 inline-flex h-14 px-8 items-center justify-center rounded-xl bg-slate-900 text-white font-black uppercase tracking-widest text-sm shadow-xl hover:bg-brand-primary transition-all">
          Go Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="mx-auto max-w-7xl px-4 py-12 md:py-20">
        <div className="grid lg:grid-cols-12 gap-12">
          
          {/* Main Checkout Flow */}
          <div className="lg:col-span-7 space-y-8">
            
            {/* Steps Indicator */}
            <div className="flex items-center gap-4 mb-10">
              <div className={`h-10 w-10 rounded-full flex items-center justify-center font-black text-sm ${step >= 1 ? 'bg-brand-primary text-white' : 'bg-slate-200 text-slate-400'}`}>1</div>
              <div className={`h-0.5 flex-1 ${step >= 2 ? 'bg-brand-primary' : 'bg-slate-200'}`} />
              <div className={`h-10 w-10 rounded-full flex items-center justify-center font-black text-sm ${step >= 2 ? 'bg-brand-primary text-white' : 'bg-slate-200 text-slate-400'}`}>2</div>
            </div>

            {step === 1 && (
              <div className="fx-fade-up">
                <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-8">Shipping Details</h2>
                <form onSubmit={goToPayment} className="space-y-6">
                  <div className="grid gap-6">
                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Email Address</label>
                      <input 
                        type="email" name="email" required value={formData.email} onChange={handleInputChange}
                        className="h-14 w-full rounded-xl border border-slate-200 bg-white px-5 text-sm outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all"
                        placeholder="you@example.com"
                      />
                    </div>
                    
                    <div className="grid sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">First Name</label>
                        <input 
                          type="text" name="first_name" required value={formData.first_name} onChange={handleInputChange}
                          className="h-14 w-full rounded-xl border border-slate-200 bg-white px-5 text-sm outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Last Name</label>
                        <input 
                          type="text" name="last_name" required value={formData.last_name} onChange={handleInputChange}
                          className="h-14 w-full rounded-xl border border-slate-200 bg-white px-5 text-sm outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Delivery Address</label>
                      <input 
                        type="text" name="address_1" required value={formData.address_1} onChange={handleInputChange}
                        className="h-14 w-full rounded-xl border border-slate-200 bg-white px-5 text-sm outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all"
                        placeholder="Street address, apartment, etc."
                      />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6">
                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">City</label>
                        <input 
                          type="text" name="city" required value={formData.city} onChange={handleInputChange}
                          className="h-14 w-full rounded-xl border border-slate-200 bg-white px-5 text-sm outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-black text-slate-400 uppercase tracking-widest mb-2">Phone Number</label>
                        <input 
                          type="tel" name="phone" required value={formData.phone} onChange={handleInputChange}
                          className="h-14 w-full rounded-xl border border-slate-200 bg-white px-5 text-sm outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all"
                          placeholder="03xx xxxxxxx"
                        />
                      </div>
                    </div>
                  </div>

                  {error && <div className="text-red-600 text-sm font-bold bg-red-50 p-4 rounded-xl border border-red-100">{error}</div>}

                  <button 
                    type="submit" disabled={isSubmitting}
                    className="h-16 w-full rounded-xl bg-slate-900 text-white font-black uppercase tracking-widest text-sm shadow-2xl hover:bg-brand-primary transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {isSubmitting ? "Saving Details..." : "Continue to Payment"}
                  </button>
                </form>
              </div>
            )}

            {step === 2 && (
              <div className="fx-fade-up space-y-8">
                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-6">Shipping Method</h2>
                  <div className="space-y-4">
                    {dedupeShippingOptions(shippingOptions).length > 0 ? dedupeShippingOptions(shippingOptions).map((option) => (
                      <label key={option.id} className={`flex items-center justify-between p-6 rounded-2xl border-2 transition-all cursor-pointer ${selectedShipping === option.id ? 'border-brand-primary bg-white shadow-xl' : 'border-slate-200 bg-white/50'}`}>
                        <div className="flex items-center gap-4">
                          <input 
                            type="radio" name="shipping" value={option.id} 
                            checked={selectedShipping === option.id}
                            onChange={() => setSelectedShipping(option.id)}
                            className="h-5 w-5 text-brand-primary border-slate-300 focus:ring-brand-primary"
                          />
                          <div>
                            <div className="font-black text-slate-900">{option.name}</div>
                            <div className="text-xs text-slate-500 font-bold uppercase tracking-tighter">Fast Delivery</div>
                          </div>
                        </div>
                        <div className="font-black text-slate-900">{formatPKR(option.amount ?? 0)}</div>
                      </label>
                    )) : (
                      <div className="p-6 rounded-2xl bg-amber-50 border border-amber-200 text-amber-800 text-sm font-bold">
                        No shipping methods available for this address. Please check your Medusa Admin settings.
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-6">Payment</h2>
                  <div className="p-6 rounded-2xl border-2 border-brand-primary bg-white shadow-xl">
                    <div className="flex items-center gap-4">
                      <div className="h-6 w-6 rounded-full bg-brand-primary flex items-center justify-center">
                        <div className="h-2 w-2 rounded-full bg-white" />
                      </div>
                      <div>
                        <div className="font-black text-slate-900">Cash on Delivery (COD)</div>
                        <div className="text-xs text-slate-500 font-bold uppercase tracking-tighter">Pay when you receive your order</div>
                      </div>
                    </div>
                  </div>
                </div>

                {error && <div className="text-red-600 text-sm font-bold bg-red-50 p-4 rounded-xl border border-red-100">{error}</div>}

                <div className="flex gap-4">
                  <button 
                    onClick={() => setStep(1)}
                    className="h-16 px-8 rounded-xl border-2 border-slate-200 text-slate-900 font-black uppercase tracking-widest text-xs hover:bg-slate-100 transition-all"
                  >
                    Back
                  </button>
                  <button 
                    onClick={handleCompleteOrder}
                    disabled={isSubmitting || !selectedShipping}
                    className="h-16 flex-1 rounded-xl bg-slate-900 text-white font-black uppercase tracking-widest text-sm shadow-2xl hover:bg-emerald-600 transition-all active:scale-[0.98] disabled:opacity-50"
                  >
                    {isSubmitting ? "Processing..." : "Place Order"}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-5">
            <div className="sticky top-32 rounded-3xl border border-slate-200 bg-white p-8 shadow-2xl shadow-slate-200/50">
              <h3 className="text-xl font-black text-slate-900 tracking-tight mb-6">Order Summary</h3>
              
              <div className="space-y-6 mb-8 max-h-100 overflow-auto pr-2">
                {cart.lines.nodes.map((line) => (
                  <div key={line.id} className="flex gap-4">
                    <div className="h-20 w-20 shrink-0 rounded-xl bg-slate-50 border border-slate-100 overflow-hidden">
                      {line.merchandise.product.featuredImage?.url && (
                        <Image 
                          src={line.merchandise.product.featuredImage.url} 
                          alt={line.merchandise.product.title} 
                          width={80} height={80} 
                          className="h-full w-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="text-sm font-black text-slate-900 line-clamp-1">{line.merchandise.product.title}</div>
                      <div className="text-xs text-slate-500 font-bold mt-1">Qty: {line.quantity}</div>
                      <div className="text-sm font-black text-slate-900 mt-1">{formatPKR(line.merchandise.price.amount)}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-4 pt-6 border-t border-slate-100">
                <div className="flex justify-between text-sm font-bold text-slate-500">
                  <span>Subtotal</span>
                  <span className="text-slate-900">{formatPKR(cart.cost?.subtotalAmount.amount || 0)}</span>
                </div>
                <div className="flex justify-between text-sm font-bold text-slate-500">
                  <span>Shipping</span>
                  <span className="text-slate-900">
                    {selectedShipping 
                      ? formatPKR(dedupeShippingOptions(shippingOptions).find(o => o.id === selectedShipping)?.amount || 0)
                      : "Calculated next"}
                  </span>
                </div>
                <div className="flex justify-between pt-4 border-t border-slate-100">
                  <span className="text-lg font-black text-slate-900">Total</span>
                  <span className="text-2xl font-black text-slate-900">
                    {formatPKR(
                      Number(cart.cost?.totalAmount.amount || 0) +
                      (dedupeShippingOptions(shippingOptions).find(o => o.id === selectedShipping)?.amount || 0)
                    )}
                  </span>
                </div>
              </div>
              
              <div className="mt-8 p-4 rounded-xl bg-slate-50 flex items-center gap-3">
                 <div className="h-10 w-10 rounded-full bg-white grid place-items-center shadow-sm">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="h-5 w-5 text-emerald-500"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                 </div>
                 <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-tight">
                    Secure transaction<br/>Guaranteed by Medusa
                 </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

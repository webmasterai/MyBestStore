"use client";

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  medusaAddLineItem,
  medusaCreateCart,
  medusaGetCart,
  medusaRemoveLineItem,
  medusaUpdateLineItem,
  type MedusaCart,
} from "@/lib/commerce/medusa-client";

type Money = {
  amount: string;
  currencyCode: string;
};

export type CartLine = {
  id: string;
  quantity: number;
  merchandise: {
    id: string;
    title: string;
    product: {
      handle: string;
      title: string;
      featuredImage?: {
        url: string;
        altText: string | null;
        width: number | null;
        height: number | null;
      } | null;
    };
    price: Money;
  };
};

export type Cart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  region?: {
    id: string;
    name: string;
    currencyCode: string;
  };
  cost?: {
    subtotalAmount: Money;
    totalAmount: Money;
  } | null;
  lines: {
    nodes: CartLine[];
  };
};

type CartContextValue = {
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;

  isLoading: boolean;
  cart: Cart | null;
  totalQuantity: number;

  addVariant: (variantId: string, quantity?: number) => Promise<void>;
  setLineQuantity: (lineId: string, quantity: number) => Promise<void>;
  removeLine: (lineId: string) => Promise<void>;
  checkout: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const CART_ID_STORAGE_KEY = "mybeststore_cart_id";

function mapMedusaCart(cart: any | null): Cart | null {
  if (!cart) return null;

  const currency = (cart.currency_code || "pkr").toUpperCase();
  const isPKR = currency === "PKR";
  
  // PKR has 0 decimals in this project, so we don't divide by 100.
  // Other currencies (USD, EUR) have 2 decimals.
  const divisor = isPKR ? 1 : 100;

  const lines = (cart.items || []).map((line: any) => ({
    id: line.id,
    quantity: line.quantity,
    merchandise: {
      id: line.variant?.id || "",
      title: line.variant?.title || "Default",
      product: {
        handle: line.variant?.product?.handle || "",
        title: line.variant?.product?.title || "Product",
        featuredImage: line.variant?.product?.thumbnail
          ? {
              url: line.variant.product.thumbnail,
              altText: line.variant?.product?.title || null,
              width: null,
              height: null,
            }
          : null,
      },
      price: {
        amount: String((line.unit_price || 0) / divisor),
        currencyCode: currency,
      },
    },
  }));

  return {
    id: cart.id,
    checkoutUrl: cart.checkout_url || "",
    totalQuantity: lines.reduce((sum: number, l: any) => sum + l.quantity, 0),
    region: cart.region ? {
      id: cart.region.id,
      name: cart.region.name,
      currencyCode: cart.region.currency_code,
    } : undefined,
    cost: {
      subtotalAmount: {
        amount: String((cart.subtotal || 0) / divisor),
        currencyCode: currency,
      },
      totalAmount: {
        amount: String((cart.total || 0) / divisor),
        currencyCode: currency,
      },
    },
    lines: {
      nodes: lines,
    },
  };
}

async function fetchCart(cartId: string) {
  try {
    const data = await medusaGetCart(cartId);
    return mapMedusaCart(data.cart);
  } catch (err) {
    console.error("[Cart] fetchCart error:", err);
    throw err;
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [cart, setCart] = useState<Cart | null>(null);
  const [cartId, setCartId] = useState<string | null>(null);

  const totalQuantity = cart?.totalQuantity ?? 0;

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);
  const toggleCart = useCallback(() => setIsOpen((v) => !v), []);

  // Initial load
  useEffect(() => {
    const savedCartId = window.localStorage.getItem(CART_ID_STORAGE_KEY);
    if (savedCartId) {
      setCartId(savedCartId);
      setIsLoading(true);
    }
  }, []);

  useEffect(() => {
    if (!cartId) return;

    fetchCart(cartId)
      .then((c) => {
        if (!c) {
          window.localStorage.removeItem(CART_ID_STORAGE_KEY);
          setCart(null);
          setCartId(null);
          return;
        }
        setCart(c);
      })
      .catch(() => {
        // If the cart fetch fails (expired ID etc), clear it.
        window.localStorage.removeItem(CART_ID_STORAGE_KEY);
        setCart(null);
        setCartId(null);
      })
      .finally(() => setIsLoading(false));
  }, [cartId]);

  const addVariant = useCallback(
    async (variantId: string, quantity = 1) => {
      setIsLoading(true);
      try {
        const existingCartId = cart?.id || cartId;

        if (!existingCartId) {
          console.log("[Cart] Creating new cart for variant:", variantId);
          const created = await medusaCreateCart();
          const newId = created.cart?.id;
          if (!newId) {
            throw new Error("Failed to create cart - no cart ID returned");
          }

          console.log("[Cart] Adding line item to new cart:", newId);
          await medusaAddLineItem(newId, variantId, quantity);

          window.localStorage.setItem(CART_ID_STORAGE_KEY, newId);
          setCartId(newId);
          const fresh = await fetchCart(newId);
          setCart(fresh);
          setIsOpen(true);
          return;
        }

        console.log("[Cart] Adding line item to existing cart:", existingCartId);
        await medusaAddLineItem(existingCartId, variantId, quantity);

        const fresh = await fetchCart(existingCartId);
        setCart(fresh);
        setIsOpen(true);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to add item to cart";
        console.error("[Cart] addVariant error:", err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [cart, cartId]
  );

  const setLineQuantity = useCallback(
    async (lineId: string, quantity: number) => {
      const existingCartId = cart?.id || cartId;
      if (!existingCartId) return;
      if (quantity < 1) return;

      setIsLoading(true);
      try {
        console.log("[Cart] Updating line quantity:", { cartId: existingCartId, lineId, quantity });
        await medusaUpdateLineItem(existingCartId, lineId, quantity);

        const fresh = await fetchCart(existingCartId);
        setCart(fresh);
      } catch (err) {
        console.error("[Cart] setLineQuantity error:", err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [cart, cartId]
  );

  const removeLine = useCallback(
    async (lineId: string) => {
      const existingCartId = cart?.id || cartId;
      if (!existingCartId) return;

      setIsLoading(true);
      try {
        console.log("[Cart] Removing line item:", { cartId: existingCartId, lineId });
        await medusaRemoveLineItem(existingCartId, lineId);

        const fresh = await fetchCart(existingCartId);
        setCart(fresh);
      } catch (err) {
        console.error("[Cart] removeLine error:", err);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    [cart, cartId]
  );

  const checkout = useCallback(() => {
    if (cart?.checkoutUrl) {
      window.location.href = cart.checkoutUrl;
      return;
    }

    window.location.href = "/checkout";
  }, [cart]);

  const value = useMemo<CartContextValue>(
    () => ({
      isOpen,
      openCart,
      closeCart,
      toggleCart,
      isLoading,
      cart,
      totalQuantity,
      addVariant,
      setLineQuantity,
      removeLine,
      checkout,
    }),
    [
      addVariant,
      cart,
      checkout,
      closeCart,
      isLoading,
      isOpen,
      openCart,
      removeLine,
      setLineQuantity,
      toggleCart,
      totalQuantity,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within CartProvider");
  }
  return ctx;
}

type MedusaClientConfig = {
  backendUrl: string;
  publishableKey: string;
  regionId?: string;
};

function getClientConfig(): MedusaClientConfig {
  const backendUrl = (process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "").replace(/\/$/, "");
  const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY || "";
  const regionId = process.env.NEXT_PUBLIC_MEDUSA_REGION_ID || undefined;

  if (!backendUrl || !publishableKey) {
    throw new Error("Medusa client env vars are missing");
  }

  return { backendUrl, publishableKey, regionId };
}

async function medusaStoreFetch<T>(
  path: string,
  init: RequestInit = {},
  authToken?: string
): Promise<T> {
  const { backendUrl, publishableKey } = getClientConfig();

  const headers: Record<string, string> = {
    "content-type": "application/json",
    "x-publishable-api-key": publishableKey,
  };

  const extraHeaders = new Headers(init.headers || {});
  extraHeaders.forEach((value, key) => {
    headers[key] = value;
  });

  if (authToken) {
    headers.authorization = `Bearer ${authToken}`;
  }

  const res = await fetch(`${backendUrl}${path}`, {
    ...init,
    headers,
    cache: init.cache || "no-store",
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    const errorMsg = `Medusa store request failed: ${res.status} ${res.statusText}${text ? ` - ${text}` : ""}`;
    console.error(errorMsg, { path, status: res.status, body: text });
    throw new Error(errorMsg);
  }

  if (res.status === 204) return null as T;
  return (await res.json()) as T;
}

export type MedusaCartLine = {
  id: string;
  quantity: number;
  unit_price?: number;
  variant?: {
    id: string;
    title?: string;
    product?: {
      handle?: string;
      title?: string;
      thumbnail?: string | null;
    };
  };
};

export type MedusaCart = {
  id: string;
  items?: MedusaCartLine[];
  total?: number;
  subtotal?: number;
  currency_code?: string;
  checkout_url?: string;
};

export async function medusaCreateCart() {
  const { regionId } = getClientConfig();
  const body: Record<string, string> = {};
  
  if (regionId) {
    body.region_id = regionId;
  }

  try {
    return await medusaStoreFetch<{ cart: MedusaCart }>("/store/carts", {
      method: "POST",
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch (error) {
    console.error("[Cart] Create cart failed:", error);
    throw error;
  }
}

export async function medusaGetCart(cartId: string) {
  try {
    return await medusaStoreFetch<{ cart: MedusaCart }>(`/store/carts/${cartId}`, {
      cache: "no-store",
    });
  } catch (error) {
    console.error(`[Cart] Get cart failed for ${cartId}:`, error);
    throw error;
  }
}

export async function medusaAddLineItem(cartId: string, variantId: string, quantity: number) {
  try {
    const body = { variant_id: variantId, quantity };
    console.log(`[Cart] Adding to cart ${cartId}:`, body);
    
    return await medusaStoreFetch<{ cart: MedusaCart }>(`/store/carts/${cartId}/line-items`, {
      method: "POST",
      body: JSON.stringify(body),
      cache: "no-store",
    });
  } catch (error) {
    console.error(`[Cart] Add line item failed:`, error);
    throw error;
  }
}

export async function medusaUpdateLineItem(cartId: string, lineId: string, quantity: number) {
  try {
    return await medusaStoreFetch<{ cart: MedusaCart }>(`/store/carts/${cartId}/line-items/${lineId}`, {
      method: "POST",
      body: JSON.stringify({ quantity }),
      cache: "no-store",
    });
  } catch (error) {
    console.error(`[Cart] Update line item failed:`, error);
    throw error;
  }
}

export async function medusaRemoveLineItem(cartId: string, lineId: string) {
  return medusaStoreFetch<{ cart: MedusaCart }>(`/store/carts/${cartId}/line-items/${lineId}`, {
    method: "DELETE",
  });
}

export async function medusaUpdateCart(cartId: string, data: any) {
  return medusaStoreFetch<{ cart: MedusaCart }>(`/store/carts/${cartId}`, {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function medusaGetShippingMethods(cartId: string) {
  return medusaStoreFetch<{ shipping_options: any[] }>(`/store/shipping-options?cart_id=${cartId}`);
}

export async function medusaAddShippingMethod(cartId: string, optionId: string) {
  return medusaStoreFetch<{ cart: MedusaCart }>(`/store/carts/${cartId}/shipping-methods`, {
    method: "POST",
    body: JSON.stringify({ option_id: optionId }),
  });
}

export async function medusaCreatePaymentSessions(cartId: string) {
  return medusaStoreFetch<{ payment_collection: any }>(`/store/carts/${cartId}/payment-collections`, {
    method: "POST",
  });
}

export async function medusaInitializePayment(cartId: string, providerId: string) {
  // 1. Create/Get payment collection for the cart
  // Medusa v2: POST /store/payment-collections
  return medusaStoreFetch<any>(`/store/payment-collections`, {
    method: "POST",
    body: JSON.stringify({ cart_id: cartId }),
  }).then(async (res) => {
    // res is usually { payment_collection: { id: ... } }
    const paymentCollectionId = res.payment_collection?.id;
    if (!paymentCollectionId) {
      console.error("[Payment] No collection ID in response:", res);
      throw new Error("Failed to create payment collection");
    }
    
    // 2. Initialize payment session for the provider
    // Medusa v2: POST /store/payment-collections/:id/payment-sessions
    return medusaStoreFetch<any>(`/store/payment-collections/${paymentCollectionId}/payment-sessions`, {
      method: "POST",
      body: JSON.stringify({ provider_id: providerId }),
    });
  });
}

export async function medusaCompleteCart(cartId: string) {
  return medusaStoreFetch<{ type: string; data: any }>(`/store/carts/${cartId}/complete`, {
    method: "POST",
  });
}

// Medusa v2 specific - list payment providers
export async function medusaGetPaymentProviders(regionId: string) {
  return medusaStoreFetch<{ payment_providers: any[] }>(`/store/payment-providers?region_id=${regionId}`);
}

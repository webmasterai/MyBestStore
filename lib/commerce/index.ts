import {
  medusaGetCategories,
  medusaGetCollectionByHandle,
  medusaGetHomepageContent,
  medusaGetHomeProducts,
  medusaGetProductByHandle,
  medusaSearchProducts,
} from "@/lib/commerce/medusa";
import type {
  CommerceCategory,
  CommerceCollectionDetail,
  HomepageContent,
  CommerceProductCard,
  CommerceProductDetail,
  PaginatedProducts,
} from "@/lib/commerce/types";

export type CommerceProvider = "medusa";

export function getCommerceProvider(): CommerceProvider {
  return "medusa";
}

export function isCommerceConfigured() {
  const backendUrl = process.env.NEXT_PUBLIC_MEDUSA_BACKEND_URL;
  const publishableKey = process.env.NEXT_PUBLIC_MEDUSA_PUBLISHABLE_KEY;
  if (!backendUrl || !publishableKey) return false;

  const looksLikePlaceholder = (value: string) =>
    /^(your_|paste_|replace_|example)/i.test(value) ||
    value.includes("<") ||
    value.includes(">") ||
    /medusa_url_here|publishable_key_here/i.test(value);

  if (looksLikePlaceholder(backendUrl) || looksLikePlaceholder(publishableKey)) {
    return false;
  }

  return true;
}

export async function getHomeProducts(
  first = 10,
  offset = 0
): Promise<PaginatedProducts> {
  return medusaGetHomeProducts(first, offset);
}

export async function getCategories(first = 100): Promise<CommerceCategory[]> {
  return medusaGetCategories(first);
}

export async function getProductByHandle(handle: string): Promise<CommerceProductDetail | null> {
  return medusaGetProductByHandle(handle);
}

export async function getCollectionByHandle(
  handle: string,
  first = 24,
  offset = 0
): Promise<CommerceCollectionDetail | null> {
  return medusaGetCollectionByHandle(handle, first, offset);
}

export async function searchProducts(
  query: string,
  first = 24,
  offset = 0
): Promise<PaginatedProducts> {
  return medusaSearchProducts(query, first, offset);
}

export async function getHomepageContent(): Promise<HomepageContent> {
  return medusaGetHomepageContent();
}

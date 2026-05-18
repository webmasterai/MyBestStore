/**
 * Ops script — not part of the Medusa production build (lives outside src/).
 * Run from backend/medusa-service:
 *   npx medusa exec ./scripts/cleanup-pakistan-shipping-options.ts
 */
import { ExecArgs } from "@medusajs/framework/types"
import { loadEnv, normalizeUrl } from "./_utils.mjs"

async function medusaAdmin(pathname: string, init: RequestInit = {}, retried = false) {
  const env = loadEnv()
  const backendUrl = normalizeUrl(env.MEDUSA_BACKEND_URL || env.NEXT_PUBLIC_MEDUSA_BACKEND_URL || "http://localhost:9000")
  let token = String(env.MEDUSA_ADMIN_API_TOKEN || "")

  if (!backendUrl) {
    throw new Error("MEDUSA_BACKEND_URL is required")
  }

  const res = await fetch(`${backendUrl}${pathname}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
      ...(init.headers || {}),
    },
  })

  if (res.status === 401 && !retried) {
    const { tryMedusaAdminLogin } = await import("./_utils.mjs")
    token = (await tryMedusaAdminLogin({
      backendUrl,
      email: String(env.MEDUSA_ADMIN_EMAIL || ""),
      password: String(env.MEDUSA_ADMIN_PASSWORD || ""),
    })) || token

    if (token) {
      env.MEDUSA_ADMIN_API_TOKEN = token
      return medusaAdmin(pathname, init, true)
    }
  }

  if (!res.ok) {
    const text = await res.text().catch(() => "")
    throw new Error(`Medusa admin failed: ${res.status} ${res.statusText}${text ? ` - ${text}` : ""}`)
  }

  if (res.status === 204) return null
  return res.json()
}

export default async function cleanupPakistanShippingOptions({ container }: ExecArgs) {
  const query = container.resolve("query")

  const { data: options } = await query.graph({
    entity: "shipping_option",
    fields: [
      "id",
      "name",
      "created_at",
      "shipping_profile_id",
      "service_zone_id",
      "service_zone.name",
      "service_zone.fulfillment_set.location.address.country_code",
    ],
  })

  const pakistanOptions = (options || []).filter((option: any) => {
    const countryCode = option?.service_zone?.fulfillment_set?.location?.address?.country_code
    return String(countryCode || "").toUpperCase() === "PK"
  })

  const standardPreferred = pakistanOptions
    .filter((option: any) => String(option?.name || "").toLowerCase().includes("standard"))
    .sort((left: any, right: any) => String(right?.created_at || "").localeCompare(String(left?.created_at || "")))

  const keeper = standardPreferred[0] || pakistanOptions.sort((left: any, right: any) => String(right?.created_at || "").localeCompare(String(left?.created_at || "")))[0]

  if (!keeper) {
    console.log("No Pakistan shipping options found")
    return
  }

  const duplicates = pakistanOptions.filter((option: any) => option.id !== keeper.id)

  console.log(`Keeping shipping option ${keeper.id} (${keeper.name}) and deleting ${duplicates.length} duplicates`)

  for (const duplicate of duplicates) {
    await medusaAdmin(`/admin/shipping-options/${duplicate.id}`, {
      method: "DELETE",
    })
    console.log(`Deleted shipping option ${duplicate.id} (${duplicate.name})`)
  }
}

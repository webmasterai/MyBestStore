import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

const fieldSets: string[][] = [
  ["id", "name", "price_type", "service_zone_id", "shipping_profile_id"],
  [
    "id",
    "name",
    "price_type",
    "service_zone_id",
    "shipping_profile_id",
    "amount",
    "currency_code",
  ],
  [
    "id",
    "name",
    "price_type",
    "service_zone_id",
    "shipping_profile_id",
    "price_set_id",
  ],
  [
    "id",
    "name",
    "price_type",
    "service_zone_id",
    "shipping_profile_id",
    "prices.*",
  ],
  [
    "id",
    "name",
    "price_type",
    "service_zone_id",
    "shipping_profile_id",
    "price_set.*",
  ],
  [
    "id",
    "name",
    "price_type",
    "service_zone_id",
    "shipping_profile_id",
    "price_set.*",
    "price_set.prices.*",
  ],
]

export default async function debugShippingOptionPricesGraph({ container }: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as any

  let successCount = 0
  for (const fields of fieldSets) {
    try {
      const res = await query.graph({
        entity: "shipping_option",
        fields,
        pagination: { take: 50 },
      })

      const data = res?.data ?? res
      console.log("\n=== shipping_option graph fields ===")
      console.log(fields)
      console.log(`rows: ${Array.isArray(data) ? data.length : "?"}`)
      console.dir(data, { depth: 6 })
      successCount++
    } catch (e: any) {
      console.log("\n--- failed fieldset ---")
      console.log(fields)
      console.log(String(e?.message ?? e))
    }
  }

  if (successCount === 0) {
    console.log("Could not query shipping_option with attempted field sets")
  }
}

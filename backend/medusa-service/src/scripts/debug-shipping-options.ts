import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function debugShippingOptions({ container }: ExecArgs) {
  const fulfillment = container.resolve(Modules.FULFILLMENT) as any

  const options = await fulfillment.listShippingOptions({}, { take: 50 })
  console.log(`Loaded shipping options: ${options.length}`)

  for (const o of options) {
    const keys = Object.keys(o).sort()
    console.log("---")
    console.log("id", o.id)
    console.log("name", o.name)
    console.log("keys", keys)
    for (const k of [
      "price_set_id",
      "price_set",
      "price_type",
      "amount",
      "prices",
      "region_id",
      "service_zone_id",
      "shipping_profile_id",
      "provider_id",
      "type_id",
    ]) {
      if (o[k] != null) {
        // eslint-disable-next-line no-console
        console.log(k, o[k])
      }
    }
  }
}

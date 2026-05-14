import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function debugProductShippingProfile({ container }: ExecArgs) {
  const remoteLink = container.resolve("remoteLink")
  const query = container.resolve("query")

  // Get first product
  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "title"],
    pagination: { take: 1 },
  })

  // Get default shipping profile
  const { data: profiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id", "name"],
    filters: { type: "default" }
  })

  if (products[0] && profiles[0]) {
    console.log(`Linking product ${products[0].id} to shipping profile ${profiles[0].id}`)
    try {
      await remoteLink.create({
        [Modules.PRODUCT]: { product_id: products[0].id },
        [Modules.FULFILLMENT]: { shipping_profile_id: profiles[0].id }
      })
      console.log("Success!")
    } catch (e) {
      console.log("Failed to link:", e.message)
    }
  }
}

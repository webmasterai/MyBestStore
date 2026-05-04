import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function diagnosticShipping({ container }: ExecArgs) {
  const query = container.resolve("query")

  console.log("--- Diagnostic: Shipping Profiles & Options ---")

  // 1. List All Shipping Profiles
  const { data: profiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id", "name", "type"],
  })
  console.log("Shipping Profiles:", JSON.stringify(profiles, null, 2))

  // 2. List All Shipping Options
  const { data: options } = await query.graph({
    entity: "shipping_option",
    fields: ["id", "name", "shipping_profile_id", "service_zone_id"],
  })
  console.log("Shipping Options:", JSON.stringify(options, null, 2))

  // 3. Sample Products and their Profiles
  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "title", "shipping_profile_id"],
    
  })
  console.log("Sample Products:", JSON.stringify(products, null, 2))

  console.log("--- End Diagnostic ---")
}

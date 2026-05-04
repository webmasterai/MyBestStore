import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { updateProductsWorkflow } from "@medusajs/core-flows"

export default async function fixShippingProfiles({ container }: ExecArgs) {
  const query = container.resolve("query")
  const productModule = container.resolve(Modules.PRODUCT)

  console.log("--- Fixing Shipping Profiles for All Products ---")

  // 1. Get the Default Shipping Profile
  const { data: profiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id", "name"],
    filters: { type: "default" }
  })

  const defaultProfile = profiles.find(p => p.name === "Default Shipping Profile") || profiles[0]
  if (!defaultProfile) {
    console.error("No default shipping profile found.")
    return
  }
  console.log(`Using Default Shipping Profile: ${defaultProfile.name} (${defaultProfile.id})`)

  // 2. Get all products
  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "title", "shipping_profile.id"]
  })

  console.log(`Updating ${products.length} products individually...`)
  
  let successCount = 0
  let failCount = 0
  let batch: { id: string; shipping_profile_id: string | null }[] = []

  for (const product of products) {
    try {
      batch.push({ id: product.id, shipping_profile_id: defaultProfile.id })

      if (batch.length >= 100) {
        await updateProductsWorkflow(container).run({ input: { products: batch } })
        successCount += batch.length
        batch = []
      }
    } catch (err) {
      failCount++
      if (failCount < 5) {
        console.error(`Failed to update ${product.title}:`, err.message)
      }
    }
    
    if ((successCount + failCount) % 100 === 0) {
      console.log(`Processed ${successCount + failCount}/${products.length} products...`)
    }
  }

  console.log(`--- Finished! ---`)
  if (batch.length) {
    await updateProductsWorkflow(container).run({ input: { products: batch } })
    successCount += batch.length
  }
  console.log(`Successfully updated: ${successCount}`)
  console.log(`Failed: ${failCount}`)
}

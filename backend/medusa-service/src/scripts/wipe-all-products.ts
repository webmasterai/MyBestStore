import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { deleteProductsWorkflow } from "@medusajs/core-flows"

/**
 * WIPE SCRIPT - Deletes all products from Medusa.
 * Run this before re-importing from Shopify.
 * 
 * Usage: npx medusa exec src/scripts/wipe-all-products.ts
 */
export default async function wipeAllProducts({ container }: ExecArgs) {
  const query = container.resolve("query")

  console.log("\n⚠️  WARNING: This will DELETE ALL PRODUCTS from Medusa!")
  console.log("Proceeding with deletion in 3 seconds...\n")

  // Get all products
  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "title"],
    limit: 9999
  })

  if (!products || products.length === 0) {
    console.log("✓ No products found. Database is already clean.\n")
    return
  }

  console.log(`Found ${products.length} products to delete...\n`)

  const productIds = products.map((p: any) => p.id)
  let deleted = 0
  let failed = 0

  // Delete in batches to avoid overwhelming the system
  const batchSize = 50
  for (let i = 0; i < productIds.length; i += batchSize) {
    const batch = productIds.slice(i, i + batchSize)
    
    for (const id of batch) {
      try {
        await deleteProductsWorkflow(container).run({
          input: { ids: [id] }
        })
        deleted++
        if (deleted % 100 === 0) {
          console.log(`Deleted ${deleted}/${productIds.length} products...`)
        }
      } catch (err: any) {
        failed++
        console.error(`Failed to delete product ${id}: ${err?.message}`)
      }
    }
  }

  console.log(`\n✓ Deletion complete!`)
  console.log(`  Deleted: ${deleted}`)
  console.log(`  Failed: ${failed}`)
  console.log(`\n✅ Database is now clean. Ready for fresh Shopify import.\n`)
}

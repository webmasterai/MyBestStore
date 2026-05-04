import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"
import { updateProductVariantsWorkflow } from "@medusajs/core-flows"

/**
 * Migration script to fix product variant prices.
 * 
 * Identifies variants with suspicious 100x multiplier prices and corrects them.
 * Shopify prices in PKR should be in minor units (100 = 1 PKR).
 * 
 * Example:
 *   - Shopify: 1070.00 PKR = 107000 minor units (correct)
 *   - Migrated wrongly: 10700000 minor units (100x too large)
 *   - Fixed: 107000 minor units (correct)
 */
export default async function migrateFixProductPrices({ container }: ExecArgs) {
  const query = container.resolve("query")

  console.log("--- Price Migration Audit & Fix ---\n")

  // 1. Get all product variants with their current prices
  const { data: variants } = await query.graph({
    entity: "product_variant",
    fields: [
      "id",
      "title",
      "product.id",
      "product.title",
      "product.metadata",
      "prices.*"
    ]
  })

  if (!variants || !variants.length) {
    console.log("No variants found.")
    return
  }

  console.log(`Found ${variants.length} product variants.\n`)

  interface VariantUpdate {
    id: string
    prices: Array<{ currency_code: string; amount: number }>
  }
  
  const updatesToApply: VariantUpdate[] = []
  let suspiciousCount = 0
  let suspiciousDetails: string[] = []

  for (const variant of variants) {
    const prices = variant.prices || []
    let shouldUpdate = false
    const correctedPrices = []

    for (const price of prices) {
      const currencyCode = (price.currency_code || "").toLowerCase()
      const amount = price.amount || 0

      // Heuristic: PKR prices above 500,000 are suspicious for imported products
      // if they were accidentally multiplied by 100.
      // (e.g., Rs 25,000 imported as 2,500,000)
      const isShopifyImport = variant.product?.metadata?.source === "shopify-import"
      
      if (currencyCode === "pkr" && amount >= 100000 && isShopifyImport) {
        const correctedAmount = Math.round(amount / 100)
        suspiciousCount++
        suspiciousDetails.push(
          `  ${variant.product.title} > ${variant.title}: ${amount} → ${correctedAmount} units`
        )
        correctedPrices.push({
          currency_code: currencyCode,
          amount: correctedAmount
        })
        shouldUpdate = true
      } else {
        correctedPrices.push({
          currency_code: currencyCode,
          amount: amount
        })
      }
    }

    if (shouldUpdate) {
      updatesToApply.push({
        id: variant.id,
        prices: correctedPrices
      })
    }
  }

  console.log(`Suspicious prices found: ${suspiciousCount}`)
  if (suspiciousDetails.length > 0) {
    console.log("\nVariants needing correction:")
    suspiciousDetails.forEach(detail => console.log(detail))
  }
  console.log()

  // 2. Apply fixes if any found
  if (updatesToApply.length === 0) {
    console.log("✓ All prices look good! No corrections needed.\n")
    return
  }

  console.log(`\nApplying corrections to ${updatesToApply.length} variants...\n`)

  try {
    // Use the updateProductVariantsWorkflow for batch updates
    const { result } = await updateProductVariantsWorkflow(container).run({
      input: { variants: updatesToApply }
    })

    console.log(`✓ Updated ${updatesToApply.length} variants`)
    console.log("\n--- Migration Complete ---")
    console.log(`Success: ${updatesToApply.length}/${updatesToApply.length}`)
  } catch (err: any) {
    console.error(`✗ Batch update failed: ${err?.message || err}`)
    console.log("Attempting individual updates...")

    let successCount = 0
    let failCount = 0

    for (const update of updatesToApply) {
      try {
        await updateProductVariantsWorkflow(container).run({
          input: { variants: [update] }
        })
        successCount++
        console.log(`✓ Fixed variant ${update.id}`)
      } catch (err: any) {
        failCount++
        console.error(`✗ Failed to fix variant ${update.id}: ${err?.message || err}`)
      }
    }

    console.log(`\n--- Migration Complete ---`)
    console.log(`Success: ${successCount}/${updatesToApply.length}`)
    if (failCount > 0) {
      console.log(`Failed: ${failCount}/${updatesToApply.length}`)
    }
  }
}

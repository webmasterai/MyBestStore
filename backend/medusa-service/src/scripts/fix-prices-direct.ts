import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

type VariantPriceRow = { id?: string; currency_code?: string; amount?: number }
type ProductVariantGraphRow = {
  id: string
  title?: string | null
  product?: { id?: string; title?: string } | null
  prices?: VariantPriceRow[] | null
}

/**
 * Direct price fix for 100x multiplied prices via the Pricing module.
 */
export default async function fixPricesDirect({ container }: ExecArgs) {
  const query = container.resolve("query")
  const pricingService = container.resolve(Modules.PRICING) as any

  console.log("--- Direct Price Fix ---\n")

  const { data: variants } = await query.graph({
    entity: "product_variant",
    fields: ["id", "product.id", "product.title", "title", "prices.*"],
  })

  const toFix: {
    variant_id: string
    product_id?: string
    product_title?: string
    variant_title?: string | null
    old_amount: number
    new_amount: number
    price_id: string
  }[] = []

  for (const variant of (variants || []) as ProductVariantGraphRow[]) {
    const product = variant.product
    if (!product?.id) continue

    for (const price of variant.prices || []) {
      if ((price.currency_code || "").toLowerCase() === "pkr" && (price.amount ?? 0) > 10000000) {
        const priceId = price.id
        if (!priceId) continue

        toFix.push({
          variant_id: variant.id,
          product_id: product.id,
          product_title: product.title,
          variant_title: variant.title,
          old_amount: price.amount ?? 0,
          new_amount: Math.round((price.amount ?? 0) / 100),
          price_id: priceId,
        })
      }
    }
  }

  console.log(`Found ${toFix.length} prices to fix:\n`)
  toFix.slice(0, 10).forEach((p) => {
    console.log(`  ${p.product_title} > ${p.variant_title}: ${p.old_amount} → ${p.new_amount}`)
  })
  if (toFix.length > 10) console.log(`  ... and ${toFix.length - 10} more\n`)

  if (toFix.length === 0) {
    console.log("✓ No prices need fixing!\n")
    return
  }

  console.log(`Updating ${toFix.length} prices...`)

  let updated = 0
  try {
    await pricingService.updatePrices(
      toFix.map((item) => ({ id: item.price_id, amount: item.new_amount }))
    )
    updated = toFix.length
  } catch (err: any) {
    console.error(`Pricing update failed: ${err?.message || err}`)
  }

  console.log(`✓ Updated ${updated}/${toFix.length} prices`)
  console.log("\n--- Price Fix Complete ---\n")
}

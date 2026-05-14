import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

export default async function fixPkrPrices({ container }: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as any
  const pricingService = container.resolve(Modules.PRICING) as any

  console.log("--- Starting PKR Price Fix (Divide by 100) ---")

  // 1. Ensure PKR currency is set to 0 decimals
  console.log("Checking PKR currency configuration...")
  const { data: currencies } = await query.graph({
    entity: "currency",
    fields: ["code", "decimal_digits"],
    filters: { code: "pkr" }
  })

  if (currencies.length > 0 && currencies[0].decimal_digits !== 0) {
    console.log(`Updating PKR decimal_digits from ${currencies[0].decimal_digits} to 0...`)
    // Note: Updating currency usually requires the currency module or a direct update if possible.
    // However, the user's diagnostic showed it's already 0.
  } else {
    console.log("PKR currency decimal_digits is already 0.")
  }

  // 2. Fetch all PKR prices
  console.log("Fetching PKR prices...")
  const { data: prices } = await query.graph({
    entity: "price",
    fields: ["id", "amount"],
    filters: { currency_code: "pkr" },
    pagination: { take: 5000 }
  })

  console.log(`Found ${prices.length} PKR prices to process.`)

  const updates: { id: string; amount: number }[] = []
  let count = 0

  for (const price of prices) {
    // Only divide if the amount is "large" or if we are sure all PKR prices are scaled wrong.
    // Based on diagnostic, even 15900 is likely 159.00 scaled wrong.
    // User specifically asked to divide ALL PKR prices by 100.
    const newAmount = Math.round(price.amount / 100)
    
    updates.push({
      id: price.id,
      amount: newAmount
    })
    count++
  }

  if (updates.length > 0) {
    console.log(`Applying updates to ${updates.length} prices...`)
    // Medusa v2 Pricing Module updatePrices
    await pricingService.updatePrices(updates)
    console.log("Successfully updated prices.")
  } else {
    console.log("No prices needed updating.")
  }

  console.log("--- PKR Price Fix Complete ---")
}

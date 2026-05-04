import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"

const TARGET_PKR_AMOUNT = 250 // Rs 250 (PKR has 0 decimals in Medusa)

export default async function fixPakistanShippingPrice({ container }: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as any
  const pricing = container.resolve(Modules.PRICING) as any

  console.log(`--- Fix Pakistan Shipping Price (set PKR to ${TARGET_PKR_AMOUNT}) ---`)

  const { data: options } = await query.graph({
    entity: "shipping_option",
    fields: [
      "id",
      "name",
      "service_zone.fulfillment_set.location.address.country_code",
      "prices.id",
      "prices.currency_code",
      "prices.amount",
      "prices.price_set_id",
    ],
    pagination: { take: 200 },
  })

  const pakistanOptions = (options || []).filter((o: any) => {
    const cc = o?.service_zone?.fulfillment_set?.location?.address?.country_code
    return String(cc || "").toUpperCase() === "PK"
  })

  if (!pakistanOptions.length) {
    throw new Error("No Pakistan shipping options found (service zone country_code=PK).")
  }

  let updated = 0
  let alreadyCorrect = 0
  let skippedNoPriceSet = 0

  for (const opt of pakistanOptions) {
    const prices = Array.isArray(opt?.prices) ? opt.prices : []
    const pkrPrices = prices.filter((p: any) => String(p?.currency_code || "").toLowerCase() === "pkr")

    const correct = pkrPrices.some((p: any) => Number(p?.amount) === TARGET_PKR_AMOUNT)
    if (correct) {
      alreadyCorrect++
      continue
    }

    // Determine the price set to update based on existing prices. If there are no prices at all,
    // we can't safely attach a new price set here without using a dedicated workflow.
    const priceSetId = pkrPrices[0]?.price_set_id || prices[0]?.price_set_id
    if (!priceSetId) {
      skippedNoPriceSet++
      console.log(`Skipping ${opt.id} (${opt.name}) - no linked price_set_id found.`)
      continue
    }

    const removeIds = pkrPrices.map((p: any) => p.id).filter(Boolean)
    if (removeIds.length) {
      await pricing.removePrices(removeIds)
    }

    await pricing.addPrices({
      priceSetId,
      prices: [
        {
          currency_code: "pkr",
          amount: TARGET_PKR_AMOUNT,
        },
      ],
    })

    updated++
    console.log(`Updated PKR shipping price for ${opt.id} (${opt.name}) -> ${TARGET_PKR_AMOUNT}`)
  }

  console.log("--- Summary ---")
  console.log(`Pakistan shipping options: ${pakistanOptions.length}`)
  console.log(`Updated: ${updated}`)
  console.log(`Already correct: ${alreadyCorrect}`)
  console.log(`Skipped (no price set): ${skippedNoPriceSet}`)
  console.log("--- Done ---")
}

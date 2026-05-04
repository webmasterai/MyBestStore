import { ExecArgs } from "@medusajs/framework/types"
import { createOrderWorkflow } from "@medusajs/medusa/core-flows"

export default async function createTestOrder({ container }: ExecArgs) {
  const query = container.resolve("query")

  console.log("--- Creating test order ---")

  // 1. Pick a variant
  const { data: variants } = await query.graph({
    entity: "product_variant",
    fields: ["id", "title", "product.title"]
  })

  if (!variants || !variants.length) {
    console.error("No variants found to create order")
    return
  }

  const variant = variants[0]
  console.log("Using variant:", variant.id)

  // 2. Pick a region
  const { data: regions } = await query.graph({
    entity: "region",
    fields: ["id", "currency_code"]
  })

  if (!regions || !regions.length) {
    console.error("No region found")
    return
  }

  const region = regions[0]
  console.log("Using region:", region.id)

  // 3. Pick a shipping option for the region
  const { data: options } = await query.graph({
    entity: "shipping_option",
    fields: ["id", "name", "prices.*", "shipping_profile.id"]
  })

  if (!options || !options.length) {
    console.error("No shipping options found")
    return
  }

  // Try to find option with region price
  let chosen = null as any
  for (const opt of options) {
    const prices = opt.prices || []
    const matched = prices.find((p: any) => p.region_id === region.id || p.currency_code === region.currency_code)
    if (matched) {
      chosen = { option: opt, price: matched }
      break
    }
  }

  if (!chosen) {
    chosen = { option: options[0], price: (options[0].prices && options[0].prices[0]) || { amount: 10000 } }
  }

  console.log("Using shipping option:", chosen.option.id, "price:", chosen.price.amount)

  // 4. Create order via workflow
  const { result: order } = await createOrderWorkflow(container).run({
    input: {
      region_id: region.id,
      email: "test+order@example.com",
      items: [
        {
          variant_id: variant.id,
          quantity: 1,
          title: variant.title || "Test Item",
          unit_price: (chosen.price && chosen.price.amount) || 10000
        }
      ],
      shipping_address: {
        first_name: "Test",
        last_name: "Buyer",
        address_1: "1 Test St",
        city: "Karachi",
        country_code: "pk",
        postal_code: "00000",
        phone: "03000000000"
      },
      shipping_methods: [
        {
          name: chosen.option.name || "Standard",
          amount: chosen.price.amount || 10000,
          shipping_option_id: chosen.option.id
        }
      ]
    }
  })

  console.log("Order created:", order?.id)
  console.log("Order status:", order?.status)
  console.log("--- Done ---")
}

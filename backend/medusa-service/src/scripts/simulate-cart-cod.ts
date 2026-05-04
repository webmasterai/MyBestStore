import { ExecArgs } from "@medusajs/framework/types"
import {
  createCartWorkflow,
  listShippingOptionsForCartWithPricingWorkflow,
  addShippingMethodToCartWorkflow,
  completeCartWorkflow,
  createPaymentCollectionForCartWorkflow,
  createPaymentSessionsWorkflow,
} from "@medusajs/medusa/core-flows"

export default async function simulateCartCod({ container }: ExecArgs) {
  const query = container.resolve("query")

  console.log("--- Simulating cart-based COD checkout ---")

  // 1. pick a variant
  const { data: variants } = await query.graph({
    entity: "product_variant",
    fields: ["id", "title", "product.title"]
  })

  if (!variants || !variants.length) {
    console.error("No variants available")
    return
  }

  const variant = variants[0]
  console.log("Variant:", variant.id)

  // 2. pick a region
  const { data: regions } = await query.graph({
    entity: "region",
    fields: ["id", "name", "countries.code", "countries.name"],
  })
  if (!regions || !regions.length) {
    console.error("No region found")
    return
  }
  const region =
    regions.find((candidate: any) =>
      Array.isArray(candidate.countries) &&
      candidate.countries.some((country: any) => country?.code?.toLowerCase() === "pk")
    ) || regions.find((candidate: any) => candidate?.name?.toLowerCase() === "pakistan") || regions[0]

  // 3. create a cart with one line item
  const { result: cart } = await createCartWorkflow(container).run({
    input: {
      region_id: region.id,
      email: "test+cart@example.com",
      items: [
        {
          variant_id: variant.id,
          quantity: 1,
          unit_price: 10000,
        },
      ],
      shipping_address: {
        first_name: "Test",
        last_name: "Buyer",
        address_1: "1 Test St",
        city: "Karachi",
        country_code: "pk",
        postal_code: "00000",
      },
    },
  })
  if (!cart) {
    console.error("Failed to create cart")
    return
  }

  console.log("Created cart:", cart.id)

  // 4. list shipping options for cart (with pricing)
  const { result: optionsResult } = await listShippingOptionsForCartWithPricingWorkflow(
    container
  ).run({ input: { cart_id: cart.id } })

  const options = optionsResult || []
  console.log("Shipping options found:", options.length)
  if (!options.length) {
    console.error("No shipping options available for cart - cannot complete checkout")
    return
  }

  console.log("Shipping options (raw):", JSON.stringify(options, null, 2))

  // Prefer an option that includes pricing (calculated_amount)
  const opt = options.find((o: any) => {
    if (!o) return false
    if (Array.isArray(o.prices)) {
      return o.prices.some((p: any) => p && typeof p.calculated_amount !== "undefined")
    }
    if (Array.isArray(o.pricing)) {
      return o.pricing.some((p: any) => p && typeof p.calculated_amount !== "undefined")
    }
    return !!(o.price && typeof o.price.calculated_amount !== "undefined")
  }) || options[0]

  // 5. attach shipping method to cart
  console.log("Attaching shipping option:", opt.id || opt.option_id || opt.shipping_option_id)
  try {
    await addShippingMethodToCartWorkflow(container).run({
      input: {
        cart_id: cart.id,
        options: [
          {
            id: opt.option_id || opt.shipping_option_id || opt.id,
          },
        ],
      },
    })
  } catch (err: any) {
    console.error("addShippingMethodToCartWorkflow error:", err?.message || err)
  }

  // Ensure a payment collection and a payment session exist for the cart (needed for completeCartWorkflow)
  try {
    const { result: paycol } = await createPaymentCollectionForCartWorkflow(container).run({
      input: {
        cart_id: cart.id,
      },
    })

    console.log("Created payment collection:", paycol?.id)

    // pick an enabled provider by querying available payment providers
    const { data: available } = await query.graph({ entity: "payment_provider", fields: ["id", "provider_id", "is_enabled", "is_installed"] })
    const enabled = (available || []).find((p: any) => p.is_enabled && p.is_installed)
    const provider_id = enabled?.id || enabled?.provider_id || "pp_system_default"

    if (!provider_id) {
      console.error("No enabled payment provider found; cannot create payment session")
    } else {
      const { result: session } = await createPaymentSessionsWorkflow(container).run({
        input: {
          payment_collection_id: paycol.id,
          provider_id,
        },
      })

      console.log("Created payment session:", session?.id, "provider:", provider_id)
    }
  } catch (err: any) {
    console.error("Payment session creation error:", err?.message || err)
  }

  // 6. try to complete the cart
  try {
    const { result } = await completeCartWorkflow(container).run({ input: { id: cart.id } })
    console.log("Complete cart result:", result)
  } catch (err: any) {
    console.error("completeCartWorkflow failed:")
    try {
      console.error(JSON.stringify(err, Object.getOwnPropertyNames(err), 2))
    } catch (e) {
      console.error(err)
    }
  }

  console.log("--- Done simulation ---")
}

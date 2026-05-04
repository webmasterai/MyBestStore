import { ExecArgs } from "@medusajs/framework/types"
import {
  createCartWorkflow,
  listShippingOptionsForCartWithPricingWorkflow,
  addShippingMethodToCartWorkflow,
  createPaymentCollectionForCartWorkflow,
  createPaymentSessionsWorkflow,
  completeCartWorkflow,
} from "@medusajs/medusa/core-flows"

/**
 * COD Checkout Validation Script
 * 
 * Tests the complete COD checkout flow with price validation:
 * 1. Verify product variant prices are reasonable
 * 2. Create cart and add items
 * 3. Add shipping method
 * 4. Create payment collection with COD provider
 * 5. Complete order and verify final amounts
 */
export default async function validateCodCheckoutWithPrices({ container }: ExecArgs) {
  const query = container.resolve("query")

  console.log("\n=== COD Checkout Validation ===\n")

  try {
    // 1. Get a product variant and validate its price
    console.log("Step 1: Checking product variant prices...\n")
    
    const { data: variants } = await query.graph({
      entity: "product_variant",
      fields: [
        "id",
        "title",
        "product.title",
        "prices.*"
      ],
      limit: 1
    })

    if (!variants || !variants.length) {
      console.error("✗ No product variants found.")
      return
    }

    const variant = variants[0]
    const pkrPrice = (variant.prices || []).find((p: any) => 
      (p.currency_code || "").toLowerCase() === "pkr"
    )

    if (!pkrPrice) {
      console.error("✗ No PKR price found for variant.")
      return
    }

    console.log(`Product: ${variant.product.title}`)
    console.log(`Variant: ${variant.title}`)
    console.log(`Price (minor units): ${pkrPrice.amount}`)
    console.log(`Price (display): ${(pkrPrice.amount / 100).toFixed(2)} PKR`)

    // Sanity check: typical prices should be 500-500,000 PKR (50,000 - 50,000,000 minor units)
    if (pkrPrice.amount < 5000 || pkrPrice.amount > 100000000) {
      console.warn(
        `⚠ Warning: Price ${pkrPrice.amount} seems unusual (typical range: 5,000-100,000,000 minor units)`
      )
    } else {
      console.log(`✓ Price looks reasonable\n`)
    }

    // 2. Get Pakistan region
    console.log("Step 2: Getting Pakistan region...\n")
    
    const { data: regions } = await query.graph({
      entity: "region",
      fields: ["id", "name", "countries.code"]
    })

    const pkRegion = regions.find((r: any) => 
      Array.isArray(r.countries) &&
      r.countries.some((c: any) => String(c?.code || "").toLowerCase() === "pk")
    ) || regions.find((r: any) => String(r?.name || "").toLowerCase().includes("pakistan"))

    if (!pkRegion) {
      console.error("✗ Pakistan region not found.")
      return
    }

    console.log(`Region: ${pkRegion.name}`)
    console.log(`✓ Pakistan region found\n`)

    // 3. Create cart
    console.log("Step 3: Creating cart...\n")
    
    const { result: cart } = await createCartWorkflow(container).run({
      input: {
        region_id: pkRegion.id,
        email: "test+cod-validation@example.com",
        items: [
          {
            variant_id: variant.id,
            quantity: 1,
            unit_price: pkrPrice.amount,
          }
        ],
        shipping_address: {
          first_name: "COD",
          last_name: "Test",
          address_1: "Test Address",
          city: "Karachi",
          country_code: "pk",
          postal_code: "75000",
          phone: "+92300000000",
        }
      }
    })

    if (!cart) {
      console.error("✗ Failed to create cart.")
      return
    }

    console.log(`Cart ID: ${cart.id}`)
    console.log(`Cart subtotal (minor units): ${cart.subtotal || 0}`)
    console.log(`Expected: ${pkrPrice.amount}`)
    
    if (cart.subtotal === pkrPrice.amount) {
      console.log(`✓ Cart subtotal matches product price\n`)
    } else {
      console.warn(`⚠ Subtotal mismatch! Expected ${pkrPrice.amount}, got ${cart.subtotal}\n`)
    }

    // 4. Get shipping options
    console.log("Step 4: Getting shipping options...\n")
    
    const { result: shippingOptions } = await listShippingOptionsForCartWithPricingWorkflow(
      container
    ).run({ input: { cart_id: cart.id } })

    const options = shippingOptions || []
    if (options.length === 0) {
      console.error("✗ No shipping options available.")
      return
    }

    console.log(`Available shipping options: ${options.length}`)
    options.forEach((opt: any, i: number) => {
      const price = opt.price || opt.prices?.[0] || opt.pricing?.[0] || {}
      console.log(`  ${i + 1}. ${opt.name || opt.id}: ${price.calculated_amount || price.amount || 0} minor units`)
    })

    const selectedOption = options[0]
    console.log(`\n✓ Selected: ${selectedOption.name || selectedOption.id}\n`)

    // 5. Add shipping method
    console.log("Step 5: Adding shipping method...\n")
    
    await addShippingMethodToCartWorkflow(container).run({
      input: {
        cart_id: cart.id,
        options: [
          {
            id: selectedOption.option_id || selectedOption.shipping_option_id || selectedOption.id,
          }
        ]
      }
    })

    console.log(`✓ Shipping method added\n`)

    // 6. Create payment collection
    console.log("Step 6: Creating payment collection...\n")
    
    const { result: paymentCol } = await createPaymentCollectionForCartWorkflow(container).run({
      input: { cart_id: cart.id }
    })

    if (!paymentCol) {
      console.error("✗ Failed to create payment collection.")
      return
    }

    console.log(`Payment collection ID: ${paymentCol.id}`)
    console.log(`Amount (minor units): ${paymentCol.amount || 0}`)
    console.log(`Currency: ${paymentCol.currency_code}`)
    console.log(`✓ Payment collection created\n`)

    // 7. Create payment session with COD provider
    console.log("Step 7: Creating payment session with COD...\n")
    
    // Get available payment providers
    const { data: providers } = await query.graph({
      entity: "payment_provider",
      fields: ["id", "provider_id", "is_enabled", "is_installed"]
    })

    const systemProvider = (providers || []).find((p: any) => 
      p.id === "pp_system_default" || 
      p.provider_id === "pp_system_default"
    )

    if (!systemProvider) {
      console.warn("⚠ System payment provider not found, using first available.")
    }

    const providerId = systemProvider?.id || systemProvider?.provider_id || "pp_system_default"
    console.log(`Using provider: ${providerId}`)

    const { result: paymentSession } = await createPaymentSessionsWorkflow(container).run({
      input: {
        payment_collection_id: paymentCol.id,
        provider_id: providerId
      }
    })

    if (!paymentSession) {
      console.error("✗ Failed to create payment session.")
      return
    }

    console.log(`Payment session ID: ${paymentSession.id}`)
    console.log(`Status: ${paymentSession.status}`)
    console.log(`✓ Payment session created\n`)

    // 8. Complete cart
    console.log("Step 8: Completing order...\n")
    
    const { result: order } = await completeCartWorkflow(container).run({
      input: { id: cart.id }
    })

    if (!order) {
      console.error("✗ Failed to complete cart.")
      return
    }

    console.log(`✓ Order created: ${order.id}`)
    console.log(`Status: ${order.status}`)
    console.log(`Display ID: ${order.display_id}`)
    console.log(`Total (minor units): ${order.total || 0}`)
    console.log(`Subtotal (minor units): ${order.subtotal || 0}`)
    console.log(`Shipping total (minor units): ${order.shipping_total || 0}`)
    console.log(`Tax total (minor units): ${order.tax_total || 0}`)
    
    // 9. Validate final amounts
    console.log("\n=== Price Validation Summary ===\n")
    
    const expectedSubtotal = pkrPrice.amount
    const actualSubtotal = order.subtotal || 0
    
    if (actualSubtotal === expectedSubtotal) {
      console.log(`✓ Order subtotal matches: ${actualSubtotal} minor units`)
    } else {
      console.warn(`⚠ Subtotal mismatch! Expected ${expectedSubtotal}, got ${actualSubtotal}`)
    }

    // Display all amounts in both minor units and display format
    console.log(`\nOrder breakdown (in PKR display format):`)
    console.log(`  Subtotal: ${(actualSubtotal / 100).toFixed(2)} PKR`)
    console.log(`  Shipping: ${((order.shipping_total || 0) / 100).toFixed(2)} PKR`)
    console.log(`  Tax: ${((order.tax_total || 0) / 100).toFixed(2)} PKR`)
    console.log(`  Total: ${((order.total || 0) / 100).toFixed(2)} PKR`)

    console.log("\n=== COD Checkout Validation Complete ===\n")
  } catch (err: any) {
    console.error("\n✗ Validation failed with error:")
    console.error(err?.message || err)
    if (err?.code) console.error(`Code: ${err.code}`)
    if (err?.context) console.error(`Context:`, err.context)
  }
}

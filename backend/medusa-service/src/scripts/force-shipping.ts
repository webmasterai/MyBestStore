import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function forceShipping({ container }: ExecArgs) {
  const fulfillmentModule = container.resolve(Modules.FULFILLMENT)
  const regionModule = container.resolve(Modules.REGION)
  const query = container.resolve("query")

  console.log("--- Forcing Shipping Setup for Pakistan ---")

  // 1. Get Pakistan Region
  const { data: regions } = await query.graph({
    entity: "region",
    fields: ["id", "name", "currency_code"],
    filters: { name: "Pakistan" }
  })

  if (!regions || regions.length === 0) {
    console.error("Pakistan region not found. Please create it in Admin first.")
    return
  }
  const region = regions[0]
  console.log(`Found Region: ${region.name} (${region.id})`)

  // 2. Ensure Fulfillment Set exists
  let fulfillmentSet
  const sets = await fulfillmentModule.listFulfillmentSets({ name: "Manual Fulfillment" })
  if (sets.length === 0) {
    fulfillmentSet = await fulfillmentModule.createFulfillmentSets({
      name: "Manual Fulfillment",
      type: "shipping",
    })
    console.log("Created new Fulfillment Set")
  } else {
    fulfillmentSet = sets[0]
    console.log("Using existing Fulfillment Set")
  }

  // 3. Ensure Service Zone exists for Pakistan
  let serviceZone
  const zones = await fulfillmentModule.listServiceZones({ name: "Pakistan Zone" })
  if (zones.length === 0) {
    serviceZone = await fulfillmentModule.createServiceZones({
      name: "Pakistan Zone",
      fulfillment_set_id: fulfillmentSet.id,
      geo_zones: [
        {
          type: "country",
          country_code: "pk",
        }
      ]
    })
    console.log("Created Service Zone for Pakistan")
  } else {
    serviceZone = zones[0]
    console.log("Using existing Service Zone")
  }

  // 4. Get Shipping Profile
  const { data: profiles } = await query.graph({
    entity: "shipping_profile",
    fields: ["id", "name"]
  })

  if (!profiles || profiles.length === 0) {
     console.error("No Shipping Profile found. Please seed your database or create one.")
     return
  }
  const profileId = profiles[0].id
  console.log(`Using Shipping Profile: ${profiles[0].name} (${profileId})`)

  // 5. Get Fulfillment Provider
  const providers = await fulfillmentModule.listFulfillmentProviders()
  if (!providers || providers.length === 0) {
      console.error("No Fulfillment Providers found. Please enable one in Medusa Admin.")
      return
  }
  const providerId = providers[0].id
  console.log(`Using Fulfillment Provider: ${providerId}`)

  // 6. Create Shipping Option if it doesn't already exist
  const existingOptions = await query.graph({
    entity: "shipping_option",
    fields: ["id", "name", "shipping_profile_id", "service_zone_id"],
    filters: {
      shipping_profile_id: profileId,
      service_zone_id: serviceZone.id,
    },
  })

  const existingStandard = (existingOptions.data || []).find((option) =>
    String(option?.name || "").toLowerCase().includes("standard")
  )

  if (existingStandard) {
    console.log(`Using existing Shipping Option: ${existingStandard.name} (${existingStandard.id})`)
  } else {
    try {
      const shippingOption = await fulfillmentModule.createShippingOptions({
        name: "Standard Delivery",
        price_type: "flat",
        service_zone_id: serviceZone.id,
        shipping_profile_id: profileId,
        provider_id: providerId,
        data: {},
        type: {
          label: "Standard",
          description: "Delivery in 3-5 working days",
          code: "standard"
        },
        rules: [
          {
            attribute: "is_return",
            operator: "eq",
            value: "false"
          }
        ]
      })
      
      console.log(`Created Shipping Option: ${shippingOption.name}`)
      console.log("Note: You may still need to add a Price (PKR 250) to this option in Medusa Admin -> Settings -> Shipping.")
    } catch (e) {
      console.log("Note: Shipping option might already exist or failed:", e.message)
    }
  }

  console.log("--- Finished! ---")
}

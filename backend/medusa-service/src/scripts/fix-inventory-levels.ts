import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { linkSalesChannelsToStockLocationWorkflow } from "@medusajs/medusa/core-flows"

export default async function fixInventoryLevels({ container }: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY)
  const inventoryService = container.resolve(Modules.INVENTORY)
  const stockLocationService = container.resolve(Modules.STOCK_LOCATION)
  const remoteLink = container.resolve("remoteLink")

  console.log("\n=== Fix Sales Channel + Inventory Levels ===\n")

  // 1) Resolve store defaults (best source of truth)
  const { data: stores } = await query.graph({
    entity: "store",
    fields: ["id", "default_sales_channel_id", "default_location_id"],
    pagination: { take: 1 },
  })

  const store = stores?.[0]
  if (!store) {
    throw new Error("No store found.")
  }

  // 2) Pick (or create) a stock location
  let locationId: string | undefined = store.default_location_id ?? undefined

  if (!locationId) {
    const { data: locations } = await query.graph({
      entity: "stock_location",
      fields: ["id", "name"],
      pagination: { take: 50 },
    })

    if (!locations?.length) {
      const created = await stockLocationService.createStockLocations({
        name: "Default Warehouse",
      })
      locationId = created.id
      console.log(`✓ Created stock location: ${locationId}`)
    } else {
      locationId = locations[0].id ?? undefined
    }
  }

  console.log(`✓ Using stock location: ${locationId}`)

  if (!locationId) {
    throw new Error("Could not resolve a stock location id.")
  }

  // 3) Pick sales channel(s)
  const { data: channels } = await query.graph({
    entity: "sales_channel",
    fields: ["id", "name"],
    pagination: { take: 200 },
  })

  if (!channels?.length) {
    throw new Error("No sales channels found.")
  }

  const defaultSalesChannelId: string | undefined =
    store.default_sales_channel_id ?? undefined
  const defaultSalesChannel = defaultSalesChannelId
    ? channels.find((c: any) => c.id === defaultSalesChannelId)
    : (channels.find((c: any) => c.name === "Default Sales Channel") ?? channels[0])

  if (defaultSalesChannel?.id) {
    console.log(`✓ Store default sales channel: ${defaultSalesChannel.name} (${defaultSalesChannel.id})`)
  } else {
    console.log("✓ Store has no default sales channel; will link all channels")
  }

  // 4) Link ALL Sales Channels -> Stock Location (fixes store add-to-cart sales channel routing)
  // The storefront uses the publishable API key, which can be associated with a sales channel
  // that is different from store.default_sales_channel_id. Linking all channels avoids mismatch.
  await linkSalesChannelsToStockLocationWorkflow(container).run({
    input: {
      id: locationId,
      add: channels.map((c: any) => c.id),
    },
  })

  // Verification log
  const { data: linkedLocation } = await query.graph({
    entity: "stock_location",
    fields: ["id", "name", "sales_channels.id", "sales_channels.name"],
    filters: { id: locationId },
    pagination: { take: 1 },
  })

  const linkedCount = linkedLocation?.[0]?.sales_channels?.length ?? 0
  console.log(`✓ Stock location now linked to ${linkedCount} sales channel(s)\n`)

  // 5) Ensure each managed-inventory variant has at least one inventory item linked
  // Medusa's cart inventory confirmation relies on:
  // product_variant -> inventory_items -> inventory_item -> location_levels -> stock_location -> sales_channels
  // If a variant has manage_inventory=true but no inventory_items links, add-to-cart can fail.
  let variantsChecked = 0
  let variantsFixed = 0
  let variantScanOffset = 0
  const variantScanLimit = 500

  while (true) {
    const { data: variants } = await query.graph({
      entity: "product_variant",
      fields: [
        "id",
        "title",
        "sku",
        "manage_inventory",
        "allow_backorder",
        "inventory_items.inventory_item_id",
      ],
      pagination: { take: variantScanLimit, skip: variantScanOffset },
    })

    if (!variants?.length) break

    for (const v of variants as any[]) {
      variantsChecked++

      if (!v?.manage_inventory || v?.allow_backorder) continue

      const inventoryLinks = Array.isArray(v.inventory_items) ? v.inventory_items : []
      const linkedInventoryItemIds = inventoryLinks
        .map((l: any) => l?.inventory_item_id || l?.id || l?.inventory_item?.id)
        .filter(Boolean)

      // If we already have a usable inventory item link, make sure it has a level at this location.
      if (linkedInventoryItemIds.length) {
        for (const inventoryItemId of linkedInventoryItemIds) {
          try {
            await inventoryService.createInventoryLevels({
              inventory_item_id: inventoryItemId,
              location_id: locationId,
              stocked_quantity: 999,
            })
          } catch {
            // ignore; we'll normalize levels globally in step 6
          }
        }
        continue
      }

      const sku = v.sku || `sku-${v.id}`
      const item = await inventoryService.createInventoryItems({ sku })

      await remoteLink.create({
        [Modules.PRODUCT]: { variant_id: v.id },
        [Modules.INVENTORY]: { inventory_item_id: item.id },
      })

      // Ensure the newly created inventory item has a level at this stock location
      try {
        await inventoryService.createInventoryLevels({
          inventory_item_id: item.id,
          location_id: locationId,
          stocked_quantity: 999,
        })
      } catch {
        // ignore; handled in step 6
      }

      variantsFixed++
    }

    variantScanOffset += variants.length
  }

  console.log(
    `Scanned ${variantsChecked} variants. Linked inventory items for ${variantsFixed} variants missing inventory links.\n`
  )

  // 6) Ensure inventory levels exist for ALL inventory items at that location
  const { data: inventoryItems } = await query.graph({
    entity: "inventory_item",
    fields: ["id"],
  })

  console.log(`Found ${inventoryItems.length} inventory items.`)

  let created = 0
  let updated = 0
  let failed = 0

  for (const item of inventoryItems) {
    const inventoryItemId = item.id
    try {
      // Correct field name is location_id (NOT stock_location_id)
      await inventoryService.createInventoryLevels({
        inventory_item_id: inventoryItemId,
        location_id: locationId,
        stocked_quantity: 999,
      })
      created++
    } catch (e: any) {
      // If it already exists, update it (signatures match repo's force-stock.ts)
      try {
        const levels = await inventoryService.listInventoryLevels({
          inventory_item_id: [inventoryItemId],
          location_id: [locationId],
        })

        if (levels?.[0]) {
          await inventoryService.updateInventoryLevels({
            id: levels[0].id,
            inventory_item_id: inventoryItemId,
            location_id: locationId,
            stocked_quantity: Math.max(Number(levels[0].stocked_quantity ?? 0), 999),
          })
          updated++
        } else {
          failed++
        }
      } catch {
        failed++
      }
    }
  }

  console.log("\n=== Done ===")
  console.log(`Created levels: ${created}`)
  console.log(`Updated levels: ${updated}`)
  console.log(`Failed: ${failed}`)
}
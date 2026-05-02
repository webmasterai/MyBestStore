import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function forceStock({ container }: ExecArgs) {
  const query = container.resolve("query")
  const inventoryService = container.resolve(Modules.INVENTORY)
  const stockLocationService = container.resolve(Modules.STOCK_LOCATION)

  console.log("--- Forcing Stock for Pakistan Region ---")

  // 1. Get all variants
  const { data: variants } = await query.graph({
    entity: "product_variant",
    fields: ["id", "sku", "title"],
  })

  console.log(`Found ${variants.length} variants.`)

  // 2. Get or create a stock location
  let { data: locations } = await query.graph({
    entity: "stock_location",
    fields: ["id", "name"],
    filters: { name: "Pakistan Warehouse" }
  })
  
  let locationId
  if (!locations || locations.length === 0) {
    const loc = await stockLocationService.createStockLocations({ name: "Pakistan Warehouse" })
    locationId = loc.id
    console.log(`Created new location: ${locationId}`)
  } else {
    locationId = locations[0].id
    console.log(`Using existing location: ${locationId}`)
  }

  // 3. Update stock for each variant
  for (const variant of variants) {
    try {
      const sku = variant.sku || `sku-${variant.id}`
      
      // Try to find if already has an inventory item linked via graph
      const { data: variantWithInventory } = await query.graph({
        entity: "product_variant",
        fields: ["id", "inventory_items.*"],
        filters: { id: variant.id }
      })

      let inventoryItemId
      if (!variantWithInventory[0]?.inventory_items?.length) {
        // Create inventory item
        const item = await inventoryService.createInventoryItems({ sku })
        inventoryItemId = item.id
        
        // Use a more direct way to link in v2 if available, or skip for now if complex
        // Usually creation should be done via a workflow in v2
        console.log(`Created item ${inventoryItemId} for ${variant.title}, but needs linking.`)
      } else {
        inventoryItemId = variantWithInventory[0].inventory_items[0].inventory_item_id
      }

      if (inventoryItemId) {
        // Ensure level exists
        try {
          await inventoryService.createInventoryLevels({
            inventory_item_id: inventoryItemId,
            location_id: locationId,
            stocked_quantity: 10,
          })
        } catch (e) {
          const levels = await inventoryService.listInventoryLevels({
            inventory_item_id: [inventoryItemId],
            location_id: [locationId]
          })
          if (levels[0]) {
             await inventoryService.updateInventoryLevels(levels[0].id, {
               stocked_quantity: 10
             })
          }
        }
        console.log(`+ Stocked: ${variant.title}`)
      }
    } catch (e) {
      console.log(`! Failed for ${variant.title}:`, e.message)
    }
  }

  console.log("--- Finished! ---")
}

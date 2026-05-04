import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function debugProductModule({ container }: ExecArgs) {
  const productModule = container.resolve(Modules.PRODUCT)

  console.log("Product Module Methods:", Object.keys(productModule).filter(k => k.toLowerCase().includes("update")))
  
  // Try one update with a different signature
  const { data: products } = await container.resolve("query").graph({
    entity: "product",
    fields: ["id", "title"],
    
  })

  if (products[0]) {
    console.log("Testing update on:", products[0].id)
    try {
        console.log("Trying updateProducts(id, data)...")
        await (productModule as any).updateProducts(products[0].id, { shipping_profile_id: "test" })
    } catch (e) {
        console.log("Failed updateProducts(id, data):", e.message)
    }

    try {
        console.log("Trying updateProducts({id, data})...")
        await (productModule as any).updateProducts({ id: products[0].id, shipping_profile_id: "test" })
    } catch (e) {
        console.log("Failed updateProducts({id, data}):", e.message)
    }
  }
}

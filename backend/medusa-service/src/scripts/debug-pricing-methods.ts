import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function debugPricingMethods({ container }: ExecArgs) {
  const pricingModule = container.resolve(Modules.PRICING) as any
  const proto = Object.getPrototypeOf(pricingModule)
  const keys = Object.getOwnPropertyNames(proto).filter((k) => typeof pricingModule[k] === "function")
  keys.sort()
  console.log("Pricing module methods (subset):")
  console.log(keys.filter((k) => /(price|prices|priceSet|money|delete|remove|update|create|list|retrieve|upsert)/i.test(k)))
}

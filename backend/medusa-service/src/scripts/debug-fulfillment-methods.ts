import { ExecArgs } from "@medusajs/framework/types"
import { Modules } from "@medusajs/framework/utils"

export default async function debugFulfillmentMethods({ container }: ExecArgs) {
  const fulfillmentModule = container.resolve(Modules.FULFILLMENT) as any
  const proto = Object.getPrototypeOf(fulfillmentModule)
  const keys = Object.getOwnPropertyNames(proto).filter((k) => typeof fulfillmentModule[k] === "function")
  keys.sort()
  console.log("Fulfillment module methods (subset):")
  console.log(keys.filter((k) => /(shipping|option|serviceZone|fulfillmentSet|price|delete|remove|update|create|list)/i.test(k)))
}

import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export default async function diagnosticPrices({ container }: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as any

  console.log("--- Diagnostic: First 10 PKR Prices ---")
  const { data } = await query.graph({
    entity: "price",
    fields: ["id", "currency_code", "amount", "price_set_id"],
    filters: {
      currency_code: "pkr"
    },
    pagination: { take: 10 },
  })

  console.log(JSON.stringify(data, null, 2))

  console.log("\n--- Diagnostic: PKR Currency Config ---")
  const { data: currencies } = await query.graph({
    entity: "currency",
    fields: ["code", "symbol", "decimal_digits"],
    filters: {
      code: "pkr"
    }
  })
  console.log(JSON.stringify(currencies, null, 2))
}

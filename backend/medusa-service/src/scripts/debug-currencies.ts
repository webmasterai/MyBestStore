import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export default async function debugCurrencies({ container }: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as any

  const { data } = await query.graph({
    entity: "currency",
    fields: ["code", "name", "symbol", "decimal_digits"],
    pagination: { take: 200 },
  })

  const rows = (data || [])
    .filter((c: any) => ["pkr", "usd", "eur"].includes(String(c?.code || "").toLowerCase()))
    .sort((a: any, b: any) => String(a.code).localeCompare(String(b.code)))

  console.log(JSON.stringify(rows, null, 2))
}

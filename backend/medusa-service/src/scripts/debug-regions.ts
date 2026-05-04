import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export default async function debugRegions({ container }: ExecArgs) {
  const query = container.resolve(ContainerRegistrationKeys.QUERY) as any

  const { data: regions } = await query.graph({
    entity: "region",
    fields: ["id", "name", "currency_code", "countries.code"],
    pagination: { take: 50 },
  })

  console.log(JSON.stringify(regions, null, 2))
}

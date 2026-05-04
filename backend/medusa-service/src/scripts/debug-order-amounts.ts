import { ExecArgs } from "@medusajs/framework/types"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"

export default async function debugOrderAmounts({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER)
  const query = container.resolve("query")

  logger.info("--- Debugging order amounts (raw) ---")

  const { data: orders } = await query.graph({
    entity: "order",
    fields: [
      "id",
      "display_id",
      "created_at",
      "currency_code",
      "item_total",
      "item_subtotal",
      "shipping_subtotal",
      "subtotal",
      "shipping_total",
      "tax_total",
      "discount_total",
      "total",
      "paid_total",
      "refunded_total",
    ],
    orderBy: { created_at: "DESC" },
    limit: 5,
  })

  if (!orders?.length) {
    logger.warn("No orders found")
    return
  }

  for (const o of orders) {
    // eslint-disable-next-line no-console
    console.log(
      JSON.stringify(
        {
          id: o.id,
          display_id: o.display_id,
          created_at: o.created_at,
          currency_code: o.currency_code,
          item_total: (o as any).item_total,
          item_subtotal: (o as any).item_subtotal,
          shipping_subtotal: (o as any).shipping_subtotal,
          subtotal: o.subtotal,
          shipping_total: o.shipping_total,
          tax_total: o.tax_total,
          discount_total: o.discount_total,
          total: o.total,
          paid_total: o.paid_total,
          refunded_total: o.refunded_total,
        },
        null,
        2
      )
    )
  }
}

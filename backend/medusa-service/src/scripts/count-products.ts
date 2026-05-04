import { ExecArgs } from "@medusajs/framework/types";

export default async function countProducts({ container }: ExecArgs) {
  const query = container.resolve("query");

  // Get product count
  const { data: products } = await query.graph({
    entity: "product",
    fields: ["id", "title", "handle", "variants.prices.*"],
  });

  console.log(`\nTotal products in database: ${products.length}`);

  if (products.length > 0) {
    console.log("\nFirst 5 products:");
    products.slice(0, 5).forEach((p: any, i: number) => {
      console.log(`  ${i + 1}. ${p.title || "Unknown"} (${p.handle})`);
      if (p.variants?.[0]?.prices?.[0]) {
        const price = p.variants[0].prices[0];
        const amount = price.amount || 0;
        console.log(`     Price: ${amount} minor units (${(amount / 100).toFixed(2)} display)`);
      }
    });
  }
}

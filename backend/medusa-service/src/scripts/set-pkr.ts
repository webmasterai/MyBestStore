import { ExecArgs } from "@medusajs/framework/types";
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils";
import {
  createRegionsWorkflow,
  updateRegionsWorkflow,
  updateStoresWorkflow,
} from "@medusajs/medusa/core-flows";

export default async function setPkr({ container }: ExecArgs) {
  const logger = container.resolve(ContainerRegistrationKeys.LOGGER);
  const storeModuleService = container.resolve(Modules.STORE);
  const regionModuleService = container.resolve(Modules.REGION);

  logger.info("Updating store default currency to PKR and name to Digital Softs...");
  const [store] = await storeModuleService.listStores();
  
  await updateStoresWorkflow(container).run({
    input: {
      selector: { id: store.id },
      update: {
        name: "Digital Softs",
        supported_currencies: [
          { currency_code: "pkr", is_default: true },
          { currency_code: "usd", is_default: false }
        ],
      },
    },
  });

  logger.info("Checking regions...");
  const regions = await regionModuleService.listRegions();
  const pkrRegion = regions.find(r => r.currency_code === "pkr");

  if (pkrRegion) {
    logger.info(`Updating existing PKR region: ${pkrRegion.id}`);
    await updateRegionsWorkflow(container).run({
      input: {
        selector: { id: pkrRegion.id },
        update: {
          name: "Pakistan",
          countries: ["pk"],
        },
      },
    });
  } else {
    logger.info("Creating new Pakistan region with PKR...");
    // If there's an existing region using 'pk' country, we might need to remove it first
    // but for simplicity we try to create it.
    await createRegionsWorkflow(container).run({
      input: {
        regions: [
          {
            name: "Pakistan",
            currency_code: "pkr",
            countries: ["pk"],
            payment_providers: ["pp_system_default"],
          },
        ],
      },
    });
  }

  logger.info("Store and Region successfully set to PKR.");
  
  const updatedRegions = await regionModuleService.listRegions();
  const finalRegion = updatedRegions.find(r => r.currency_code === "pkr");
  console.log("-----------------------------------------");
  console.log("FINAL CONFIGURATION:");
  console.log(`Region ID: ${finalRegion?.id}`);
  console.log(`Currency: PKR`);
  console.log("-----------------------------------------");
  console.log("ACTION REQUIRED: Copy the Region ID above and set it as NEXT_PUBLIC_MEDUSA_REGION_ID in your root .env file.");
}

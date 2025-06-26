import { Command } from "commander";
import {
  displayServiceInfo,
  downServices,
  getAvailableServices,
  ProcessMode,
} from "../../services/service-utils.js";

const down = new Command("down")
  .description("Stop and delete services")
  .option("-l, --list", "List all available services")
  .option("-p, --prod", "Stop and delete only production mode services")
  .option("-w, --watch", "Stop and delete only watch mode services")
  .option("-d, --debug", "Stop and delete only debug mode services")
  .argument("[services...]", "Optional list of services to stop and delete")
  .action(
    async (
      services: string[],
      options: {
        list?: boolean;
        prod?: boolean;
        watch?: boolean;
        debug?: boolean;
      }
    ) => {
      // Display available services if requested
      if (options.list) {
        const availableServices = getAvailableServices();
        displayServiceInfo(availableServices);

        console.log("Usage examples:");
        console.log(
          "  yarn orb down                  # Stop and delete all services"
        );
        console.log(
          "  yarn orb down world            # Stop and delete the world service"
        );
        console.log(
          "  yarn orb down -w               # Stop and delete all services in watch mode"
        );
        console.log(
          "  yarn orb down world -d         # Stop and delete the world service in debug mode"
        );
        console.log("");
        return;
      }

      // Filter out any flags
      const serviceNames = services.filter((s) => !s.startsWith("-"));

      // Determine which mode to stop and delete
      let mode: ProcessMode | undefined;
      if (options.prod) {
        mode = "prod";
      } else if (options.watch) {
        mode = "watch";
      } else if (options.debug) {
        mode = "debug";
      }

      // Stop and delete services
      downServices(serviceNames, mode);
    }
  );

export default down;

import { Command } from "commander";
import {
  displayServiceInfo,
  getAvailableServices,
  startServices,
} from "../../services/service-utils.js";

const dev = new Command("dev")
  .description("Start services in development mode")
  .option("-l, --list", "List all available services")
  .option("-w, --watch", "Start in watch mode (default)")
  .option("-d, --debug", "Start in debug mode")
  .option("-p, --prod", "Start in production mode")
  .argument("[services...]", "Optional list of services to start")
  .action(
    async (
      services: string[],
      options: {
        list?: boolean;
        watch?: boolean;
        debug?: boolean;
        prod?: boolean;
      }
    ) => {
      // Display available services if requested
      if (options.list) {
        const availableServices = getAvailableServices();
        displayServiceInfo(availableServices);

        console.log("Usage examples:");
        console.log(
          "  yarn orb dev                  # Start all services in watch mode"
        );
        console.log(
          "  yarn orb dev world            # Start the world service in watch mode"
        );
        console.log(
          "  yarn orb dev -d               # Start all services in debug mode"
        );
        console.log(
          "  yarn orb dev world -p         # Start the world service in production mode"
        );
        console.log("");
        return;
      }

      // Filter out any flags
      const serviceNames = services.filter((s) => !s.startsWith("-"));

      // Determine which mode to start
      let mode = "watch"; // Default to watch mode
      if (options.debug) {
        mode = "debug";
      } else if (options.prod) {
        mode = "prod";
      }

      // Start services
      startServices(serviceNames, mode as any);
    }
  );

export default dev;

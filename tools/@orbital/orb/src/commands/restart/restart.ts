import { Command } from "commander";
import {
  displayServiceInfo,
  getAvailableServices,
  ProcessMode,
  restartServices,
} from "../../services/service-utils.js";

const restart = new Command("restart")
  .description("Restart services")
  .option("-l, --list", "List all available services")
  .option("-p, --prod", "Restart only production mode services")
  .option("-w, --watch", "Restart only watch mode services")
  .option("-d, --debug", "Restart only debug mode services")
  .argument("[services...]", "Optional list of services to restart")
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
          "  yarn orb restart                  # Restart all services"
        );
        console.log(
          "  yarn orb restart world            # Restart the world service"
        );
        console.log(
          "  yarn orb restart -w               # Restart all services in watch mode"
        );
        console.log(
          "  yarn orb restart world -d         # Restart the world service in debug mode"
        );
        console.log("");
        return;
      }

      // Filter out any flags
      const serviceNames = services.filter((s) => !s.startsWith("-"));

      // Determine which mode to restart
      let mode: ProcessMode | undefined;
      if (options.prod) {
        mode = "prod";
      } else if (options.watch) {
        mode = "watch";
      } else if (options.debug) {
        mode = "debug";
      }

      // Restart services
      restartServices(serviceNames, mode);
    }
  );

export default restart;

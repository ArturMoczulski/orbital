import { Command } from "commander";
import {
  displayServiceInfo,
  getAvailableServices,
  startServices,
} from "../../services/service-utils.js";

const watch = new Command("watch")
  .description("Start services in watch mode")
  .option("-l, --list", "List all available services")
  .argument("[services...]", "Optional list of services to start in watch mode")
  .action(async (services: string[], options: { list?: boolean }) => {
    // Display available services if requested
    if (options.list) {
      const availableServices = getAvailableServices();
      displayServiceInfo(availableServices);

      console.log("Usage examples:");
      console.log(
        "  yarn orb watch                  # Start all services in watch mode"
      );
      console.log(
        "  yarn orb watch world            # Start only the world service"
      );
      console.log(
        "  yarn orb watch world admin # Start multiple specific services"
      );
      console.log("");
      return;
    }

    // Filter out any flags
    const serviceNames = services.filter((s) => !s.startsWith("-"));

    // Start services in watch mode
    startServices(serviceNames, "watch");
  });

export default watch;

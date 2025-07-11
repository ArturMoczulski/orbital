import { Command } from "commander";
import {
  displayServiceInfo,
  getAvailableServices,
  startServices,
} from "../../services/service-utils.js";

const debug = new Command("debug")
  .description("Start services in debug mode")
  .option("-l, --list", "List all available services")
  .argument("[services...]", "Optional list of services to start in debug mode")
  .action(async (services: string[], options: { list?: boolean }) => {
    // Display available services if requested
    if (options.list) {
      const availableServices = getAvailableServices();
      displayServiceInfo(availableServices);

      console.log("Usage examples:");
      console.log(
        "  yarn orb debug                  # Start all services in debug mode"
      );
      console.log(
        "  yarn orb debug world            # Start only the world service"
      );
      console.log(
        "  yarn orb debug world admin # Start multiple specific services"
      );
      console.log("");
      return;
    }

    // Filter out any flags
    const serviceNames = services.filter((s) => !s.startsWith("-"));

    // Start services in debug mode
    startServices(serviceNames, "debug");
  });

export default debug;

import { execSync } from "child_process";
import fs from "fs";
import path from "path";
import { root } from "../utils.js";

// Read the monorepo name from package.json
const packageJsonPath = path.join(root, "package.json");
let monorepoName = "orbital"; // Default fallback
try {
  if (fs.existsSync(packageJsonPath)) {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"));
    monorepoName = packageJson.name || monorepoName;
  }
} catch (error) {
  console.warn("Error reading monorepo name from package.json:", error);
}

/**
 * Service information interface
 */
export interface ServiceInfo {
  name: string; // Service name without owner prefix (e.g., "world")
  fullName: string; // Full package name (e.g., "@orbital/world")
  type: "service" | "client"; // Type of service
  path: string; // Path to the service directory
  watchName: string; // PM2 process name for watch mode
  debugName: string; // PM2 process name for debug mode
  prodName: string; // PM2 process name for production mode
}

/**
 * Process mode for PM2
 */
export type ProcessMode = "prod" | "watch" | "debug";

/**
 * Get all available services in the monorepo
 * @returns Array of service information objects
 */
export function getAvailableServices(): ServiceInfo[] {
  const services: ServiceInfo[] = [];

  // Check services directory
  const servicesDir = path.join(root, "services");
  if (fs.existsSync(servicesDir)) {
    const serviceEntries = fs
      .readdirSync(servicesDir)
      .filter((entry) =>
        fs.statSync(path.join(servicesDir, entry)).isDirectory()
      );

    for (const entry of serviceEntries) {
      const servicePath = path.join(servicesDir, entry);
      const subEntries = fs
        .readdirSync(servicePath)
        .filter((subEntry) =>
          fs.statSync(path.join(servicePath, subEntry)).isDirectory()
        );

      for (const subEntry of subEntries) {
        // Skip ComfyUI service to prevent errors when running yarn watch
        if (entry === "@comfyanonymous" && subEntry === "ComfyUI") {
          console.log("Skipping ComfyUI service as requested");
          continue;
        }

        const packagePath = path.join(servicePath, subEntry, "package.json");
        if (fs.existsSync(packagePath)) {
          try {
            const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
            const fullName = pkg.name;
            // Extract service name without owner prefix
            const name = fullName.includes("/")
              ? fullName.split("/").pop()
              : fullName;

            // Default process names
            let watchName = `${monorepoName}/${name}-watch`;
            let debugName = `${monorepoName}/${name}-debug`;
            let prodName = `${monorepoName}/${name}`;

            // Check if ecosystem.config.js exists and read actual process names
            const ecosystemConfigPath = path.join(
              servicePath,
              subEntry,
              "ecosystem.config.js"
            );
            if (fs.existsSync(ecosystemConfigPath)) {
              try {
                // Read the ecosystem.config.js file as a string
                const ecosystemConfigContent = fs.readFileSync(
                  ecosystemConfigPath,
                  "utf8"
                );

                // Extract process names using regex
                const watchMatch = ecosystemConfigContent.match(
                  /name:\s*["']([^"']*-watch)["']/
                );
                const debugMatch = ecosystemConfigContent.match(
                  /name:\s*["']([^"']*-debug)["']/
                );
                const prodMatch = ecosystemConfigContent.match(
                  /name:\s*["']([^"']*?)["'](?!.*-watch|.*-debug)/
                );

                if (watchMatch && watchMatch[1]) watchName = watchMatch[1];
                if (debugMatch && debugMatch[1]) debugName = debugMatch[1];
                if (prodMatch && prodMatch[1]) prodName = prodMatch[1];
              } catch (error) {
                console.warn(
                  `Error reading ecosystem.config.js at ${ecosystemConfigPath}:`,
                  error
                );
              }
            }

            services.push({
              name,
              fullName,
              type: "service",
              path: path.join(servicePath, subEntry),
              watchName,
              debugName,
              prodName,
            });
          } catch (error) {
            console.warn(
              `Error reading package.json at ${packagePath}:`,
              error
            );
          }
        }
      }
    }
  }

  // Check clients directory
  const clientsDir = path.join(root, "clients");
  if (fs.existsSync(clientsDir)) {
    const clientEntries = fs
      .readdirSync(clientsDir)
      .filter((entry) =>
        fs.statSync(path.join(clientsDir, entry)).isDirectory()
      );

    for (const entry of clientEntries) {
      const clientPath = path.join(clientsDir, entry);
      const subEntries = fs
        .readdirSync(clientPath)
        .filter((subEntry) =>
          fs.statSync(path.join(clientPath, subEntry)).isDirectory()
        );

      for (const subEntry of subEntries) {
        const packagePath = path.join(clientPath, subEntry, "package.json");
        if (fs.existsSync(packagePath)) {
          try {
            const pkg = JSON.parse(fs.readFileSync(packagePath, "utf8"));
            const fullName = pkg.name;
            // Extract client name without owner prefix
            const name = fullName.includes("/")
              ? fullName.split("/").pop()
              : fullName;

            // Default process names
            let watchName = `${monorepoName}/${name}-watch`;
            let debugName = `${monorepoName}/${name}-debug`;
            let prodName = `${monorepoName}/${name}`;

            // Check if ecosystem.config.js exists and read actual process names
            const ecosystemConfigPath = path.join(
              clientPath,
              subEntry,
              "ecosystem.config.js"
            );
            if (fs.existsSync(ecosystemConfigPath)) {
              try {
                // Read the ecosystem.config.js file as a string
                const ecosystemConfigContent = fs.readFileSync(
                  ecosystemConfigPath,
                  "utf8"
                );

                // Extract process names using regex
                const watchMatch = ecosystemConfigContent.match(
                  /name:\s*["']([^"']*-watch)["']/
                );
                const debugMatch = ecosystemConfigContent.match(
                  /name:\s*["']([^"']*-debug)["']/
                );
                const prodMatch = ecosystemConfigContent.match(
                  /name:\s*["']([^"']*?)["'](?!.*-watch|.*-debug)/
                );

                if (watchMatch && watchMatch[1]) watchName = watchMatch[1];
                if (debugMatch && debugMatch[1]) debugName = debugMatch[1];
                if (prodMatch && prodMatch[1]) prodName = prodMatch[1];
              } catch (error) {
                console.warn(
                  `Error reading ecosystem.config.js at ${ecosystemConfigPath}:`,
                  error
                );
              }
            }

            services.push({
              name,
              fullName,
              type: "client",
              path: path.join(clientPath, subEntry),
              watchName,
              debugName,
              prodName,
            });
          } catch (error) {
            console.warn(
              `Error reading package.json at ${packagePath}:`,
              error
            );
          }
        }
      }
    }
  }

  return services;
}

/**
 * Find services by name or full name
 * @param serviceName Name or full name of the service to find
 * @returns Array of matching service information objects
 */
export function findServicesByName(serviceName: string): ServiceInfo[] {
  const services = getAvailableServices();
  return services.filter(
    (service) =>
      service.name === serviceName || service.fullName === serviceName
  );
}

/**
 * Create log directories for all services
 */
export function createLogDirectories(): void {
  const services = getAvailableServices();
  for (const service of services) {
    const logDir = path.join(service.path, "logs");
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
  }
}

/**
 * Stop all services
 */
export function stopAllServices(): void {
  try {
    console.log("Stopping all services...");
    execSync("npx pm2 stop all 2>/dev/null || true", {
      stdio: "inherit",
      cwd: root,
    });
    console.log("All services stopped.");
  } catch (error) {
    console.warn("Error stopping services:", error);
  }
}

/**
 * Get process name based on service and mode
 * @param service Service information
 * @param mode Process mode
 * @returns Process name
 */
export function getProcessName(
  service: ServiceInfo,
  mode: ProcessMode
): string {
  switch (mode) {
    case "prod":
      return service.prodName;
    case "watch":
      return service.watchName;
    case "debug":
      return service.debugName;
  }
}

/**
 * Start services in specified mode
 * @param serviceNames Array of service names to start (empty for all services)
 * @param mode Process mode
 */
export function startServices(
  serviceNames: string[] = [],
  mode: ProcessMode = "prod"
): void {
  // Create log directories
  createLogDirectories();

  // Stop all services first
  stopAllServices();

  const services = getAvailableServices();
  const modeName = mode === "prod" ? "production" : mode;

  // If no services specified, start all services
  if (serviceNames.length === 0) {
    console.log(`Starting all services in ${modeName} mode...`);
    for (const service of services) {
      try {
        // Special case for admin service
        if (service.name === "admin") {
          console.log(
            `Starting ${service.fullName} directly with next dev in background...`
          );
          // Use nohup to run the process in the background
          execSync(
            `nohup bash -c 'cd ${service.path} && yarn run dotenv -e .env.local next dev > ${service.path}/logs/next.log 2>&1 &'`,
            { stdio: "ignore", cwd: root }
          );
          console.log(
            `${service.fullName} started in background. Check http://localhost:4052`
          );
        } else {
          const ecosystemConfigPath = path.join(
            service.path,
            "ecosystem.config.js"
          );
          if (fs.existsSync(ecosystemConfigPath)) {
            const processName = getProcessName(service, mode);
            execSync(
              `cd ${service.path} && npx pm2 start ecosystem.config.js --only ${processName}`,
              { stdio: "inherit", cwd: root }
            );
            console.log(`${service.fullName} started in ${modeName} mode.`);
          } else {
            console.log(
              `Skipping ${service.fullName}: ecosystem.config.js not found`
            );
          }
        }
      } catch (error) {
        console.error(`Error starting ${service.fullName}:`, error);
      }
    }
    console.log(
      `All services started in ${modeName} mode. Use 'yarn orb status' to check status or 'yarn orb logs' to view logs.`
    );
    return;
  }

  // Start only specified services
  for (const serviceName of serviceNames) {
    const matchingServices = findServicesByName(serviceName);

    if (matchingServices.length === 0) {
      console.log(`Unknown service: ${serviceName}`);
      continue;
    }

    for (const service of matchingServices) {
      try {
        // Special case for admin service
        if (service.name === "admin") {
          console.log(
            `Starting ${service.fullName} directly with next dev in background...`
          );
          // Use nohup to run the process in the background
          execSync(
            `nohup bash -c 'cd ${service.path} && yarn run dotenv -e .env.local next dev > ${service.path}/logs/next.log 2>&1 &'`,
            { stdio: "ignore", cwd: root }
          );
          console.log(
            `${service.fullName} started in background. Check http://localhost:4052`
          );
        } else {
          const processName = getProcessName(service, mode);
          execSync(
            `cd ${service.path} && npx pm2 start ecosystem.config.js --only ${processName}`,
            { stdio: "inherit", cwd: root }
          );
          console.log(`${service.fullName} started in ${modeName} mode.`);
        }
      } catch (error) {
        console.error(`Error starting ${service.fullName}:`, error);
      }
    }
  }

  console.log(
    `Use 'yarn orb status' to check status or 'yarn orb logs' to view logs.`
  );
}

/**
 * Restart services
 * @param serviceNames Array of service names to restart (empty for all services)
 * @param mode Process mode (if specified, only restart services in this mode)
 */
export function restartServices(
  serviceNames: string[] = [],
  mode?: ProcessMode
): void {
  const services = getAvailableServices();

  // If no services specified, restart all services
  if (serviceNames.length === 0) {
    console.log("Restarting all services...");
    try {
      execSync("npx pm2 restart all", { stdio: "inherit", cwd: root });
      console.log("All services restarted.");
    } catch (error) {
      console.error("Error restarting services:", error);
    }
    return;
  }

  // Restart only specified services
  for (const serviceName of serviceNames) {
    const matchingServices = findServicesByName(serviceName);

    if (matchingServices.length === 0) {
      console.log(`Unknown service: ${serviceName}`);
      continue;
    }

    for (const service of matchingServices) {
      try {
        if (mode) {
          // Restart only the specified mode
          const processName = getProcessName(service, mode);
          execSync(`npx pm2 restart ${processName} 2>/dev/null || true`, {
            stdio: "inherit",
            cwd: root,
          });
          console.log(`${service.fullName} (${mode} mode) restarted.`);
        } else {
          // Restart all modes
          const processNames = [
            service.prodName,
            service.watchName,
            service.debugName,
          ].join(" ");
          execSync(`npx pm2 restart ${processNames} 2>/dev/null || true`, {
            stdio: "inherit",
            cwd: root,
          });
          console.log(`${service.fullName} (all modes) restarted.`);
        }
      } catch (error) {
        console.error(`Error restarting ${service.fullName}:`, error);
      }
    }
  }

  console.log("Use 'yarn orb status' to check status.");
}

/**
 * Stop and delete services
 * @param serviceNames Array of service names to stop and delete (empty for all services)
 * @param mode Process mode (if specified, only stop and delete services in this mode)
 */
export function downServices(
  serviceNames: string[] = [],
  mode?: ProcessMode
): void {
  const services = getAvailableServices();

  // If no services specified, stop and delete all services
  if (serviceNames.length === 0) {
    console.log(`Stopping and deleting all ${monorepoName} services...`);
    try {
      // Get list of running PM2 processes
      const pmList = execSync("npx pm2 jlist", { encoding: "utf8", cwd: root });
      const processes = JSON.parse(pmList);

      // Filter processes by monorepo prefix
      const monorepoProcesses = processes
        .filter((p: any) => p.name.startsWith(`${monorepoName}/`))
        .map((p: any) => p.name);

      if (monorepoProcesses.length > 0) {
        // Stop and delete only processes with the monorepo prefix
        const processNames = monorepoProcesses.join(" ");
        execSync(`npx pm2 stop ${processNames} 2>/dev/null || true`, {
          stdio: "inherit",
          cwd: root,
        });
        execSync(`npx pm2 delete ${processNames} 2>/dev/null || true`, {
          stdio: "inherit",
          cwd: root,
        });
        console.log(`All ${monorepoName} services stopped and deleted.`);
      } else {
        console.log(`No running ${monorepoName} services found.`);
      }
    } catch (error) {
      console.error("Error stopping and deleting services:", error);
    }
    return;
  }

  // Stop and delete only specified services
  for (const serviceName of serviceNames) {
    const matchingServices = findServicesByName(serviceName);

    if (matchingServices.length === 0) {
      console.log(`Unknown service: ${serviceName}`);
      continue;
    }

    for (const service of matchingServices) {
      try {
        if (mode) {
          // Stop and delete only the specified mode
          const processName = getProcessName(service, mode);
          execSync(`npx pm2 stop ${processName} 2>/dev/null || true`, {
            stdio: "inherit",
            cwd: root,
          });
          execSync(`npx pm2 delete ${processName} 2>/dev/null || true`, {
            stdio: "inherit",
            cwd: root,
          });
          console.log(
            `${service.fullName} (${mode} mode) stopped and deleted.`
          );
        } else {
          // Stop and delete all modes
          const processNames = [
            service.prodName,
            service.watchName,
            service.debugName,
          ].join(" ");
          execSync(`npx pm2 stop ${processNames} 2>/dev/null || true`, {
            stdio: "inherit",
            cwd: root,
          });
          execSync(`npx pm2 delete ${processNames} 2>/dev/null || true`, {
            stdio: "inherit",
            cwd: root,
          });
          console.log(`${service.fullName} (all modes) stopped and deleted.`);
        }
      } catch (error) {
        console.error(
          `Error stopping and deleting ${service.fullName}:`,
          error
        );
      }
    }
  }

  console.log("Specified services stopped and deleted.");
}

/**
 * View logs for services
 * @param serviceNames Array of service names to view logs for (empty for all services)
 * @param watch Whether to stream logs continuously
 */
export function viewServiceLogs(
  serviceNames: string[] = [],
  watch: boolean = false
): void {
  const services = getAvailableServices();

  // Get running PM2 processes
  let runningProcesses: string[] = [];
  try {
    // Get list of running PM2 processes
    const pmList = execSync("npx pm2 jlist", { encoding: "utf8", cwd: root });
    const processes = JSON.parse(pmList);
    runningProcesses = processes
      .filter((p: any) => p.pm2_env.status === "online")
      .map((p: any) => p.name);
  } catch (error) {
    console.error("Error getting PM2 process list:", error);
  }

  // If no services specified, view logs for all services
  if (serviceNames.length === 0) {
    try {
      // Use PM2 logs command for all services
      execSync(
        `npx pm2 logs ${watch ? "--lines 200" : "--lines 200 --nostream"}`,
        {
          stdio: "inherit",
          cwd: root,
        }
      );
    } catch (error) {
      console.error("Error viewing logs:", error);
    }
    return;
  }

  // View logs for specified services
  let processNames: string[] = [];

  for (const serviceName of serviceNames) {
    const matchingServices = findServicesByName(serviceName);

    if (matchingServices.length === 0) {
      console.log(`Unknown service: ${serviceName}`);
      continue;
    }

    for (const service of matchingServices) {
      // Only add process names that are actually running
      const possibleNames = [
        service.prodName,
        service.watchName,
        service.debugName,
      ];

      const runningNames = possibleNames.filter((name) =>
        runningProcesses.includes(name)
      );

      if (runningNames.length > 0) {
        // If running processes found, only show logs for those
        processNames.push(...runningNames);
      } else {
        // If no running processes found, add all possible names as fallback
        processNames.push(...possibleNames);
      }
    }
  }

  if (processNames.length > 0) {
    // Use PM2 logs command with specific process names
    const command = `npx pm2 logs ${processNames.join(" ")} ${
      watch ? "--lines 200" : "--lines 200 --nostream"
    }`;

    try {
      // Execute the command with inherit stdio to see the output
      execSync(command, { stdio: "inherit", cwd: root });
    } catch (error) {
      console.error("Error viewing logs:", error);
    }
  } else {
    console.log("No valid services specified.");
  }
}

/**
 * Display service information in a formatted way
 * @param services Array of services to display
 */
export function displayServiceInfo(services: ServiceInfo[]): void {
  console.log("\nAvailable services:");
  console.log("------------------");

  // Group by type
  const servicesByType = services.reduce(
    (acc, service) => {
      acc[service.type] = acc[service.type] || [];
      acc[service.type].push(service);
      return acc;
    },
    {} as Record<string, ServiceInfo[]>
  );

  // Display services
  if (servicesByType.service) {
    console.log("\nServices:");
    servicesByType.service.forEach((service) => {
      console.log(`  - ${service.name} (${service.fullName})`);
    });
  }

  if (servicesByType.client) {
    console.log("\nClients:");
    servicesByType.client.forEach((client) => {
      console.log(`  - ${client.name} (${client.fullName})`);
    });
  }

  console.log("");
}

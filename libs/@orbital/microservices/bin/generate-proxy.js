#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { program } = require("commander");

program
  .description("Generate proxy services from AsyncAPI spec")
  .requiredOption("-i, --input <file>", "AsyncAPI spec file")
  .requiredOption("-o, --output <dir>", "Output directory")
  .option("-s, --service <name>", "Service name", "world")
  .option(
    "--nats-client-token <token>",
    "NATS client injection token",
    "NATS_CLIENT"
  )
  .parse(process.argv);

const options = program.opts();

// Read the AsyncAPI spec
console.log(`Reading AsyncAPI spec from: ${options.input}`);
const asyncApiSpec = JSON.parse(fs.readFileSync(options.input, "utf8"));

// Create output directory if it doesn't exist
if (!fs.existsSync(options.output)) {
  fs.mkdirSync(options.output, { recursive: true });
}

// Extract controller names and their methods from the channels
const controllers = {};

Object.keys(asyncApiSpec.channels).forEach((channelName) => {
  // Parse the channel name to extract controller and method
  // Format: service.ControllerName.methodName
  const parts = channelName.split(".");
  if (parts.length !== 3) {
    console.warn(`Skipping channel with unexpected format: ${channelName}`);
    return;
  }

  const serviceName = parts[0];
  const controllerName = parts[1];
  const methodName = parts[2];

  // Initialize controller if not exists
  if (!controllers[controllerName]) {
    controllers[controllerName] = {
      serviceName,
      methods: [],
    };
  }

  // Get request and response message schemas
  const channel = asyncApiSpec.channels[channelName];
  const requestMessage = channel.subscribe?.message;
  const responseMessage = channel.publish?.message;

  // Add method to controller
  controllers[controllerName].methods.push({
    name: methodName,
    channelName,
    requestMessage,
    responseMessage,
  });
});

// Group controllers by service name
const serviceControllers = {};

Object.keys(controllers).forEach((controllerName) => {
  const controller = controllers[controllerName];
  const serviceName = controller.serviceName;

  if (!serviceControllers[serviceName]) {
    serviceControllers[serviceName] = [];
  }

  serviceControllers[serviceName].push({
    name: controllerName,
    ...controller,
  });
});

// Generate a microservice file for each service
Object.keys(serviceControllers).forEach((serviceName) => {
  const serviceControllersArray = serviceControllers[serviceName];

  // Collect imports needed
  const imports = new Set([
    `import { Injectable, Inject } from '@nestjs/common';`,
    `import { ClientProxy } from '@nestjs/microservices';`,
    `import { Microservice } from '@orbital/microservices';`,
  ]);

  // Map controller names to their model types
  const controllerModelMap = new Map();
  const modelTypes = new Set();
  const dtoTypes = new Set();
  const coreTypes = new Set();

  // First pass: group channels by controller and determine model types
  Object.keys(asyncApiSpec.channels).forEach((channelName) => {
    const parts = channelName.split(".");
    if (parts.length !== 3) return;

    const serviceName = parts[0];
    const controllerName = parts[1];
    const methodName = parts[2];

    // Extract controller base name (without Controller suffix)
    const controllerBaseName = controllerName.replace(
      /Controller$|MicroserviceController$/,
      ""
    );

    // Determine the entity name from the controller name
    // e.g., "AreasMicroserviceController" -> "Area"
    const entityName = controllerBaseName.replace(/s$/, "");

    // Store the model type for this controller
    controllerModelMap.set(controllerName, `${entityName}Model`);

    // Add to the set of model types
    modelTypes.add(`${entityName}Model`);

    // Check for DTOs
    if (methodName.startsWith("create")) {
      dtoTypes.add(`Create${entityName}Dto`);
    } else if (methodName.startsWith("update")) {
      dtoTypes.add(`Update${entityName}Dto`);
    }

    // Add core types needed
    if (entityName === "Area") {
      coreTypes.add("Position");
    }
  });

  // Add model imports
  if (modelTypes.size > 0) {
    imports.add(
      `import { ${Array.from(modelTypes).join(
        ", "
      )} } from '@orbital/typegoose';`
    );
  }

  // Add core type imports
  if (coreTypes.size > 0) {
    imports.add(
      `import { ${Array.from(coreTypes).join(", ")} } from '@orbital/core';`
    );
  }

  // Generate DTO type definitions
  let typeDefinitions = `/**
 * DTO Type Definitions
 * These are included directly in the proxy file to make it self-contained
 */

`;

  // Generate DTO interfaces
  dtoTypes.forEach((dtoType) => {
    if (dtoType === "CreateAreaDto") {
      typeDefinitions += `/**
 * Create Area DTO interface - for creating a new area
 */
export interface ${dtoType} {
  name: string;
  description: string;
  position: Position;
  worldId: string;
  parentId?: string | null;
  landmarks?: string[];
  connections?: string[];
  tags?: string[];
}

`;
    } else if (dtoType === "UpdateAreaDto") {
      typeDefinitions += `/**
 * Update Area DTO interface - for updating an existing area
 */
export interface ${dtoType} {
  name?: string;
  description?: string;
  position?: Position;
  worldId?: string;
  parentId?: string | null;
  landmarks?: string[];
  connections?: string[];
  tags?: string[];
}

`;
    } else {
      // Generic DTO interface for other entity types
      const entityName = dtoType
        .replace(/^(Create|Update)/, "")
        .replace("Dto", "");
      const isCreate = dtoType.startsWith("Create");

      typeDefinitions += `/**
 * ${dtoType} interface
 */
export interface ${dtoType} {
  ${
    isCreate ? "" : "// All fields are optional for update DTOs\n  "
  }[key: string]: any;
}

`;
    }
  });

  // Start building the microservice class
  let microserviceContent =
    Array.from(imports).join("\n") +
    `\n\n${typeDefinitions}
/**
 * Controller interfaces
 */
`;

  // Generate interfaces for each controller
  serviceControllersArray.forEach((controller) => {
    const controllerName = controller.name;
    const controllerBaseName = controllerName.replace(
      /Controller$|MicroserviceController$/,
      ""
    );

    // Determine the entity name from the controller name
    // e.g., "AreasMicroserviceController" -> "Area"
    const entityName = controllerBaseName.replace(/s$/, "");
    // Ensure first letter is capitalized
    const capitalizedEntityName =
      entityName.charAt(0).toUpperCase() + entityName.slice(1);

    microserviceContent += `
interface ${
      controllerBaseName.charAt(0).toUpperCase() + controllerBaseName.slice(1)
    }Controller {`;

    controller.methods.forEach((method) => {
      // Determine parameter and return types based on AsyncAPI spec
      let paramType = "any";
      let returnType = "any";
      let paramName = "payload";

      // Get request and response message schemas
      const channel = asyncApiSpec.channels[method.channelName];
      const requestPayload = channel.subscribe?.message?.payload;
      const responsePayload = channel.publish?.message?.payload;

      // Determine parameter type and name from request payload
      if (requestPayload && requestPayload.type === "object") {
        const properties = requestPayload.properties || {};
        const propNames = Object.keys(properties);

        if (propNames.length === 0) {
          // No parameters
          paramType = "void";
          paramName = "";
        } else if (propNames.length === 1) {
          // Single parameter
          paramName = propNames[0];

          // Try to determine parameter type
          const prop = properties[paramName];
          if (prop.type === "string") {
            paramType = "string";
            if (paramName.endsWith("Id") && prop.nullable) {
              paramType += " | null";
            }
          } else if (prop.type === "array") {
            if (prop.items?.type === "string") {
              paramType = "string[]";
            } else {
              paramType = "any[]";
            }
          } else if (prop.type === "object") {
            // Try to infer DTO type from method name
            if (method.name.startsWith("create")) {
              // Get entity name from controller name
              const entityName = controllerBaseName.replace(/s$/, "");
              // Ensure first letter is capitalized
              const capitalizedEntityName =
                entityName.charAt(0).toUpperCase() + entityName.slice(1);
              paramType = `Create${capitalizedEntityName}Dto`;
            } else if (method.name.startsWith("update")) {
              // Get entity name from controller name
              const entityName = controllerBaseName.replace(/s$/, "");
              // Ensure first letter is capitalized
              const capitalizedEntityName =
                entityName.charAt(0).toUpperCase() + entityName.slice(1);
              paramType = `Update${capitalizedEntityName}Dto`;
            } else {
              paramType = "any";
            }
          } else {
            paramType = prop.type || "any";
          }
        } else {
          // Multiple parameters - create an object type
          paramType =
            "{ " +
            propNames
              .map((name) => {
                const prop = properties[name];
                let type = "any";

                if (prop.type === "string") {
                  type = "string";
                } else if (prop.type === "object") {
                  // Try to infer DTO type
                  const entityName = controllerBaseName.replace(/s$/, "");
                  // Ensure first letter is capitalized
                  const capitalizedEntityName =
                    entityName.charAt(0).toUpperCase() + entityName.slice(1);
                  if (name.includes("update")) {
                    type = `Update${capitalizedEntityName}Dto`;
                  } else if (name.includes("create")) {
                    type = `Create${capitalizedEntityName}Dto`;
                  } else {
                    type = "any";
                  }
                }

                return `${name}: ${type}`;
              })
              .join("; ") +
            " }";
        }
      }

      // Determine return type from response payload
      if (responsePayload) {
        // Get the model type for this controller
        const modelType = controllerModelMap.get(controllerName) || "any";

        if (responsePayload.type === "array") {
          returnType = `${modelType}[]`;
        } else if (responsePayload.type === "object") {
          returnType = modelType;

          // Add nullable if specified
          if (responsePayload.nullable) {
            returnType += " | null";
          }
        }
      }

      // Generate method signature for interface
      const methodParams =
        paramType === "void" ? "" : `${paramName}: ${paramType}`;

      // For all return types that don't already include null, add null as a possible return type
      // to match what Microservice.request can return
      let interfaceReturnType = returnType;
      if (!returnType.includes("null")) {
        interfaceReturnType = `${returnType} | null`;
      }

      microserviceContent += `
  ${method.name}(${methodParams}): Promise<${interfaceReturnType}>;`;
    });

    microserviceContent += `
}
`;
  });

  // Generate the main microservice class
  const capitalizedServiceName =
    serviceName.charAt(0).toUpperCase() + serviceName.slice(1);

  microserviceContent += `
@Injectable()
export class ${capitalizedServiceName}Microservice extends Microservice {`;

  // Add controller properties
  serviceControllersArray.forEach((controller) => {
    const controllerName = controller.name;
    const controllerBaseName = controllerName
      .replace(/Controller$|MicroserviceController$/, "")
      .toLowerCase();

    microserviceContent += `
  /**
   * ${controllerBaseName} controller proxy
   */
  public readonly ${controllerBaseName}: ${
      controllerBaseName.charAt(0).toUpperCase() + controllerBaseName.slice(1)
    }Controller;`;
  });

  // Add constructor
  microserviceContent += `

  constructor(@Inject('${options.natsClientToken}') client: ClientProxy) {
    super(client, '${serviceName}');
`;

  // Initialize controller properties in constructor
  serviceControllersArray.forEach((controller) => {
    const controllerName = controller.name;
    const controllerBaseName = controllerName
      .replace(/Controller$|MicroserviceController$/, "")
      .toLowerCase();

    microserviceContent += `
    // Initialize ${controllerBaseName} controller
    this.${controllerBaseName} = {`;

    controller.methods.forEach((method) => {
      // Determine parameter and return types based on AsyncAPI spec
      let paramType = "any";
      let returnType = "any";
      let paramName = "payload";

      // Get request and response message schemas
      const channel = asyncApiSpec.channels[method.channelName];
      const requestPayload = channel.subscribe?.message?.payload;
      const responsePayload = channel.publish?.message?.payload;

      // Determine parameter type and name from request payload
      if (requestPayload && requestPayload.type === "object") {
        const properties = requestPayload.properties || {};
        const propNames = Object.keys(properties);

        if (propNames.length === 0) {
          // No parameters
          paramType = "void";
          paramName = "";
        } else if (propNames.length === 1) {
          // Single parameter
          paramName = propNames[0];

          // Try to determine parameter type
          const prop = properties[paramName];
          if (prop.type === "string") {
            paramType = "string";
            if (paramName.endsWith("Id") && prop.nullable) {
              paramType += " | null";
            }
          } else if (prop.type === "array") {
            if (prop.items?.type === "string") {
              paramType = "string[]";
            } else {
              paramType = "any[]";
            }
          } else if (prop.type === "object") {
            // Try to infer DTO type from method name
            if (method.name.startsWith("create")) {
              // Get entity name from controller name
              const entityName = controllerBaseName.replace(/s$/, "");
              // Ensure first letter is capitalized
              const capitalizedEntityName =
                entityName.charAt(0).toUpperCase() + entityName.slice(1);
              paramType = `Create${capitalizedEntityName}Dto`;
            } else if (method.name.startsWith("update")) {
              // Get entity name from controller name
              const entityName = controllerBaseName.replace(/s$/, "");
              // Ensure first letter is capitalized
              const capitalizedEntityName =
                entityName.charAt(0).toUpperCase() + entityName.slice(1);
              paramType = `Update${capitalizedEntityName}Dto`;
            } else {
              paramType = "any";
            }
          } else {
            paramType = prop.type || "any";
          }
        } else {
          // Multiple parameters - create an object type
          paramType =
            "{ " +
            propNames
              .map((name) => {
                const prop = properties[name];
                let type = "any";

                if (prop.type === "string") {
                  type = "string";
                } else if (prop.type === "object") {
                  // Try to infer DTO type
                  const entityName = controllerBaseName.replace(/s$/, "");
                  // Ensure first letter is capitalized
                  const capitalizedEntityName =
                    entityName.charAt(0).toUpperCase() + entityName.slice(1);
                  if (name.includes("update")) {
                    type = `Update${capitalizedEntityName}Dto`;
                  } else if (name.includes("create")) {
                    type = `Create${capitalizedEntityName}Dto`;
                  } else {
                    type = "any";
                  }
                }

                return `${name}: ${type}`;
              })
              .join("; ") +
            " }";
        }
      }

      // Determine return type from response payload
      if (responsePayload) {
        // Get the model type for this controller
        const modelType = controllerModelMap.get(controllerName) || "any";

        if (responsePayload.type === "array") {
          returnType = `${modelType}[]`;
        } else if (responsePayload.type === "object") {
          returnType = modelType;

          // Add nullable if specified
          if (responsePayload.nullable) {
            returnType += " | null";
          }
        }
      }

      // Generate method implementation
      const methodParams =
        paramType === "void" ? "" : `${paramName}: ${paramType}`;
      const methodArgs = paramType === "void" ? "" : paramName;

      // For array returns, handle null by returning an empty array
      let implementationCode;
      if (returnType.includes("[]") && !returnType.includes("null")) {
        implementationCode = `
      ${method.name}: ${
          methodParams ? `async (${methodParams})` : "async ()"
        } => {
        const result = await this.request<${returnType}>('${
          method.channelName
        }'${methodArgs ? `, ${methodArgs}` : ""});
        return result || [];
      },`;
      } else {
        // For other types, just return the result directly
        implementationCode = `
      ${method.name}: ${
          methodParams ? `async (${methodParams})` : "async ()"
        } => {
        return this.request<${returnType}>('${method.channelName}'${
          methodArgs ? `, ${methodArgs}` : ""
        });
      },`;
      }

      microserviceContent += implementationCode;
    });

    microserviceContent += `
    };`;
  });

  // Close constructor and class
  microserviceContent += `
  }
}
`;

  // Write microservice file
  const outputFile = path.join(
    options.output,
    `${serviceName}.microservice.ts`
  );
  fs.writeFileSync(outputFile, microserviceContent);
  console.log(`Generated microservice: ${outputFile}`);

  // Generate and write index.ts file
  const indexFile = path.join(options.output, "index.ts");
  // Use the existing capitalizedServiceName variable that was defined earlier

  const indexContent = `// Auto-generated index file
export * from './${serviceName}.microservice';
export { ${capitalizedServiceName}Microservice as default } from './${serviceName}.microservice';
`;

  fs.writeFileSync(indexFile, indexContent);
  console.log(`Generated index file: ${indexFile}`);
});

console.log("Microservice generation completed!");

#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { program } = require("commander");
const ts = require("typescript");

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
  .option(
    "--src-dir <dir>",
    "Source directory to analyze controller files",
    "src"
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

// Function to find controller source files
function findControllerFiles(serviceName, controllerNames) {
  const srcDir = path.resolve(process.cwd(), options.srcDir);
  const controllerFiles = {};
  const controllerPattern = /\.controller\.ts$/;
  const microserviceControllerPattern = /\.microservice\.controller\.ts$/;

  // Function to recursively search for controller files
  function searchDir(dir) {
    const files = fs.readdirSync(dir);

    for (const file of files) {
      const filePath = path.join(dir, file);
      const stat = fs.statSync(filePath);

      if (stat.isDirectory()) {
        searchDir(filePath);
      } else if (
        (controllerPattern.test(file) ||
          microserviceControllerPattern.test(file)) &&
        controllerNames.some((name) =>
          file.includes(
            name
              .replace(/Controller$|MicroserviceController$/, "")
              .toLowerCase()
          )
        )
      ) {
        const content = fs.readFileSync(filePath, "utf8");
        const controllerName = controllerNames.find((name) =>
          file.includes(
            name
              .replace(/Controller$|MicroserviceController$/, "")
              .toLowerCase()
          )
        );

        if (controllerName) {
          controllerFiles[controllerName] = {
            path: filePath,
            content,
          };
        }
      }
    }
  }

  searchDir(srcDir);
  return controllerFiles;
}

// Function to parse TypeScript source and extract method parameter types
function extractMethodTypes(sourceContent) {
  const sourceFile = ts.createSourceFile(
    "temp.ts",
    sourceContent,
    ts.ScriptTarget.Latest,
    true
  );

  const methodTypes = {};
  const imports = [];

  // Function to visit nodes and extract method information
  function visit(node) {
    // Extract imports
    if (ts.isImportDeclaration(node)) {
      const importText = node.getText(sourceFile);
      imports.push(importText);
    }

    // Extract method declarations
    if (ts.isMethodDeclaration(node) && node.name) {
      const methodName = node.name.getText(sourceFile);

      // Extract parameter types
      const parameters = [];
      if (node.parameters) {
        node.parameters.forEach((param) => {
          const paramName = param.name.getText(sourceFile);
          let paramType = "any";

          if (param.type) {
            paramType = param.type.getText(sourceFile);
          }

          parameters.push({
            name: paramName,
            type: paramType,
          });
        });
      }

      // Extract return type
      let returnType = "any";
      if (node.type) {
        returnType = node.type.getText(sourceFile);
      }

      methodTypes[methodName] = {
        parameters,
        returnType,
      };
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);

  return { methodTypes, imports };
}

// Function to analyze imports and determine external vs internal types
function analyzeImports(imports) {
  const externalImports = new Map();
  const internalImports = new Set();

  imports.forEach((importStr) => {
    // Extract the module path
    const match = importStr.match(/from\s+['"]([^'"]+)['"]/);
    if (match) {
      const modulePath = match[1];

      // Check if it's an external module (starts with @)
      if (modulePath.startsWith("@")) {
        // Extract imported types
        const typesMatch = importStr.match(
          /import\s+(?:{([^}]+)}|type\s+{([^}]+)})/
        );
        if (typesMatch) {
          const types = (typesMatch[1] || typesMatch[2])
            .split(",")
            .map((t) => t.trim());

          // Store by module path to avoid duplicates
          if (!externalImports.has(modulePath)) {
            externalImports.set(modulePath, new Set());
          }

          types.forEach((type) => {
            // Handle "as" aliases
            const typeName = type.split(" as ")[0].trim();
            externalImports.get(modulePath).add(typeName);
          });
        }
      } else {
        internalImports.add(importStr);
      }
    }
  });

  return { externalImports, internalImports };
}

// Generate a microservice file for each service
Object.keys(serviceControllers).forEach((serviceName) => {
  const serviceControllersArray = serviceControllers[serviceName];

  // Find controller source files
  const controllerNames = serviceControllersArray.map(
    (controller) => controller.name
  );
  const controllerFiles = findControllerFiles(serviceName, controllerNames);

  // Extract method types and imports from controller files
  const controllerMethodTypes = {};
  const allImports = [];

  Object.keys(controllerFiles).forEach((controllerName) => {
    const { methodTypes, imports } = extractMethodTypes(
      controllerFiles[controllerName].content
    );
    controllerMethodTypes[controllerName] = methodTypes;
    allImports.push(...imports);
  });

  // Analyze imports to determine external vs internal types
  const { externalImports, internalImports } = analyzeImports(allImports);

  // Build necessary imports
  const imports = new Set([
    `import { Injectable, Inject } from '@nestjs/common';`,
    `import { ClientProxy } from '@nestjs/microservices';`,
  ]);
  // Add Microservice for class extension
  imports.add(`import { Microservice } from '@orbital/microservices';`);

  const skipModules = new Set([
    "@nestjs/common",
    "@nestjs/microservices",
    "@orbital/microservices",
    "@orbital/contracts",
    "@orbital/nest",
  ]);
  // Dynamically import only used types from external modules
  externalImports.forEach((types, modulePath) => {
    if (skipModules.has(modulePath)) return;
    const typeList = Array.from(types).filter(Boolean).join(", ");
    if (typeList) {
      imports.add(`import { ${typeList} } from '${modulePath}';`);
    }
  });

  // Map controller names to their model types
  const controllerModelMap = new Map();

  // First pass: group channels by controller and determine model types
  Object.keys(asyncApiSpec.channels).forEach((channelName) => {
    const parts = channelName.split(".");
    if (parts.length !== 3) return;

    const serviceName = parts[0];
    const controllerName = parts[1];

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
  });

  // Generate internal type definitions for types that are not imported from external libraries
  let typeDefinitions = `/**
 * Type Definitions
 * These are included directly in the proxy file to make it self-contained
 */

`;

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
      // Get method types from extracted controller information
      const methodInfo = controllerMethodTypes[controllerName]?.[method.name];

      // Default parameter and return types
      let paramType = "any";
      let returnType = "any";
      let paramName = "payload";

      // Use extracted method types if available
      if (methodInfo) {
        // Handle parameters
        if (methodInfo.parameters.length === 0) {
          paramType = "void";
          paramName = "";
        } else if (methodInfo.parameters.length === 1) {
          paramName = methodInfo.parameters[0].name;
          paramType = methodInfo.parameters[0].type;
        } else {
          // Multiple parameters - create an object type
          paramType =
            "{ " +
            methodInfo.parameters
              .map((p) => `${p.name}: ${p.type}`)
              .join("; ") +
            " }";
        }

        // Handle return type
        returnType = methodInfo.returnType.replace(/Promise<(.+)>/, "$1");
      } else {
        // Fallback to AsyncAPI spec if method types not found
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
              // Try to infer type from method name
              if (method.name.startsWith("create")) {
                // Use Partial<Entity> for create methods
                paramType = `Partial<${capitalizedEntityName}>`;
              } else if (method.name.startsWith("update")) {
                // Use Partial<Entity> for update methods
                paramType = `Partial<${capitalizedEntityName}>`;
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
                    // Try to infer type
                    if (name.includes("update")) {
                      type = `Partial<${capitalizedEntityName}>`;
                    } else if (name.includes("create")) {
                      type = `Partial<${capitalizedEntityName}>`;
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
      // Get method types from extracted controller information
      const methodInfo = controllerMethodTypes[controllerName]?.[method.name];

      // Default parameter and return types
      let paramType = "any";
      let returnType = "any";
      let paramName = "payload";

      // Use extracted method types if available
      if (methodInfo) {
        // Handle parameters
        if (methodInfo.parameters.length === 0) {
          paramType = "void";
          paramName = "";
        } else if (methodInfo.parameters.length === 1) {
          paramName = methodInfo.parameters[0].name;
          paramType = methodInfo.parameters[0].type;
        } else {
          // Multiple parameters - create an object type
          paramType =
            "{ " +
            methodInfo.parameters
              .map((p) => `${p.name}: ${p.type}`)
              .join("; ") +
            " }";
        }

        // Handle return type
        returnType = methodInfo.returnType.replace(/Promise<(.+)>/, "$1");
      } else {
        // Fallback to AsyncAPI spec if method types not found
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
              // Try to infer type from method name
              if (method.name.startsWith("create")) {
                // Use Partial<Entity> for create methods
                paramType = `Partial<${capitalizedEntityName}>`;
              } else if (method.name.startsWith("update")) {
                // Use Partial<Entity> for update methods
                paramType = `Partial<${capitalizedEntityName}>`;
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
                    // Try to infer type
                    if (name.includes("update")) {
                      type = `Partial<${capitalizedEntityName}>`;
                    } else if (name.includes("create")) {
                      type = `Partial<${capitalizedEntityName}>`;
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

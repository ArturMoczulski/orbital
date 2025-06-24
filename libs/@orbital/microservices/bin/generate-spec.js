#!/usr/bin/env node
/**
 * CLI to generate AsyncAPI JSON from a NestJS service.
 *
 * Usage:
 *   orbital-ms-spec \
 *     --entry path/to/dist/main.js \
 *     --out path/to/asyncapi.json \
 *     --title "Service Name" \
 *     [--version "1.0.0"]
 */
const { program } = require("commander");
const path = require("path");
// Load environment variables from the package's own .env.local
const dotenv = require("dotenv");
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
const { NestFactory } = require("@nestjs/core");
const { AsyncApiModule, AsyncApiDocumentBuilder } = require("nestjs-asyncapi");
const fs = require("fs");

program
  .requiredOption("-e, --entry <file>", "Path to compiled module entry")
  .requiredOption("-o, --out <file>", "Output AsyncAPI JSON file")
  .requiredOption("-t, --title <title>", "AsyncAPI document title")
  .option("-v, --version <ver>", "AsyncAPI document version", "1.0.0")
  .parse(process.argv);

const opts = program.opts();

// Load environment variables from the target service directory
const entryAbs = path.resolve(process.cwd(), opts.entry);
const serviceDir = path.resolve(path.dirname(entryAbs), "..");
dotenv.config({ path: path.resolve(serviceDir, ".env.local") });
dotenv.config({ path: path.resolve(serviceDir, ".env") });

(async () => {
  // Dynamically load the Nest module
  const entryPath = path.resolve(process.cwd(), opts.entry);
  let mod;
  try {
    mod = require(entryPath);
  } catch {
    // If entry bootstraps server, load the compiled AppModule instead
    const appModulePath = entryPath.replace(
      /dist\/main\.js$/,
      "dist/app.module.js"
    );
    mod = require(appModulePath);
  }
  const AppModule = mod.AppModule || mod.default || mod;

  // Bootstrap the Nest application
  const app = await NestFactory.create(AppModule);

  // Build AsyncAPI document
  const doc = new AsyncApiDocumentBuilder()
    .setTitle(opts.title)
    .setDescription(opts.title + " API Documentation")
    .setVersion(opts.version)
    .setDefaultContentType("application/json")
    .addServer("nats", {
      url: process.env.NATS_URL || "nats://localhost:4222",
      protocol: "nats",
    })
    .setLicense("MIT", "https://opensource.org/licenses/MIT")
    .setContact("Orbital Team", "https://example.com", "info@example.com")
    .build();

  // Create full AsyncAPI document by scanning the application
  const initialDoc = doc;
  const fullDoc = await AsyncApiModule.createDocument(app, initialDoc, {
    include: [AppModule],
  });

  // Add required fields to make the spec valid
  fullDoc.asyncapi = "2.6.0"; // Update to latest version
  fullDoc.id =
    "https://example.com/apis/" + opts.title.toLowerCase().replace(/\s+/g, "-");

  // Manually add channels based on our custom decorators
  // This is needed because nestjs-asyncapi doesn't recognize our custom decorators
  const controllers = app
    .get(require("@nestjs/core").DiscoveryService)
    .getControllers();

  // Find controllers with our MicroserviceController decorator
  const msControllers = controllers.filter((wrapper) =>
    Reflect.getMetadata("ms:service", wrapper.metatype)
  );

  fullDoc.channels = fullDoc.channels || {};

  // For each controller, extract methods with MessagePattern
  for (const controller of msControllers) {
    const serviceName = Reflect.getMetadata("ms:service", controller.metatype);
    const controllerName = controller.metatype.name;

    // Get all methods from the controller prototype
    const prototype = Object.getPrototypeOf(controller.instance);
    const methodNames = Object.getOwnPropertyNames(prototype).filter(
      (prop) => typeof prototype[prop] === "function" && prop !== "constructor"
    );

    for (const methodName of methodNames) {
      // Skip methods that don't have MessagePattern decorator
      // Since we can't easily detect this, we'll include all methods for now
      const subject = `${serviceName}.${controllerName}.${methodName}`;

      // Try to extract parameter and return type information
      const method = prototype[methodName];
      const paramTypes =
        Reflect.getMetadata("design:paramtypes", prototype, methodName) || [];
      const returnType = Reflect.getMetadata(
        "design:returntype",
        prototype,
        methodName
      );

      // Get method parameter names through function toString() parsing
      const methodStr = method.toString();
      const paramNames = extractParameterNames(methodStr);

      // Create request payload schema based on parameter types
      const requestPayload = createRequestPayload(
        methodName,
        paramNames,
        paramTypes
      );

      // Create response payload schema based on return type
      const responsePayload = createResponsePayload(methodName, returnType);

      // Add channel to AsyncAPI spec
      fullDoc.channels[subject] = {
        subscribe: {
          summary: `${methodName} operation`,
          operationId: methodName,
          message: {
            name: methodName,
            title: `${methodName} message`,
            contentType: "application/json",
            payload: requestPayload,
          },
        },
        publish: {
          summary: `${methodName} response`,
          operationId: `${methodName}Response`,
          message: {
            name: `${methodName}Response`,
            title: `${methodName} response message`,
            contentType: "application/json",
            payload: responsePayload,
          },
        },
      };
    }
  }

  // Write the AsyncAPI document directly to file
  const outPath = path.resolve(process.cwd(), opts.out);
  fs.writeFileSync(outPath, JSON.stringify(fullDoc, null, 2));
  console.log(`AsyncAPI spec written to ${outPath}`);

  await app.close();
  process.exit(0);
})().catch((err) => {
  console.error(err);
  process.exit(1);
});

/**
 * Extract parameter names from a function string representation
 * @param {string} fnStr - Function string representation
 * @returns {string[]} - Array of parameter names
 */
function extractParameterNames(fnStr) {
  // Extract the parameter list from the function string
  const paramListMatch = fnStr.match(/\(([^)]*)\)/);
  if (!paramListMatch) return [];

  const paramList = paramListMatch[1].trim();
  if (!paramList) return [];

  // Split by comma and clean up each parameter name
  return paramList.split(",").map((param) => {
    // Remove type annotations, default values, etc.
    const cleanParam = param.trim().split(":")[0].split("=")[0].trim();
    return cleanParam;
  });
}

/**
 * Create request payload schema based on parameter types
 * @param {string} methodName - Method name
 * @param {string[]} paramNames - Parameter names
 * @param {Function[]} paramTypes - Parameter types
 * @returns {Object} - AsyncAPI schema object
 */
function createRequestPayload(methodName, paramNames, paramTypes) {
  const payload = {
    type: "object",
    properties: {},
  };

  // Special case handling based on method name patterns
  if (methodName.startsWith("create")) {
    // For create methods, assume DTO parameter
    payload.properties = {
      // Use the first parameter name or a default
      [paramNames[0] || "createDto"]: {
        type: "object",
        description: `Create DTO for ${methodName}`,
      },
    };
  } else if (methodName.startsWith("update")) {
    // For update methods, typically has id and updateDto
    payload.properties = {
      id: {
        type: "string",
        description: "Resource identifier",
      },
      updateDto: {
        type: "object",
        description: `Update DTO for ${methodName}`,
      },
    };
  } else if (
    methodName.startsWith("delete") ||
    (methodName.startsWith("get") && methodName.includes("By"))
  ) {
    // For delete or getBy methods, typically has an id or filter parameter
    const paramName = paramNames[0] || "id";
    payload.properties[paramName] = {
      type: paramName.includes("Id")
        ? "string"
        : paramName.includes("tags")
        ? "array"
        : "string",
      description: `Filter parameter for ${methodName}`,
    };

    // If it's an array type, add items schema
    if (payload.properties[paramName].type === "array") {
      payload.properties[paramName].items = {
        type: "string",
      };
    }
  } else if (methodName.startsWith("getAll")) {
    // For getAll methods, typically no parameters
    // Leave properties empty
  } else {
    // For other methods, use parameter names if available
    paramNames.forEach((name, index) => {
      const paramType = paramTypes[index];
      let type = "object";

      // Try to determine type from parameter name
      if (name.includes("id") || name.includes("Id")) {
        type = "string";
      } else if (name.includes("count") || name.includes("Count")) {
        type = "integer";
      } else if (name.includes("is") || name.includes("has")) {
        type = "boolean";
      } else if (name.includes("date") || name.includes("Date")) {
        type = "string";
        // Add format for date-time
        payload.properties[name] = {
          type,
          format: "date-time",
          description: `Parameter ${name} for ${methodName}`,
        };
        return;
      }

      payload.properties[name] = {
        type,
        description: `Parameter ${name} for ${methodName}`,
      };
    });
  }

  return payload;
}

/**
 * Create response payload schema based on return type
 * @param {string} methodName - Method name
 * @param {Function} returnType - Return type
 * @returns {Object} - AsyncAPI schema object
 */
function createResponsePayload(methodName, returnType) {
  const payload = {
    type: "object",
    properties: {},
  };

  // Determine response type based on method name patterns
  if (
    methodName.startsWith("getAll") ||
    methodName.includes("All") ||
    methodName.includes("By")
  ) {
    // For getAll or methods that return collections
    payload.type = "array";
    payload.items = {
      type: "object",
      description: `Item in the ${methodName} response collection`,
    };
  } else if (methodName.startsWith("create")) {
    // For create methods, return the created resource
    payload.description = `Created resource from ${methodName}`;
  } else if (
    methodName.startsWith("update") ||
    methodName.startsWith("delete") ||
    methodName.startsWith("get")
  ) {
    // For update, delete, or get methods, may return null
    payload.nullable = true;
    payload.description = `Resource from ${methodName}, may be null if not found`;
  }

  return payload;
}

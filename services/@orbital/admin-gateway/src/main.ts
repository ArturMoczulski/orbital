import { NestFactory } from "@nestjs/core";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { MicroserviceExceptionFilter } from "@orbital/microservices";
import * as dotenv from "dotenv";
import * as fs from "fs";
import * as path from "path";
import { AppModule } from "./app.module";
import { RpcExceptionFilter } from "./filters/rpc-exception.filter";
import { GlobalExceptionHandler } from "./global-exception.handler";

// Register global exception handlers
GlobalExceptionHandler.register();

async function bootstrap() {
  dotenv.config({ path: "../.env.local" });
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: "*", // Allow all origins for development
      methods: "GET,HEAD,PUT,PATCH,POST,DELETE", // Allow common methods
      allowedHeaders: "Content-Type,Accept,Authorization", // Allow common headers
      preflightContinue: false,
      optionsSuccessStatus: 204,
    },
  });

  // Apply global exception filters
  app.useGlobalFilters(
    new MicroserviceExceptionFilter(),
    new RpcExceptionFilter()
  );

  console.log(
    "MicroserviceExceptionFilter and RpcExceptionFilter registered globally in admin-gateway"
  );

  // Setup Swagger
  const config = new DocumentBuilder()
    .setTitle("Admin Gateway API")
    .setDescription(
      "The Admin Gateway API provides access to administrative functions"
    )
    .setVersion("1.0")
    .addTag("admin")
    .addTag("areas")
    .build();

  const document = SwaggerModule.createDocument(app, config as any);
  // Export OpenAPI spec to file for RTK Query codegen
  fs.writeFileSync(
    path.resolve(__dirname, "..", "openapi.json"),
    JSON.stringify(document, null, 2)
  );

  // Save the OpenAPI spec to a file for codegen
  fs.writeFileSync("openapi.json", JSON.stringify(document, null, 2));

  // Setup Swagger UI
  SwaggerModule.setup("api-docs", app, document);

  await app.listen(parseInt(process.env.PORT || "5001", 10));
  console.log(`Application is running on: ${await app.getUrl()}`);
  console.log(
    `Swagger documentation available at: ${await app.getUrl()}/api-docs`
  );
  console.log(`Connected to NATS for microservice communication`);
}

bootstrap();

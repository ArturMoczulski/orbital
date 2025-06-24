import "reflect-metadata";
import * as dotenv from "dotenv";
import * as fs from "fs";
import { NestFactory } from "@nestjs/core";
import { SwaggerModule, DocumentBuilder } from "@nestjs/swagger";
import { patchNestJsSwagger } from "nestjs-zod";
import { AppModule } from "./app.module";

async function bootstrap() {
  dotenv.config({ path: "../.env.local" });
  const app = await NestFactory.create(AppModule, { cors: true });

  // Patch NestJS Swagger to work with Zod schemas
  patchNestJsSwagger();

  // Setup Swagger
  const config = new DocumentBuilder()
    .setTitle("World API")
    .setDescription(
      "The World API provides access to areas, maps, and other world-related resources"
    )
    .setVersion("1.0")
    .addTag("areas")
    .build();

  const document = SwaggerModule.createDocument(app, config);

  // Save the OpenAPI spec to a file for codegen
  fs.writeFileSync("openapi.json", JSON.stringify(document, null, 2));

  // Setup Swagger UI
  SwaggerModule.setup("api-docs", app, document);

  await app.listen(parseInt(process.env.PORT || "5000", 10));
  console.log(`World service running on: ${await app.getUrl()}`);
  console.log(
    `Swagger documentation available at: ${await app.getUrl()}/api-docs`
  );
}

bootstrap();

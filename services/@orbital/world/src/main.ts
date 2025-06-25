import "reflect-metadata";
import * as dotenv from "dotenv";
import { NestFactory } from "@nestjs/core";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { AppModule } from "./app.module";
import { MicroserviceExceptionFilter } from "@orbital/microservices";

async function bootstrap() {
  dotenv.config({ path: "../.env.local" });

  // Create the NestJS application
  const app = await NestFactory.create(AppModule, { cors: true });

  // Connect to NATS for microservice communication
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.NATS,
    options: {
      servers: [process.env.NATS_URL || "nats://localhost:4222"],
      name: "world-service",
      // Enable NATS Service Framework for service discovery
      headers: {
        "nats.service.name": "world",
        "nats.service.version": "1.0.0",
      },
    },
  });

  // Apply global exception filter for RPC exceptions
  // app.useGlobalFilters(new MicroserviceExceptionFilter());

  // Start both HTTP and microservice interfaces
  await app.startAllMicroservices();
  await app.listen(parseInt(process.env.PORT || "5000", 10));

  console.log(`World service running on: ${await app.getUrl()}`);
  console.log(`World microservice connected to NATS`);
}

bootstrap();

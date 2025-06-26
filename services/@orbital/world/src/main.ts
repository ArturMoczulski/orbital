import { NestFactory } from "@nestjs/core";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { PassThroughRpcExceptionFilter } from "@orbital/microservices";
import * as dotenv from "dotenv";
import "reflect-metadata";
import { AppModule } from "./app.module";

async function bootstrap() {
  dotenv.config({ path: "../.env.local" });

  // Create the NestJS application
  const app = await NestFactory.create(AppModule, { cors: true });

  // Apply global exception filter
  app.useGlobalFilters(new PassThroughRpcExceptionFilter("world"));

  // Connect to NATS for microservice communication
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.NATS,
    options: {
      servers: [process.env.NATS_URL || "nats://localhost:4222"],
      name: "world",
      // Enable NATS Service Framework for service discovery
      headers: {
        "nats.service.name": "world",
        "nats.service.version": "1.0.0",
      },
    },
  });

  // Start both HTTP and microservice interfaces
  await app.startAllMicroservices();
  await app.listen(parseInt(process.env.PORT || "5000", 10));

  console.log(`World service running on: ${await app.getUrl()}`);
  console.log(`World microservice connected to NATS`);
}

bootstrap();

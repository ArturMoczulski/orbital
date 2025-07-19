import { NestFactory } from "@nestjs/core";
import { MicroserviceOptions, Transport } from "@nestjs/microservices";
import { OrbitalMicroservices } from "@orbital/contracts";
import { PassThroughRpcExceptionFilter } from "@orbital/microservices";
import * as dotenv from "dotenv";
import "reflect-metadata";
import { AppModule } from "./app.module";

// Load environment variables from .env.local
dotenv.config({ path: "../.env.local" });

async function bootstrap() {
  // Create the NestJS application
  const app = await NestFactory.create(AppModule, { cors: true });

  // Apply global exception filter
  app.useGlobalFilters(
    new PassThroughRpcExceptionFilter(OrbitalMicroservices.World)
  );

  // Connect to NATS for microservice communication
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.NATS,
    options: {
      servers: [process.env.NATS_URL || "nats://localhost:4223"],
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

  // Handle process signals for clean shutdown
  const signals = ["SIGINT", "SIGTERM", "SIGUSR2"];
  signals.forEach((signal) => {
    process.on(signal, async () => {
      console.log(`Received ${signal}, shutting down gracefully...`);
      try {
        await app.close();
        console.log("Application closed successfully");
        process.exit(0);
      } catch (err) {
        console.error("Error during shutdown:", err);
        process.exit(1);
      }
    });
  });

  // Handle debugger cleanup on exit
  process.on("exit", () => {
    console.log("Process exiting, cleaning up debugger connections");
  });

  // Handle uncaught exceptions
  process.on("uncaughtException", (err) => {
    console.error("Uncaught exception:", err);
    process.exit(1);
  });

  // Handle unhandled promise rejections
  process.on("unhandledRejection", (reason) => {
    console.error("Unhandled rejection:", reason);
    process.exit(1);
  });

  // Signal to PM2 that the application is ready
  if (process.send) {
    process.send("ready");
  }
}

bootstrap();

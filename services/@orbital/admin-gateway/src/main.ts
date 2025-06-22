import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import * as dotenv from "dotenv";

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
  await app.listen(parseInt(process.env.PORT || "5001", 10));
  console.log(`Application is running on: ${await app.getUrl()}`);
}

bootstrap();

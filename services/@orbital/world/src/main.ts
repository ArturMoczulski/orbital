import "reflect-metadata";
import * as dotenv from "dotenv";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  dotenv.config({ path: "../.env.local" });
  const app = await NestFactory.create(AppModule, { cors: true });
  await app.listen(parseInt(process.env.PORT || "5000", 10));
  console.log(`World service running on: ${await app.getUrl()}`);
}

bootstrap();

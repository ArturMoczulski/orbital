import { Module } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { MicroserviceManagerService } from "./microservice-manager.service";

@Module({
  imports: [
    ClientsModule.register([
      {
        name: "NATS_SERVER",
        transport: Transport.NATS,
        options: {
          servers: ["nats://nats-server:4222"],
        },
      },
    ]),
  ],
  providers: [MicroserviceManagerService],
})
export class MicroserviceManagerModule {}

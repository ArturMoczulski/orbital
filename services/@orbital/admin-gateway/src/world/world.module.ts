import { Module } from "@nestjs/common";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { WorldMicroservice } from "./world.microservice";

@Module({
  imports: [
    ClientsModule.register([
      {
        name: "WORLD_SERVICE",
        transport: Transport.NATS,
        options: {
          servers: [process.env.NATS_URL || "nats://localhost:4222"],
        },
      },
    ]),
  ],
  providers: [
    {
      provide: WorldMicroservice,
      useFactory: (client) => new WorldMicroservice(client),
      inject: ["WORLD_SERVICE"],
    },
  ],
  exports: [WorldMicroservice],
})
export class WorldModule {}

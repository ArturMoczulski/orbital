import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { MicroserviceManagerService } from "@orbital/microservices";
import { DatabaseModule } from "./database.module";
import { CharactersModule } from "./characters/characters.module";
import { WorldsModule } from "./worlds/worlds.module";
import { AreasModule } from "./areas/areas.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env.local",
      expandVariables: true,
    }),
    EventEmitterModule.forRoot(),
    ClientsModule.register([
      {
        name: "NATS_CLIENT",
        transport: Transport.NATS,
        options: {
          servers: [process.env.NATS_URL || "nats://localhost:4222"],
        },
      },
    ]),
    DatabaseModule,
    CharactersModule,
    WorldsModule,
    AreasModule,
  ],
  providers: [
    {
      provide: "NatsConnection",
      useFactory: async () => {
        const { connect } = await import("nats");
        return connect({
          servers: process.env.NATS_URL || "nats://localhost:4222",
        });
      },
    },
    MicroserviceManagerService,
  ],
})
export class AppModule {}

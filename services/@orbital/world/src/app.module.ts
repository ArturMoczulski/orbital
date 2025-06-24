import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { EventEmitter2 } from "@nestjs/event-emitter";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { DiscoveryModule, DiscoveryService } from "@nestjs/core";
import { MetadataScanner } from "@nestjs/core";
import { Reflector } from "@nestjs/core";
import {
  MicroserviceManagerModule,
  MicroserviceManagerService,
} from "@orbital/microservices";
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
    DiscoveryModule,
    ClientsModule.registerAsync([
      {
        name: "NATS_CLIENT",
        imports: [ConfigModule],
        useFactory: (configService: ConfigService) => ({
          transport: Transport.NATS,
          options: {
            servers: [
              configService.get<string>("NATS_URL", "nats://localhost:4222"),
            ],
          },
        }),
        inject: [ConfigService],
      },
    ]),
    DatabaseModule,
    CharactersModule,
    WorldsModule,
    AreasModule,
  ],
  providers: [EventEmitter2, MetadataScanner, Reflector, DiscoveryService],
})
export class AppModule {}

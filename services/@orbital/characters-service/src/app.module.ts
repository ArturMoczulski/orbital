import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import {
  APP_FILTER,
  DiscoveryModule,
  DiscoveryService,
  MetadataScanner,
  Reflector,
} from "@nestjs/core";
import { EventEmitter2, EventEmitterModule } from "@nestjs/event-emitter";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { OrbitalMicroservices } from "@orbital/contracts";
import { PassThroughRpcExceptionFilter } from "@orbital/microservices";
import { AreasModule } from "./areas/areas.module";
import { ConversationsModule } from "./conversations/conversations.module";
import { DatabaseModule } from "./database.module";
import { WorldsModule } from "./worlds/worlds.module";

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
              configService.get<string>("NATS_URL", "nats://localhost:4223"),
            ],
          },
        }),
        inject: [ConfigService],
      },
    ]),
    DatabaseModule,
    WorldsModule,
    AreasModule,
    ConversationsModule,
  ],
  providers: [
    EventEmitter2,
    MetadataScanner,
    Reflector,
    DiscoveryService,
    {
      provide: APP_FILTER,
      useFactory: () => {
        return new PassThroughRpcExceptionFilter(OrbitalMicroservices.World);
      },
    },
  ],
})
export class AppModule {}

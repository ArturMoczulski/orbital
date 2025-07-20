import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import {
  DiscoveryModule,
  DiscoveryService,
  MetadataScanner,
  Reflector,
} from "@nestjs/core";
import { EventEmitter2, EventEmitterModule } from "@nestjs/event-emitter";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { CharactersModule } from "./characters/characters.module";
import { ConversationsModule } from "./conversations/conversations.module";
import { DatabaseModule } from "./database.module";
import { IdentitiesModule } from "./identities/identities.module";

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
    ConversationsModule,
    IdentitiesModule,
    CharactersModule,
  ],
  providers: [EventEmitter2, MetadataScanner, Reflector, DiscoveryService],
})
export class AppModule {}

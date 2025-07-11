import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { MongooseModule } from "@nestjs/mongoose";
import { AreasModule } from "./areas/areas.module";
import { AuthModule } from "./auth/auth.module";
import { CharactersModule } from "./characters/characters.module";
import { LoggingInterceptor } from "./common/logging.interceptor";
import { IdentitiesModule } from "./identities/identities.module";
import { PingController } from "./ping/ping.controller";
import { UsersModule } from "./users/users.module";
import { WorldsModule } from "./worlds/worlds.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === "test" ? ".env.test" : ".env.local",
      expandVariables: true,
    }),
    EventEmitterModule.forRoot(),
    MongooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        uri: configService.get<string>("ADMIN_DB_URI"),
      }),
      inject: [ConfigService],
    }),
    // Register NATS client globally for microservice communication
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
    AuthModule,
    UsersModule,
    AreasModule,
    WorldsModule,
    IdentitiesModule,
    CharactersModule,
  ],
  controllers: [PingController],
  providers: [
    // Global logging interceptor
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule {}

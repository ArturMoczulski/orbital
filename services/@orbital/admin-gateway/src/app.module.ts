import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { EventEmitterModule } from "@nestjs/event-emitter";
import { MongooseModule } from "@nestjs/mongoose";
import { MicroserviceManagerService } from "@orbital/microservices";
import { PingController } from "./ping/ping.controller";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
import { AreasModule } from "./areas/areas.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env.local",
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
    AuthModule,
    UsersModule,
    AreasModule,
  ],
  controllers: [PingController],
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

import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { WorldMicroservice } from "@orbital/world-rpc";
import { IdentitiesController } from "./identities.controller";
import { IdentitiesService } from "./identities.service";

@Module({
  imports: [
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
  ],
  controllers: [IdentitiesController],
  providers: [
    IdentitiesService,
    {
      provide: WorldMicroservice,
      useFactory: (client) => new WorldMicroservice(client),
      inject: ["NATS_CLIENT"],
    },
  ],
})
export class IdentitiesModule {}

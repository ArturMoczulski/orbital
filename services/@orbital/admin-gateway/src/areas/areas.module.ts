import { Module } from "@nestjs/common";
import { AreasController } from "./areas.controller";
import { AreasService } from "./areas.service";
import { WorldMicroservice } from "@orbital/world-rpc";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { ConfigModule, ConfigService } from "@nestjs/config";

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
  controllers: [AreasController],
  providers: [
    AreasService,
    {
      provide: WorldMicroservice,
      useFactory: (client) => new WorldMicroservice(client),
      inject: ["NATS_CLIENT"],
    },
  ],
})
export class AreasModule {}

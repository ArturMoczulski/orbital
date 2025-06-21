import { Module } from "@nestjs/common";
import { PingController } from "./ping/ping.controller";
import { ClientsModule, Transport } from "@nestjs/microservices";
import { MongooseModule } from "@nestjs/mongoose";
import { AuthModule } from "./auth/auth.module";
import { UsersModule } from "./users/users.module";
@Module({
  imports: [
    MongooseModule.forRoot(process.env.KILOAXE_SERVICES_GATEWAY_MONGO_URI!),
    AuthModule,
    UsersModule,
    ClientsModule.register([
      {
        name: "WORLD_SERVICE",
        transport: Transport.NATS,
        options: { servers: [process.env.NATS_URL || "nats://nats:4222"] },
      },
    ]),
  ],
  controllers: [PingController],
  providers: [],
})
export class AppModule {}

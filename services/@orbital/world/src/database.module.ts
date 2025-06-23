import { Module, Global } from "@nestjs/common";
import { TypegooseModule } from "nestjs-typegoose";
import { ConfigModule, ConfigService } from "@nestjs/config";

@Global()
@Module({
  imports: [
    TypegooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const uri = configService.get<string>("WORLD_DB_URI");
        if (!uri) {
          throw new Error("WORLD_DB_URI environment variable is not set");
        }
        return {
          uri,
          useNewUrlParser: true,
          useUnifiedTopology: true,
        } as any;
      },
      inject: [ConfigService],
    }),
  ],
  exports: [TypegooseModule],
})
export class DatabaseModule {}

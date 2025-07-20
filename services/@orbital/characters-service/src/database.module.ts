import { Global, Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { TypegooseModule } from "nestjs-typegoose";

@Global()
@Module({
  imports: [
    TypegooseModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => {
        const uri = configService.get<string>("CHARACTERS_DB_URI");
        if (!uri) {
          throw new Error("CHARACTERS_DB_URI environment variable is not set");
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

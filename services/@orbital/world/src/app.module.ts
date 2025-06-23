import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
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
    DatabaseModule,
    CharactersModule,
    WorldsModule,
    AreasModule,
  ],
})
export class AppModule {}

import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DatabaseModule } from "./database.module";
import { CharactersModule } from "./characters/characters.module";
import { LocationsModule } from "./locations/locations.module";
import { WorldsModule } from "./worlds/worlds.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: ".env.local",
      expandVariables: true,
    }),
    DatabaseModule,
    CharactersModule,
    LocationsModule,
    WorldsModule,
  ],
})
export class AppModule {}

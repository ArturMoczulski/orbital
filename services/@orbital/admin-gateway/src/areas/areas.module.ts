import { Module } from "@nestjs/common";
import { AreasController } from "./areas.controller";
import { AreasService } from "./areas.service";
import { WorldModule } from "../world/world.module";

@Module({
  imports: [WorldModule],
  controllers: [AreasController],
  providers: [AreasService],
})
export class AreasModule {}

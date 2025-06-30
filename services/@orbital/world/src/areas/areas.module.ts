import { Module } from "@nestjs/common";
import { AreaModel as Area } from "@orbital/typegoose";
import { TypegooseModule } from "nestjs-typegoose";

@Module({
  imports: [
    TypegooseModule.forFeature([
      { typegooseClass: Area, schemaOptions: { collection: "areas" } },
    ]),
  ],
  providers: [],
})
export class AreasModule {}

import { Module, Global } from "@nestjs/common";
import { TypegooseModule } from "nestjs-typegoose";

@Global()
@Module({
  imports: [
    TypegooseModule.forRoot(
      process.env.MONGODB_URI || "mongodb://localhost:27017/kiloaxe",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      } as any
    ),
  ],
  exports: [TypegooseModule],
})
export class DatabaseModule {}

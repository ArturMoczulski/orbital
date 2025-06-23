import { Test } from "@nestjs/testing";
import { AreasModule } from "./areas.module";
import { AreasController } from "./areas.controller";
import { AreasService } from "./areas.service";
import { AreasRepository } from "./areas.repository";
import { getModelToken } from "nestjs-typegoose";

describe("AreasModule", () => {
  it("should compile the module", async () => {
    const module = await Test.createTestingModule({
      imports: [AreasModule],
    })
      .overrideProvider(getModelToken("AreaModel"))
      .useValue({})
      .compile();

    expect(module).toBeDefined();
    expect(module.get(AreasController)).toBeInstanceOf(AreasController);
    expect(module.get(AreasService)).toBeInstanceOf(AreasService);
    expect(module.get(AreasRepository)).toBeInstanceOf(AreasRepository);
  });
});

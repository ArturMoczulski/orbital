import { Test } from "@nestjs/testing";
import { Area } from "@orbital/typegoose";
import { getModelToken } from "nestjs-typegoose";
import { AreasMicroserviceController } from "./areas.microservice.controller";
import { AreasModule } from "./areas.module";
import { AreasRepository } from "./areas.repository";
import { AreasService } from "./areas.service";

describe("AreasModule", () => {
  it("should compile the module", async () => {
    const module = await Test.createTestingModule({
      imports: [AreasModule],
    })
      .overrideProvider(getModelToken(Area.name))
      .useValue({})
      .compile();

    expect(module).toBeDefined();
    expect(module.get(AreasMicroserviceController)).toBeInstanceOf(
      AreasMicroserviceController
    );
    expect(module.get(AreasService)).toBeInstanceOf(AreasService);
    expect(module.get(AreasRepository)).toBeInstanceOf(AreasRepository);
  });
});

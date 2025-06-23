import { Test, TestingModule } from "@nestjs/testing";
import { getModelToken } from "nestjs-typegoose";
import { LocationsRepository } from "./locations.repository";
import { LocationModel } from "@orbital/typegoose";

describe("LocationsRepository", () => {
  let repository: LocationsRepository;
  let model: any;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        LocationsRepository,
        {
          provide: getModelToken("Location"),
          useValue: {},
        },
      ],
    }).compile();

    repository = module.get<LocationsRepository>(LocationsRepository);
    model = module.get(getModelToken("Location"));
  });

  it("repository should be defined", () => {
    expect(repository).toBeDefined();
  });

  it("model should be defined", () => {
    expect(model).toBeDefined();
  });
});

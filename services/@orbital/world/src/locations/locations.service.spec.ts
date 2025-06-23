import { LocationsService } from "./locations.service";
import { LocationsRepository } from "./locations.repository";
import { LocationModel } from "@orbital/typegoose";

describe("Location Service and Repository", () => {
  let service: LocationsService;
  let repository: LocationsRepository;

  beforeAll(() => {
    // Initialize repository and service with a dummy model
    repository = new LocationsRepository(undefined as any);
    service = new LocationsService(repository);
  });

  it("should instantiate the service", () => {
    expect(service).toBeDefined();
  });

  it("should load the LocationModel class", () => {
    expect(LocationModel).toBeDefined();
  });
});

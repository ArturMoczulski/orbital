import { Test, TestingModule } from "@nestjs/testing";
import { IdentityAccount } from "@orbital/identity-types";
import { CRUDService } from "@orbital/nest";
import { IdentitiesCRUDService } from "./identities.crud.service";
import { IdentitiesRepository } from "./identities.repository";

describe("IdentitiesCRUDService", () => {
  let service: IdentitiesCRUDService;
  let repository: IdentitiesRepository;

  beforeEach(async () => {
    // Create a mock repository
    const mockRepository = {
      findByCharacterId: jest.fn(),
      // Add other repository methods that might be used
      findById: jest.fn(),
      find: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    // Create a test module with the service and mock repository
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        IdentitiesCRUDService,
        {
          provide: IdentitiesRepository,
          useValue: mockRepository,
        },
      ],
    }).compile();

    // Get the service and repository from the test module
    service = module.get<IdentitiesCRUDService>(IdentitiesCRUDService);
    repository = module.get<IdentitiesRepository>(IdentitiesRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  it("should be an instance of CRUDService", () => {
    expect(service).toBeInstanceOf(CRUDService);
  });

  describe("findByCharacterId", () => {
    it("should call repository.findByCharacterId with the correct parameters", async () => {
      // Arrange
      const characterId = "test-character-id";
      const projection = { provider: 1, identifier: 1 };
      const options = { sort: { provider: 1 } };

      // Create mock identity accounts
      const expectedResult = [
        {
          _id: "identity-id-1",
          characterId,
          provider: "local",
          identifier: "user1",
          credentials: [],
        },
        {
          _id: "identity-id-2",
          characterId,
          provider: "google",
          identifier: "user2@gmail.com",
          credentials: [],
        },
      ] as unknown as IdentityAccount[];

      // Mock the repository method
      jest
        .spyOn(repository, "findByCharacterId")
        .mockResolvedValue(expectedResult);

      // Act
      const result = await service.findByCharacterId(
        characterId,
        projection,
        options
      );

      // Assert
      expect(repository.findByCharacterId).toHaveBeenCalledWith(
        characterId,
        projection,
        options
      );
      expect(result).toEqual(expectedResult);
    });

    it("should call repository.findByCharacterId with default parameters when not provided", async () => {
      // Arrange
      const characterId = "test-character-id";
      const expectedResult = [] as unknown as IdentityAccount[];

      // Mock the repository method
      jest
        .spyOn(repository, "findByCharacterId")
        .mockResolvedValue(expectedResult);

      // Act
      const result = await service.findByCharacterId(characterId);

      // Assert
      expect(repository.findByCharacterId).toHaveBeenCalledWith(
        characterId,
        undefined,
        undefined
      );
      expect(result).toEqual(expectedResult);
    });
  });

  // Since IdentitiesCRUDService extends CRUDService, we don't need to test
  // all the inherited methods as they are tested in crud.service.spec.ts
  // We just need to ensure our custom methods work correctly
});

import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { WorldMicroservice } from "@orbital/world-rpc";
import supertest from "supertest";
import { IdentitiesController } from "./identities.controller";
import { IdentitiesService } from "./identities.service";

// Create a mock for the WorldMicroservice
const mockWorldMicroservice = {
  identities: {
    find: jest.fn(),
    findById: jest.fn(),
    findByCharacterId: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  },
};

describe("IdentitiesController (e2e)", () => {
  let app: INestApplication;

  beforeEach(async () => {
    jest.clearAllMocks();

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [IdentitiesController],
      providers: [
        IdentitiesService,
        {
          provide: WorldMicroservice,
          useValue: mockWorldMicroservice,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe("GET /identities", () => {
    it("should return all identity accounts", async () => {
      // Mock data
      const mockIdentities = [
        {
          _id: "identity1",
          provider: "local",
          identifier: "user1",
          characterId: "char1",
        },
        {
          _id: "identity2",
          provider: "google",
          identifier: "user2",
          characterId: "char2",
        },
      ];

      // Setup mock implementation
      mockWorldMicroservice.identities.find.mockResolvedValue(mockIdentities);

      // Execute
      const response = await supertest(app.getHttpServer()).get("/identities");

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockIdentities);
      expect(mockWorldMicroservice.identities.find).toHaveBeenCalledTimes(1);
    });

    it("should filter by characterId when query parameter is provided", async () => {
      // Mock data
      const characterId = "char1";
      const mockIdentities = [
        {
          _id: "identity1",
          provider: "local",
          identifier: "user1",
          characterId,
        },
      ];

      // Setup mock implementation
      mockWorldMicroservice.identities.findByCharacterId.mockResolvedValue(
        mockIdentities
      );

      // Execute
      const response = await supertest(app.getHttpServer()).get(
        `/identities?characterId=${characterId}`
      );

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockIdentities);
      expect(
        mockWorldMicroservice.identities.findByCharacterId
      ).toHaveBeenCalledTimes(1);
      expect(
        mockWorldMicroservice.identities.findByCharacterId
      ).toHaveBeenCalledWith({
        characterId,
        projection: {},
        options: {},
      });
    });
  });

  describe("GET /identities/:_id", () => {
    it("should return a single identity account", async () => {
      // Mock data
      const identityId = "identity1";
      const mockIdentity = {
        _id: identityId,
        provider: "local",
        identifier: "user1",
        characterId: "char1",
      };

      // Setup mock implementation
      mockWorldMicroservice.identities.findById.mockResolvedValue(mockIdentity);

      // Execute
      const response = await supertest(app.getHttpServer()).get(
        `/identities/${identityId}`
      );

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual(mockIdentity);
      expect(mockWorldMicroservice.identities.findById).toHaveBeenCalledTimes(
        1
      );
      expect(mockWorldMicroservice.identities.findById).toHaveBeenCalledWith({
        id: identityId,
        projection: {},
      });
    });

    it("should return 404 when identity account is not found", async () => {
      // Setup mock implementation
      mockWorldMicroservice.identities.findById.mockResolvedValue(null);

      // Execute
      const response = await supertest(app.getHttpServer()).get(
        "/identities/nonexistent"
      );

      // Assert
      expect(response.status).toBe(404);
      expect(mockWorldMicroservice.identities.findById).toHaveBeenCalledTimes(
        1
      );
    });
  });

  describe("POST /identities", () => {
    it("should create a new identity account", async () => {
      // Mock data
      const createIdentityDto = {
        provider: "local",
        identifier: "user1",
        characterId: "char1",
      };
      const createdIdentity = {
        _id: "identity1",
        ...createIdentityDto,
      };

      // Setup mock implementation
      mockWorldMicroservice.identities.create.mockResolvedValue(
        createdIdentity
      );

      // Execute
      const response = await supertest(app.getHttpServer())
        .post("/identities")
        .send(createIdentityDto);

      // Assert
      expect(response.status).toBe(201);
      expect(response.body).toEqual(createdIdentity);
      expect(mockWorldMicroservice.identities.create).toHaveBeenCalledTimes(1);
      expect(mockWorldMicroservice.identities.create).toHaveBeenCalledWith(
        createIdentityDto
      );
    });
  });

  describe("PUT /identities/:_id", () => {
    it("should update an existing identity account", async () => {
      // Mock data
      const identityId = "identity1";
      const updateIdentityDto = {
        provider: "updated-provider",
      };
      const updatedIdentity = {
        _id: identityId,
        provider: "updated-provider",
        identifier: "user1",
        characterId: "char1",
      };

      // Setup mock implementation
      mockWorldMicroservice.identities.update.mockResolvedValue(
        updatedIdentity
      );

      // Execute
      const response = await supertest(app.getHttpServer())
        .put(`/identities/${identityId}`)
        .send(updateIdentityDto);

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual(updatedIdentity);
      expect(mockWorldMicroservice.identities.update).toHaveBeenCalledTimes(1);
      expect(mockWorldMicroservice.identities.update).toHaveBeenCalledWith({
        _id: identityId,
        ...updateIdentityDto,
      });
    });
  });

  describe("DELETE /identities/:_id", () => {
    it("should delete an identity account", async () => {
      // Mock data
      const identityId = "identity1";
      const deletedIdentity = {
        _id: identityId,
        provider: "local",
        identifier: "user1",
        characterId: "char1",
      };

      // Setup mock implementation
      mockWorldMicroservice.identities.delete.mockResolvedValue(
        deletedIdentity
      );

      // Execute
      const response = await supertest(app.getHttpServer()).delete(
        `/identities/${identityId}`
      );

      // Assert
      expect(response.status).toBe(200);
      expect(response.body).toEqual(deletedIdentity);
      expect(mockWorldMicroservice.identities.delete).toHaveBeenCalledTimes(1);
      expect(mockWorldMicroservice.identities.delete).toHaveBeenCalledWith(
        identityId
      );
    });
  });
});

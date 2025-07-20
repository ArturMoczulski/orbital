import { INestApplication } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import request from "supertest";
import { CharactersController } from "./characters.controller";
import { CharactersService } from "./characters.service";

describe("CharactersController (e2e)", () => {
  let app: INestApplication;
  let charactersServiceMock: any;

  beforeEach(async () => {
    // Create a mock for the CharactersService
    charactersServiceMock = {
      find: jest.fn(),
      findById: jest.fn(),
      findByLocationId: jest.fn(),
      findByWorldId: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };

    const moduleFixture: TestingModule = await Test.createTestingModule({
      controllers: [CharactersController],
      providers: [
        {
          provide: CharactersService,
          useValue: charactersServiceMock,
        },
      ],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe("GET /characters", () => {
    it("should return all characters", () => {
      const characters = [
        {
          _id: "1",
          firstName: "John",
          lastName: "Doe",
        },
        {
          _id: "2",
          firstName: "Jane",
          lastName: "Smith",
        },
      ];
      charactersServiceMock.find.mockResolvedValue(characters);

      return request(app.getHttpServer())
        .get("/characters")
        .expect(200)
        .expect(characters);
    });

    it("should filter by locationId when provided", () => {
      const characters = [
        {
          _id: "1",
          firstName: "John",
          lastName: "Doe",
          currentLocation: "location-1",
        },
      ];
      charactersServiceMock.findByLocationId.mockResolvedValue(characters);

      return request(app.getHttpServer())
        .get("/characters?locationId=location-1")
        .expect(200)
        .expect(characters);
    });

    it("should filter by worldId when provided", () => {
      const characters = [
        {
          _id: "1",
          firstName: "John",
          lastName: "Doe",
          worldId: "world-1",
        },
      ];
      charactersServiceMock.findByWorldId.mockResolvedValue(characters);

      return request(app.getHttpServer())
        .get("/characters?worldId=world-1")
        .expect(200)
        .expect(characters);
    });
  });

  describe("GET /characters/:_id", () => {
    it("should return a character by id", () => {
      const character = {
        _id: "1",
        firstName: "John",
        lastName: "Doe",
      };
      charactersServiceMock.findById.mockResolvedValue(character);

      return request(app.getHttpServer())
        .get("/characters/1")
        .expect(200)
        .expect(character);
    });

    it("should return 404 if character not found", () => {
      charactersServiceMock.findById.mockRejectedValue(
        new Error("Character not found")
      );

      return request(app.getHttpServer())
        .get("/characters/999")
        .expect(404)
        .expect({
          statusCode: 404,
          message: "Character with id 999 not found",
          error: "Not Found",
        });
    });
  });

  describe("POST /characters", () => {
    it("should create a new character", () => {
      const createCharacterDto = {
        firstName: "John",
        lastName: "Doe",
      };
      const createdCharacter = {
        _id: "1",
        ...createCharacterDto,
      };
      charactersServiceMock.create.mockResolvedValue(createdCharacter);

      return request(app.getHttpServer())
        .post("/characters")
        .send(createCharacterDto)
        .expect(201)
        .expect(createdCharacter);
    });
  });

  describe("PUT /characters/:_id", () => {
    it("should update a character", () => {
      const updateCharacterDto = {
        firstName: "Updated",
      };
      const updatedCharacter = {
        _id: "1",
        firstName: "Updated",
        lastName: "Doe",
      };
      charactersServiceMock.update.mockResolvedValue(updatedCharacter);

      return request(app.getHttpServer())
        .put("/characters/1")
        .send(updateCharacterDto)
        .expect(200)
        .expect(updatedCharacter);
    });
  });

  describe("DELETE /characters/:_id", () => {
    it("should delete a character", () => {
      charactersServiceMock.delete.mockResolvedValue(true);

      return request(app.getHttpServer()).delete("/characters/1").expect(200);
    });
  });
});

import { Test, TestingModule } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import request from "supertest";
import { AppModule } from "../app.module";
import { Area, Position } from "@orbital/core";
import { CreateAreaDto } from "./dto/create-area.dto";
import { UpdateAreaDto } from "./dto/update-area.dto";
import { getModelToken } from "@nestjs/mongoose";
import { AreaModel } from "@orbital/typegoose";
import { ConfigModule } from "@nestjs/config";

// Mock the Mongoose model
const mockAreaModel = {
  find: jest.fn(),
  findById: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
};

describe("Areas E2E", () => {
  let app: INestApplication;
  let mockArea: Area;
  let createdAreaId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: [".env.test", ".env.local"],
        }),
        AppModule,
      ],
    })
      .overrideProvider(getModelToken("AreaModel"))
      .useValue(mockAreaModel)
      .compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    await app.init();

    // Create a mock area for testing
    mockArea = Area.mock({
      name: "Test Area",
    });
    mockArea.description = "Test Description";
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("/areas (POST)", () => {
    it("should create a new area", async () => {
      // Arrange
      const createAreaDto: CreateAreaDto = {
        name: mockArea.name,
        description: mockArea.description,
        position: mockArea.position,
        worldId: "world123",
        tags: ["test", "area"],
      };

      const createdAreaModel = {
        _id: "area123",
        ...createAreaDto,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAreaModel.create.mockResolvedValue(createdAreaModel);

      // Act & Assert
      const response = await request(app.getHttpServer())
        .post("/areas")
        .send(createAreaDto)
        .expect(201);

      expect(response.body).toEqual(
        expect.objectContaining({
          _id: "area123",
          name: mockArea.name,
          description: mockArea.description,
        })
      );

      createdAreaId = response.body._id;
    });

    it("should validate the create area DTO", async () => {
      // Arrange
      const invalidDto = {
        // Missing required fields
        name: "",
        description: "Test Description",
      };

      // Act & Assert
      await request(app.getHttpServer())
        .post("/areas")
        .send(invalidDto)
        .expect(400);
    });
  });

  describe("/areas (GET)", () => {
    it("should return all areas", async () => {
      // Arrange
      const areas = [
        {
          _id: "area1",
          name: "Area 1",
          description: "Description 1",
          position: new Position({ x: 0, y: 0, z: 0 }),
          worldId: "world1",
          tags: ["test"],
        },
        {
          _id: "area2",
          name: "Area 2",
          description: "Description 2",
          position: new Position({ x: 1, y: 1, z: 1 }),
          worldId: "world1",
          tags: ["test"],
        },
      ];

      mockAreaModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(areas),
      });

      // Act & Assert
      const response = await request(app.getHttpServer())
        .get("/areas")
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0].name).toBe("Area 1");
      expect(response.body[1].name).toBe("Area 2");
    });
  });

  describe("/areas/:id (GET)", () => {
    it("should return a single area by ID", async () => {
      // Arrange
      const area = {
        _id: "area1",
        name: "Area 1",
        description: "Description 1",
        position: new Position({ x: 0, y: 0, z: 0 }),
        worldId: "world1",
        tags: ["test"],
      };

      mockAreaModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(area),
      });

      // Act & Assert
      const response = await request(app.getHttpServer())
        .get("/areas/area1")
        .expect(200);

      expect(response.body.name).toBe("Area 1");
      expect(response.body._id).toBe("area1");
    });

    it("should return 404 for non-existent area", async () => {
      // Arrange
      mockAreaModel.findById.mockReturnValue({
        exec: jest.fn().mockResolvedValue(null),
      });

      // Act & Assert
      await request(app.getHttpServer()).get("/areas/nonexistent").expect(404);
    });
  });

  describe("/areas/:id (PUT)", () => {
    it("should update an area", async () => {
      // Arrange
      const updateAreaDto: UpdateAreaDto = {
        name: "Updated Area",
        description: "Updated Description",
      };

      const updatedArea = {
        _id: "area1",
        name: "Updated Area",
        description: "Updated Description",
        position: new Position({ x: 0, y: 0, z: 0 }),
        worldId: "world1",
        tags: ["test"],
      };

      mockAreaModel.findByIdAndUpdate.mockReturnValue({
        exec: jest.fn().mockResolvedValue(updatedArea),
      });

      // Act & Assert
      const response = await request(app.getHttpServer())
        .put("/areas/area1")
        .send(updateAreaDto)
        .expect(200);

      expect(response.body.name).toBe("Updated Area");
      expect(response.body.description).toBe("Updated Description");
    });
  });

  describe("/areas/:id (DELETE)", () => {
    it("should delete an area", async () => {
      // Arrange
      const deletedArea = {
        _id: "area1",
        name: "Area 1",
        description: "Description 1",
      };

      mockAreaModel.findByIdAndDelete.mockReturnValue({
        exec: jest.fn().mockResolvedValue(deletedArea),
      });

      // Act & Assert
      const response = await request(app.getHttpServer())
        .delete("/areas/area1")
        .expect(200);

      expect(response.body._id).toBe("area1");
    });
  });

  describe("/areas/world/:worldId (GET)", () => {
    it("should return areas by worldId", async () => {
      // Arrange
      const areas = [
        {
          _id: "area1",
          name: "Area 1",
          description: "Description 1",
          worldId: "world1",
        },
        {
          _id: "area2",
          name: "Area 2",
          description: "Description 2",
          worldId: "world1",
        },
      ];

      mockAreaModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(areas),
      });

      // Act & Assert
      const response = await request(app.getHttpServer())
        .get("/areas/world/world1")
        .expect(200);

      expect(response.body).toHaveLength(2);
      expect(response.body[0].worldId).toBe("world1");
      expect(response.body[1].worldId).toBe("world1");
    });
  });

  describe("/areas/parent/:parentId (GET)", () => {
    it("should return areas by parentId", async () => {
      // Arrange
      const areas = [
        {
          _id: "area1",
          name: "Area 1",
          description: "Description 1",
          parentId: "parent1",
        },
      ];

      mockAreaModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(areas),
      });

      // Act & Assert
      const response = await request(app.getHttpServer())
        .get("/areas/parent/parent1")
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].parentId).toBe("parent1");
    });
  });

  describe("/areas/tags (GET)", () => {
    it("should return areas by tags", async () => {
      // Arrange
      const areas = [
        {
          _id: "area1",
          name: "Area 1",
          description: "Description 1",
          tags: ["tag1", "tag2"],
        },
      ];

      mockAreaModel.find.mockReturnValue({
        exec: jest.fn().mockResolvedValue(areas),
      });

      // Act & Assert
      const response = await request(app.getHttpServer())
        .get("/areas/tags?tags=tag1,tag2")
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(response.body[0].tags).toContain("tag1");
      expect(response.body[0].tags).toContain("tag2");
    });
  });
});

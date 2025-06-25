import { Test, TestingModule } from "@nestjs/testing";
import { AreasMicroserviceController } from "./areas.microservice.controller";
import { AreasService } from "./areas.service";
import { AreasRepository } from "./areas.repository";
import { AreasModule } from "./areas.module";
import { TypegooseModule } from "nestjs-typegoose";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { Area, Position } from "@orbital/core";
import { CreateAreaDto } from "./dto/create-area.dto";
import { UpdateAreaDto } from "./dto/update-area.dto";
import { getModelToken } from "@nestjs/mongoose";
import { AreaModel } from "@orbital/typegoose";

// Mock the Mongoose model
const mockAreaModel = {
  find: jest.fn(),
  findById: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  findByIdAndUpdate: jest.fn(),
  findByIdAndDelete: jest.fn(),
};

describe("Areas Integration", () => {
  let controller: AreasMicroserviceController;
  let service: AreasService;
  let repository: AreasRepository;
  let module: TestingModule;

  beforeEach(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: [".env.test", ".env.local"],
        }),
      ],
      controllers: [AreasMicroserviceController],
      providers: [
        AreasService,
        AreasRepository,
        {
          provide: getModelToken("AreaModel"),
          useValue: mockAreaModel,
        },
      ],
    }).compile();

    controller = module.get<AreasMicroserviceController>(
      AreasMicroserviceController
    );
    service = module.get<AreasService>(AreasService);
    repository = module.get<AreasRepository>(AreasRepository);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("should be defined", () => {
    expect(controller).toBeDefined();
    expect(service).toBeDefined();
    expect(repository).toBeDefined();
  });

  describe("Create Area", () => {
    it("should create an area through the entire stack", async () => {
      // Arrange
      const mockArea = Area.mock({
        name: "Test Area",
      });
      // description is now optional
      mockArea.description = "Test Description";

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

      // Mock repository method
      jest
        .spyOn(repository, "create")
        .mockResolvedValue(createdAreaModel as AreaModel);

      // Act
      const result = await controller.createArea(createAreaDto);

      // Assert
      expect(repository.create).toHaveBeenCalledWith(createAreaDto);
      expect(result).toEqual(createdAreaModel);
    });
  });

  describe("Get Areas", () => {
    it("should get all areas through the entire stack", async () => {
      // Arrange
      const mockAreas = [
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

      // Mock repository method
      jest
        .spyOn(repository, "findAll")
        .mockResolvedValue(mockAreas as AreaModel[]);

      // Act
      const result = await controller.getAllAreas();

      // Assert
      expect(repository.findAll).toHaveBeenCalled();
      expect(result).toEqual(mockAreas);
    });

    it("should get areas by worldId through the entire stack", async () => {
      // Arrange
      const worldId = "world1";
      const mockAreas = [
        {
          _id: "area1",
          name: "Area 1",
          description: "Description 1",
          position: new Position({ x: 0, y: 0, z: 0 }),
          worldId,
          tags: ["test"],
        },
      ];

      // Mock repository method
      jest
        .spyOn(repository, "findByWorldId")
        .mockResolvedValue(mockAreas as AreaModel[]);

      // Act
      const result = await controller.getAreasByWorldId(worldId);

      // Assert
      expect(repository.findByWorldId).toHaveBeenCalledWith(worldId);
      expect(result).toEqual(mockAreas);
    });
  });

  describe("Update Area", () => {
    it("should update an area through the entire stack", async () => {
      // Arrange
      const areaId = "area1";
      const updateAreaDto: UpdateAreaDto = {
        name: "Updated Area",
        description: "Updated Description",
      };

      const updatedAreaModel = {
        _id: areaId,
        name: "Updated Area",
        description: "Updated Description",
        position: new Position({ x: 0, y: 0, z: 0 }),
        worldId: "world1",
        tags: ["test"],
        updatedAt: new Date(),
      };

      // Mock repository method
      jest
        .spyOn(repository, "update")
        .mockResolvedValue(updatedAreaModel as AreaModel);

      // Act
      const result = await controller.updateArea({
        _id: areaId,
        updateDto: updateAreaDto,
      });

      // Assert
      expect(repository.update).toHaveBeenCalledWith(areaId, updateAreaDto);
      expect(result).toEqual(updatedAreaModel);
    });
  });

  describe("Delete Area", () => {
    it("should delete an area through the entire stack", async () => {
      // Arrange
      const areaId = "area1";
      const deletedAreaModel = {
        _id: areaId,
        name: "Area 1",
        description: "Description 1",
        position: new Position({ x: 0, y: 0, z: 0 }),
        worldId: "world1",
        tags: ["test"],
      };

      // Mock repository method
      jest
        .spyOn(repository, "delete")
        .mockResolvedValue(deletedAreaModel as AreaModel);

      // Act
      const result = await controller.deleteArea(areaId);

      // Assert
      expect(repository.delete).toHaveBeenCalledWith(areaId);
      expect(result).toEqual(deletedAreaModel);
    });
  });
});

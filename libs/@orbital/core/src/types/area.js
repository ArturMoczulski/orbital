"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var Area_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.Area = exports.AreaSchema = void 0;
const zod_1 = require("zod");
const faker_1 = require("@faker-js/faker");
const crypto_1 = require("crypto");
const identifiable_object_1 = require("./identifiable-object");
const position_1 = require("./position");
const zod_schema_decorator_1 = require("../decorators/zod-schema.decorator");
const area_map_1 = require("./area-map");
/** Zod schema for Area */
exports.AreaSchema = zod_1.z
    .object({
    id: zod_1.z.string().optional().describe("Unique identifier for the area"),
    parentId: zod_1.z
        .string()
        .nullable()
        .optional()
        .describe("Identifier of the parent area, if any"),
    name: zod_1.z.string().describe("Descriptive name of the area"),
    position: position_1.PositionSchema.describe("Central position of the area in 3D space"),
    areaMap: area_map_1.AreaMapSchema.optional().describe("Map representation of this area"),
})
    .describe("A named area in the game world with a specific position");
/**
 * Domain class for Area with auto-assignment and validation.
 */
let Area = Area_1 = class Area extends identifiable_object_1.IdentifiableObject {
    /** Create a fake Area instance with randomized data */
    static mock(overrides = {}) {
        const base = {
            parentId: faker_1.faker.string.uuid(),
            name: faker_1.faker.lorem.word(),
            position: position_1.Position.mock(),
            areaMap: overrides.areaMap || (Math.random() > 0.5 ? area_map_1.AreaMap.mock() : undefined),
        };
        return new Area_1(Object.assign(Object.assign({}, base), overrides));
    }
    constructor(data) {
        var _a, _b, _c;
        // Validate the data
        const validated = exports.AreaSchema.parse(data);
        // Create a clean object with properly instantiated properties
        const cleanData = {
            id: validated.id || (0, crypto_1.randomUUID)(),
        };
        // Pass the clean data to the parent constructor
        super(cleanData);
        this.name = "";
        this.position = new position_1.Position();
        /** Detailed description of the area */
        this.description = "";
        /** Notable landmarks or features in this area */
        this.landmarks = [];
        /** Names of other areas this area connects to */
        this.connections = [];
        // Ensure position is properly instantiated as a Position class
        const positionData = validated.position;
        const position = positionData instanceof position_1.Position
            ? positionData
            : new position_1.Position(positionData);
        // Handle areaMap if provided
        let areaMap = undefined;
        if (validated.areaMap) {
            const areaMapData = validated.areaMap;
            areaMap =
                areaMapData instanceof area_map_1.AreaMap ? areaMapData : new area_map_1.AreaMap(areaMapData);
        }
        // Assign properties directly
        this.name = validated.name;
        this.parentId = validated.parentId;
        // Assign new generated properties
        this.description = (_a = validated.description) !== null && _a !== void 0 ? _a : "";
        this.landmarks = (_b = validated.landmarks) !== null && _b !== void 0 ? _b : [];
        this.connections = (_c = validated.connections) !== null && _c !== void 0 ? _c : [];
        this.position = position;
        this.areaMap = areaMap;
    }
};
exports.Area = Area;
exports.Area = Area = Area_1 = __decorate([
    (0, zod_schema_decorator_1.ZodSchema)(exports.AreaSchema),
    __metadata("design:paramtypes", [Object])
], Area);

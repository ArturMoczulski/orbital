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
var AreaMap_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AreaMapGenerationInput = exports.AreaMapGenerationInputSchema = exports.AreaMap = exports.AreaMapSchema = void 0;
const zod_1 = require("zod");
const crypto_1 = require("crypto");
const identifiable_object_1 = require("./identifiable-object");
const zod_schema_decorator_1 = require("../decorators/zod-schema.decorator");
const area_map_tiles_1 = require("./area-map-tiles");
/**
 * Zod schema for AreaMapGrid
 */
exports.AreaMapSchema = zod_1.z
    .object({
    id: zod_1.z
        .string()
        .optional()
        .describe("Unique identifier for the map instance"),
    width: zod_1.z.number().int().min(1).describe("Width of the map in cells"),
    height: zod_1.z.number().int().min(1).describe("Height of the map in cells"),
    grid: zod_1.z
        .array(zod_1.z.array(zod_1.z.nativeEnum(area_map_tiles_1.AreaMapTiles)))
        .describe("2D grid of map tiles"),
})
    .superRefine((data, ctx) => {
    // Validate that the grid has the correct number of rows (height)
    if (data.grid.length !== data.height) {
        ctx.addIssue({
            code: zod_1.z.ZodIssueCode.custom,
            path: ["grid"],
            message: `Grid has ${data.grid.length} rows, but height is ${data.height}`,
        });
    }
    // Validate that each row has the correct number of columns (width)
    data.grid.forEach((row, rowIndex) => {
        if (row.length !== data.width) {
            ctx.addIssue({
                code: zod_1.z.ZodIssueCode.custom,
                path: ["grid", rowIndex],
                message: `Row ${rowIndex} has ${row.length} columns, but width is ${data.width}`,
            });
        }
    });
})
    .describe("A map of an area with a grid of tiles");
/**
 * Domain class for AreaMapGrid with auto-assignment and validation.
 */
let AreaMap = AreaMap_1 = class AreaMap extends identifiable_object_1.IdentifiableObject {
    /** Create a mock AreaMapGrid instance */
    static mock(overrides = {}) {
        const width = overrides.width || 3;
        const height = overrides.height || 3;
        // Create a grid with independent arrays for each row to avoid reference issues
        const grid = overrides.grid ||
            Array.from({ length: height }, () => Array.from({ length: width }, () => area_map_tiles_1.AreaMapTiles.GrassGround));
        const base = {
            width,
            height,
            grid,
        };
        return new AreaMap_1(Object.assign(Object.assign({}, base), overrides));
    }
    constructor(data) {
        // Validate input against schema
        const validated = exports.AreaMapSchema.parse(data);
        const id = validated.id || (0, crypto_1.randomUUID)();
        super({ id });
        this.width = 0;
        this.height = 0;
        this.grid = [];
        // Assign validated properties
        this.width = validated.width;
        this.height = validated.height;
        this.grid = validated.grid;
    }
};
exports.AreaMap = AreaMap;
exports.AreaMap = AreaMap = AreaMap_1 = __decorate([
    (0, zod_schema_decorator_1.ZodSchema)(exports.AreaMapSchema),
    __metadata("design:paramtypes", [Object])
], AreaMap);
/**
 * Zod schema for area map generation input
 */
exports.AreaMapGenerationInputSchema = zod_1.z
    .object({
    /** Size of the map */
    size: zod_1.z
        .string()
        .describe("Size of the map (e.g., 'small', 'medium', 'large')"),
    /** Description of the map */
    description: zod_1.z.string().describe("Detailed description of the map"),
    /** Mapping of tile type names to numeric values */
    tiles: zod_1.z
        .record(zod_1.z.string(), zod_1.z.number())
        .describe("Mapping of tile type names to numeric values"),
})
    .describe("Input schema for area map generation");
/**
 * Input class for area map generation
 */
let AreaMapGenerationInput = class AreaMapGenerationInput {
    constructor(data) {
        /** Size of the map */
        this.size = "";
        /** Description of the map */
        this.description = "";
        /** Mapping of tile type names to numeric values */
        this.tiles = {};
        if (data) {
            const validated = exports.AreaMapGenerationInputSchema.parse(data);
            this.size = validated.size;
            this.description = validated.description;
            this.tiles = validated.tiles;
        }
    }
    /**
     * Parse the size string into width and height values
     * @returns An object with width and height properties
     */
    parseSize() {
        // Default size if parsing fails
        const defaultSize = { width: 32, height: 32 };
        if (!this.size)
            return defaultSize;
        // Try to parse formats like "32x32", "32X32", "32,32", "32 32"
        const match = this.size.match(/(\d+)\s*[xX,\s]\s*(\d+)/);
        if (match) {
            const width = parseInt(match[1], 10);
            const height = parseInt(match[2], 10);
            return { width, height };
        }
        // Try to parse single number formats like "32" (square map)
        const singleNumber = parseInt(this.size, 10);
        if (!isNaN(singleNumber)) {
            return { width: singleNumber, height: singleNumber };
        }
        // Handle text sizes
        const sizeMap = {
            small: { width: 16, height: 16 },
            medium: { width: 32, height: 32 },
            large: { width: 64, height: 64 },
            huge: { width: 128, height: 128 },
        };
        const normalizedSize = this.size.toLowerCase().trim();
        return sizeMap[normalizedSize] || defaultSize;
    }
};
exports.AreaMapGenerationInput = AreaMapGenerationInput;
exports.AreaMapGenerationInput = AreaMapGenerationInput = __decorate([
    (0, zod_schema_decorator_1.ZodSchema)(exports.AreaMapGenerationInputSchema),
    __metadata("design:paramtypes", [Object])
], AreaMapGenerationInput);

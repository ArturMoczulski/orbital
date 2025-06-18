import { Position, PositionSchema } from "./position";
import { HistoryEventProps, HistoryEventSchema } from "./history-event";
import { BaseObject } from "./base-object";
import { z } from "zod";

export interface ClimateProps {
  /** Climate characteristics */
  temperature: string;
  weatherPattern?: string;
}

export interface SizeProps {
  /** Physical size metrics */
  area?: number;
  elevation?: number;
}

export interface ResourceProps {
  /** Available resource type and abundance */
  type: string;
  abundance: number;
}

export interface HazardProps {
  /** Potential hazard details */
  name: string;
  severity: number;
  notes?: string;
}

export interface InhabitantProps {
  /** Inhabitant role and population */
  characterId: string;
  role: string;
  population: number;
}

export interface PointOfInterestProps {
  /** Point of interest details */
  poiId: string;
  name: string;
  description?: string;
}

export interface ConnectionProps {
  /** Connection to another location */
  targetId: string;
  type: string;
  distance: number;
}

export interface LocationProps {
  /** Unique identifier for the location */
  id?: string;
  /** Reference to the world identifier */
  world?: string;
  /** Identifier of the parent location */
  parentId?: string;
  /** Identifiers of child locations */
  children?: string[];
  /** Display name of the location */
  name: string;
  /** Creation timestamp */
  createdAt: Date;
  /** Optional description */
  description?: string;
  /** Coordinates within the world */
  coordinates: Position;
  /** Optional radius around the point */
  radius?: number;
  /** Geographic region */
  region?: string;
  /** Terrain type */
  terrain?: string;
  /** Climate characteristics */
  climate?: ClimateProps;
  /** Physical size metrics */
  size?: SizeProps;
  /** Available resources */
  resources?: ResourceProps[];
  /** Potential hazards */
  hazards?: HazardProps[];
  /** Inhabitants with roles and populations */
  inhabitants?: InhabitantProps[];
  /** Points of interest */
  pointsOfInterest?: PointOfInterestProps[];
  /** Connections to other locations */
  connections?: ConnectionProps[];
  /** Historical events at this location */
  history?: HistoryEventProps[];
  /** Dynamic state key/value store */
  dynamicState?: Record<string, any>;
  /** Tags for categorization */
  tags?: string[];
}

export const ClimateSchema = z.object({
  temperature: z.string(),
  weatherPattern: z.string().optional(),
});

export const SizeSchema = z.object({
  area: z.number().optional(),
  elevation: z.number().optional(),
});

export const ResourceSchema = z.object({
  type: z.string(),
  abundance: z.number(),
});

export const HazardSchema = z.object({
  name: z.string(),
  severity: z.number(),
  notes: z.string().optional(),
});

export const InhabitantSchema = z.object({
  characterId: z.string(),
  role: z.string(),
  population: z.number(),
});

export const PointOfInterestSchema = z.object({
  poiId: z.string(),
  name: z.string(),
  description: z.string().optional(),
});

export const ConnectionSchema = z.object({
  targetId: z.string(),
  type: z.string(),
  distance: z.number(),
});

export const LocationSchema = z.object({
  id: z.string().optional(),
  world: z.string().optional(),
  parentId: z.string().optional(),
  children: z.array(z.string()).optional(),
  name: z.string().default(""),
  createdAt: z.date().default(() => new Date()),
  description: z.string().optional(),
  coordinates: PositionSchema.default({ x: 0, y: 0, z: 0 }),
  radius: z.number().optional(),
  region: z.string().optional(),
  terrain: z.string().optional(),
  climate: ClimateSchema.optional(),
  size: SizeSchema.optional(),
  resources: z.array(ResourceSchema).optional(),
  hazards: z.array(HazardSchema).optional(),
  inhabitants: z.array(InhabitantSchema).optional(),
  pointsOfInterest: z.array(PointOfInterestSchema).optional(),
  connections: z.array(ConnectionSchema).optional(),
  history: z.array(HistoryEventSchema).optional(),
  dynamicState: z.record(z.any()).optional(),
  tags: z.array(z.string()).optional(),
});

/**
 * Represents a location within a world.
 */
export class Location extends BaseObject<Location> implements LocationProps {
  // id property inherited from BaseObject
  world?: string;
  parentId?: string;
  children?: string[];
  name: string = "";
  createdAt: Date = new Date();
  description?: string;
  coordinates: Position = { x: 0, y: 0, z: 0 };
  radius?: number;
  region?: string;
  terrain?: string;
  climate?: ClimateProps;
  size?: SizeProps;
  resources?: ResourceProps[];
  hazards?: HazardProps[];
  inhabitants?: InhabitantProps[];
  pointsOfInterest?: PointOfInterestProps[];
  connections?: ConnectionProps[];
  history?: HistoryEventProps[];
  dynamicState?: Record<string, any>;
  tags?: string[];

  constructor(data: unknown) {
    const validated = LocationSchema.parse(data);
    super(validated as Partial<Location>);
  }
}

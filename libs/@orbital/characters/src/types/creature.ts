import { ZodSchema } from "@orbital/core";
import { z } from "zod";
import { CreatureType } from "../enums/creature-type.enum";
import { Gender } from "../enums/gender.enum";
import { Race } from "../enums/race.enum";
import { Attributes, AttributesSchema } from "./attributes";
import { CharactersSkill, CharactersSkillSchema } from "./character-skill";
import { Desire, DesireSchema } from "./desire";
import { Goal, GoalSchema } from "./goal";
import { Intention, IntentionSchema } from "./intention";
import { Memory, MemorySchema } from "./memory";
import { Mobile, MobileProps, MobileSchema } from "./mobile";
import {
  PsychologicalProfile,
  PsychologicalProfileSchema,
} from "./psychological-profile";
import { Relation, RelationSchema } from "./relation";

/**
 * Type representing a living creature in the world.
 */
export interface CreatureProps extends MobileProps {
  creatureType: CreatureType;
  race: Race;
  gender: Gender;
  attributes: Attributes;
  psychologicalProfile: PsychologicalProfile;
  skills?: CharactersSkill[];
  inventory?: string[];
  beliefs?: { statement: string; certainty: number }[];
  goals?: Goal[];
  intentions?: Intention[];
  desires?: Desire[];
  memories?: Memory[];
  relations?: Relation[];
}

/**
 * Zod schema for Creature.
 */
export const CreatureSchema = MobileSchema.extend({
  creatureType: z
    .nativeEnum(CreatureType)
    .describe("Type of creature (e.g., humanoid, animal)"),
  race: z.nativeEnum(Race).describe("Biological race of the creature"),
  gender: z.nativeEnum(Gender).describe("Gender of the creature"),
  attributes: AttributesSchema.describe(
    "Core attributes (e.g., ST, DX, IQ, HT)"
  ),
  psychologicalProfile: PsychologicalProfileSchema.describe(
    "Psychological profile scales"
  ),
  skills: z.array(CharactersSkillSchema).optional().describe("Learned skills"),
  inventory: z.array(z.string()).optional().describe("Items in inventory"),
  beliefs: z
    .array(
      z.object({
        statement: z.string(),
        certainty: z.number(),
      })
    )
    .optional()
    .describe("Beliefs held by the creature"),
  goals: z
    .array(GoalSchema)
    .optional()
    .describe("Goals the creature is pursuing"),
  intentions: z
    .array(IntentionSchema)
    .optional()
    .describe("Intentions formed by the creature"),
  desires: z
    .array(DesireSchema)
    .optional()
    .describe("Desires motivating the creature"),
  memories: z
    .array(MemorySchema)
    .optional()
    .describe("Memories stored by the creature"),
  relations: z
    .array(RelationSchema)
    .optional()
    .describe("Relationships to other world objects"),
}).describe("A living creature in the world");

/**
 * Represents a living creature in the world.
 */
@ZodSchema(CreatureSchema)
export class Creature extends Mobile implements CreatureProps, MobileProps {
  /** Type of creature (e.g., humanoid, animal) */
  creatureType!: CreatureType;

  /** Biological race of the creature */
  race!: Race;

  /** Gender of the creature */
  gender!: Gender;

  /** Core attributes (e.g., ST, DX, IQ, HT) */
  attributes!: Attributes;

  /** Psychological profile scales */
  psychologicalProfile!: PsychologicalProfile;

  /** Learned skills */
  skills?: CharactersSkill[];

  /** Items in inventory */
  inventory?: string[];

  /** Beliefs held by the creature */
  beliefs?: { statement: string; certainty: number }[];

  /** Goals the creature is pursuing */
  goals?: Goal[];

  /** Intentions formed by the creature */
  intentions?: Intention[];

  /** Desires motivating the creature */
  desires?: Desire[];

  /** Memories stored by the creature */
  memories?: Memory[];

  /** Relationships to other world objects */
  relations?: Relation[];

  constructor(data: Partial<CreatureProps> = {}) {
    super(data); // Pass data up the chain

    if (data.creatureType !== undefined) this.creatureType = data.creatureType;
    if (data.race !== undefined) this.race = data.race;
    if (data.gender !== undefined) this.gender = data.gender;
    if (data.attributes !== undefined)
      this.attributes = new Attributes(data.attributes);
    if (data.psychologicalProfile !== undefined)
      this.psychologicalProfile = new PsychologicalProfile(
        data.psychologicalProfile
      );
    if (data.skills !== undefined)
      this.skills = data.skills.map((s) => new CharactersSkill(s));
    if (data.inventory !== undefined) this.inventory = data.inventory;
    if (data.beliefs !== undefined) this.beliefs = data.beliefs;
    if (data.goals !== undefined)
      this.goals = data.goals.map((g) => new Goal(g));
    if (data.intentions !== undefined)
      this.intentions = data.intentions.map((i) => new Intention(i));
    if (data.desires !== undefined)
      this.desires = data.desires.map((d) => new Desire(d));
    if (data.memories !== undefined)
      this.memories = data.memories.map((m) => new Memory(m));
    if (data.relations !== undefined)
      this.relations = data.relations.map((r) => new Relation(r));
  }
}

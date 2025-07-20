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
import { Mobile, MobileSchema } from "./mobile";
import {
  PsychologicalProfile,
  PsychologicalProfileSchema,
} from "./psychological-profile";
import { Relation, RelationSchema } from "./relation";

/**
 * Zod schema for Creature.
 */
export const CreatureSchema = MobileSchema.extend({
  creatureType: z
    .nativeEnum(CreatureType)
    .optional()
    .describe("Type of creature (e.g., humanoid, animal)"),
  race: z
    .nativeEnum(Race)
    .optional()
    .describe("Biological race of the creature"),
  gender: z.nativeEnum(Gender).optional().describe("Gender of the creature"),
  dateOfBirth: z.string().optional().describe("Date of birth"),
  age: z.number().optional().describe("Age in years"),
  archetype: z.string().optional().describe("Character archetype"),
  personalityTraits: z
    .array(z.string())
    .optional()
    .describe("Personality traits"),
  attributes: AttributesSchema.optional().describe(
    "Core attributes (e.g., ST, DX, IQ, HT)"
  ),
  psychologicalProfile: PsychologicalProfileSchema.optional().describe(
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
  interests: z
    .array(
      z.object({
        category: z.string(),
        items: z.array(z.string()),
      })
    )
    .optional()
    .describe("Interests categorized by type"),
  needs: z
    .object({
      Physiological: z
        .array(
          z.object({
            need: z.string(),
            priority: z.number(),
            details: z.string().optional(),
          })
        )
        .optional(),
      Safety: z
        .array(
          z.object({
            need: z.string(),
            priority: z.number(),
            details: z.string().optional(),
          })
        )
        .optional(),
      Social: z
        .array(
          z.object({
            need: z.string(),
            priority: z.number(),
            details: z.string().optional(),
          })
        )
        .optional(),
      Esteem: z
        .array(
          z.object({
            need: z.string(),
            priority: z.number(),
            details: z.string().optional(),
          })
        )
        .optional(),
      "Self-Actualization": z
        .array(
          z.object({
            need: z.string(),
            priority: z.number(),
            details: z.string().optional(),
          })
        )
        .optional(),
    })
    .optional()
    .describe("Hierarchy of needs"),
  family: z
    .object({
      parents: z
        .object({
          father: z
            .object({
              name: z.string(),
              occupation: z.string().optional(),
              relationship: z.string().optional(),
            })
            .optional(),
          mother: z
            .object({
              name: z.string(),
              occupation: z.string().optional(),
              relationship: z.string().optional(),
            })
            .optional(),
        })
        .optional(),
      siblings: z
        .array(
          z.object({
            name: z.string(),
            age: z.number().optional(),
            occupation: z.string().optional(),
            relationship: z.string().optional(),
          })
        )
        .optional(),
      extendedFamily: z.string().optional(),
    })
    .optional()
    .describe("Family relationships"),
  socialCircle: z
    .object({
      bestFriends: z
        .array(
          z.object({
            name: z.string(),
            relationship: z.string().optional(),
            influence: z.string().optional(),
          })
        )
        .optional(),
      acquaintances: z.array(z.string()).optional(),
      rivals: z
        .array(
          z.object({
            name: z.string(),
            context: z.string().optional(),
            status: z.string().optional(),
          })
        )
        .optional(),
    })
    .optional()
    .describe("Social relationships"),
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
 * Interface for Creature properties, inferred from the schema
 */
export type CreatureProps = z.infer<typeof CreatureSchema>;

/**
 * Represents a living creature in the world.
 */
@ZodSchema(CreatureSchema)
export class Creature extends Mobile implements CreatureProps {
  /** Type of creature (e.g., humanoid, animal) */
  creatureType?: CreatureType;

  /** Biological race of the creature */
  race?: Race;

  /** Gender of the creature */
  gender?: Gender;

  /** Date of birth */
  dateOfBirth?: string;

  /** Age in years */
  age?: number;

  /** Character archetype */
  archetype?: string;

  /** Personality traits */
  personalityTraits?: string[];

  /** Core attributes (e.g., ST, DX, IQ, HT) */
  attributes?: Attributes;

  /** Psychological profile scales */
  psychologicalProfile!: PsychologicalProfile;

  /** Learned skills */
  skills?: CharactersSkill[];

  /** Items in inventory */
  inventory?: string[];

  /** Beliefs held by the creature */
  beliefs?: { statement?: string; certainty?: number }[];

  /** Goals the creature is pursuing */
  goals?: Goal[];

  /** Intentions formed by the creature */
  intentions?: Intention[];

  /** Desires motivating the creature */
  desires?: Desire[];

  /** Interests categorized by type */
  interests?: { category: string; items: string[] }[];

  /** Hierarchy of needs */
  needs?: {
    Physiological?: { need: string; priority: number; details?: string }[];
    Safety?: { need: string; priority: number; details?: string }[];
    Social?: { need: string; priority: number; details?: string }[];
    Esteem?: { need: string; priority: number; details?: string }[];
    "Self-Actualization"?: {
      need: string;
      priority: number;
      details?: string;
    }[];
  };

  /** Family relationships */
  family?: {
    parents?: {
      father?: { name: string; occupation?: string; relationship?: string };
      mother?: { name: string; occupation?: string; relationship?: string };
    };
    siblings?: {
      name: string;
      age?: number;
      occupation?: string;
      relationship?: string;
    }[];
    extendedFamily?: string;
  };

  /** Social relationships */
  socialCircle?: {
    bestFriends?: { name: string; relationship?: string; influence?: string }[];
    acquaintances?: string[];
    rivals?: { name: string; context?: string; status?: string }[];
  };

  /** Memories stored by the creature */
  memories?: Memory[];

  /** Relationships to other world objects */
  relations?: Relation[];

  constructor(data: Partial<CreatureProps> = {}) {
    super(data); // Pass data up the chain

    if (data.creatureType !== undefined) this.creatureType = data.creatureType;
    if (data.race !== undefined) this.race = data.race;
    if (data.gender !== undefined) this.gender = data.gender;
    if (data.dateOfBirth !== undefined) this.dateOfBirth = data.dateOfBirth;
    if (data.age !== undefined) this.age = data.age;
    if (data.archetype !== undefined) this.archetype = data.archetype;
    if (data.personalityTraits !== undefined)
      this.personalityTraits = data.personalityTraits;
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
    if (data.interests !== undefined) {
      // Create a deep copy and ensure required properties are set
      const interestsCopy = JSON.parse(JSON.stringify(data.interests));

      // Ensure required fields in interests
      interestsCopy.forEach((interest: any) => {
        if (!interest.category) interest.category = "Uncategorized";
        if (!interest.items) interest.items = [];
      });

      this.interests = interestsCopy;
    }
    if (data.needs !== undefined) {
      // Create a deep copy and ensure required properties are set
      const needsCopy = JSON.parse(JSON.stringify(data.needs));

      // Ensure required fields in needs categories
      const categories = [
        "Physiological",
        "Safety",
        "Social",
        "Esteem",
        "Self-Actualization",
      ];
      categories.forEach((category) => {
        if (needsCopy[category]) {
          needsCopy[category] = needsCopy[category].map((need: any) => ({
            need: need.need || "Unknown need",
            priority: need.priority || 5,
            details: need.details,
          }));
        }
      });

      this.needs = needsCopy;
    }
    if (data.family !== undefined) {
      // Create a deep copy and ensure required properties are set
      const familyCopy = JSON.parse(JSON.stringify(data.family));

      // Ensure required fields in family.parents.father and family.parents.mother
      if (familyCopy.parents) {
        if (familyCopy.parents.father && !familyCopy.parents.father.name) {
          familyCopy.parents.father.name = "Unknown";
        }
        if (familyCopy.parents.mother && !familyCopy.parents.mother.name) {
          familyCopy.parents.mother.name = "Unknown";
        }
      }

      // Ensure required fields in family.siblings
      if (familyCopy.siblings) {
        familyCopy.siblings = familyCopy.siblings.map((sibling: any) => ({
          name: sibling.name || "Unknown",
          ...sibling,
        }));
      }

      this.family = familyCopy;
    }
    if (data.socialCircle !== undefined) {
      // Create a deep copy and ensure required properties are set
      const socialCircleCopy = JSON.parse(JSON.stringify(data.socialCircle));

      // Ensure required fields in socialCircle.bestFriends
      if (socialCircleCopy.bestFriends) {
        socialCircleCopy.bestFriends = socialCircleCopy.bestFriends.map(
          (friend: any) => ({
            name: friend.name || "Unknown",
            ...friend,
          })
        );
      }

      // Ensure required fields in socialCircle.rivals
      if (socialCircleCopy.rivals) {
        socialCircleCopy.rivals = socialCircleCopy.rivals.map((rival: any) => ({
          name: rival.name || "Unknown",
          ...rival,
        }));
      }

      this.socialCircle = socialCircleCopy;
    }
    if (data.memories !== undefined)
      this.memories = data.memories.map((m) => new Memory(m));
    if (data.relations !== undefined)
      this.relations = data.relations.map((r) => new Relation(r));
  }
}

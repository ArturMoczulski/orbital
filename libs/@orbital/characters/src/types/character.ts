import { ZodSchema } from "@orbital/core";
import { z } from "zod";
import { Creature, CreatureProps, CreatureSchema } from "./creature";

/**
 * Type representing a character in the world.
 */
// Define the schema first
export const CharacterSchema = CreatureSchema.extend({
  title: z
    .string()
    .optional()
    .describe("Optional formal title (e.g., Sir, Lady)"),
  firstName: z.string().optional().describe("First, given name"),
  lastName: z.string().optional().describe("Last, family name"),
  appearance: z
    .object({
      hairColor: z.string().optional(),
      eyeColor: z.string().optional(),
    })
    .optional()
    .describe("Physical appearance details"),
  education: z
    .object({
      highSchool: z
        .object({
          name: z.string(),
          graduationYear: z.number().optional(),
          activities: z.array(z.string()).optional(),
        })
        .optional(),
      college: z
        .object({
          name: z.string(),
          major: z.string().optional(),
          status: z.string().optional(),
          expectedGraduation: z.number().optional(),
        })
        .optional(),
      specialTraining: z.array(z.string()).optional(),
    })
    .optional()
    .describe("Educational background"),
  workHistory: z
    .object({
      previous: z
        .array(
          z.object({
            employer: z.string(),
            position: z.string(),
            duration: z.string(),
          })
        )
        .optional(),
      current: z
        .object({
          primary: z
            .object({
              role: z.string(),
              platform: z.string().optional(),
              since: z.string().optional(),
            })
            .optional(),
          secondary: z
            .object({
              employer: z.string().optional(),
              position: z.string().optional(),
              duties: z.string().optional(),
            })
            .optional(),
        })
        .optional(),
    })
    .optional()
    .describe("Work and employment history"),
  financialStatus: z
    .object({
      income: z
        .object({
          sources: z.array(z.string()).optional(),
          stability: z.string().optional(),
        })
        .optional(),
      assets: z.array(z.string()).optional(),
    })
    .optional()
    .describe("Financial status and assets"),
  dailyRoutine: z
    .object({
      morning: z.string().optional(),
      afternoon: z.string().optional(),
      evening: z.string().optional(),
      weekend: z.string().optional(),
    })
    .optional()
    .describe("Daily routine and schedule"),
  challenges: z
    .array(z.string())
    .optional()
    .describe("Current challenges faced"),
  background: z
    .object({
      childhood: z.string().optional(),
      formativeExperiences: z.array(z.string()).optional(),
      culturalIdentity: z.string().optional(),
    })
    .optional()
    .describe("Character's background and history"),
}).describe("A character in the world with name and title");

// Then infer the type from the schema
export type CharacterProps = z.infer<typeof CharacterSchema>;

/**
 * Zod schema for Character.
 */
// Schema is now defined above, before the type

/**
 * Concrete character type with name and title.
 */
@ZodSchema(CharacterSchema)
export class Character
  extends Creature
  implements CharacterProps, CreatureProps
{
  /** Optional formal title (e.g., Sir, Lady) */
  title?: string;

  /** First, given name */
  firstName!: string;

  /** Last, family name */
  lastName!: string;

  /** Physical appearance details */
  appearance?: {
    hairColor?: string;
    eyeColor?: string;
  };

  /** Educational background */
  education?: {
    highSchool?: {
      name: string;
      graduationYear?: number;
      activities?: string[];
    };
    college?: {
      name: string;
      major?: string;
      status?: string;
      expectedGraduation?: number;
    };
    specialTraining?: string[];
  };

  /** Work and employment history */
  workHistory?: {
    previous?: {
      employer: string;
      position: string;
      duration: string;
    }[];
    current?: {
      primary?: {
        role: string;
        platform?: string;
        since?: string;
      };
      secondary?: {
        employer?: string;
        position?: string;
        duties?: string;
      };
    };
  };

  /** Financial status and assets */
  financialStatus?: {
    income?: {
      sources?: string[];
      stability?: string;
    };
    assets?: string[];
  };

  /** Daily routine and schedule */
  dailyRoutine?: {
    morning?: string;
    afternoon?: string;
    evening?: string;
    weekend?: string;
  };

  /** Current challenges faced */
  challenges?: string[];

  /** Character's background and history */
  background?: {
    childhood?: string;
    formativeExperiences?: string[];
    culturalIdentity?: string;
  };

  constructor(data: Partial<CharacterProps> = {}) {
    super(data); // Pass data up the chain

    if (data.title !== undefined) this.title = data.title;
    if (data.firstName !== undefined) this.firstName = data.firstName;
    if (data.lastName !== undefined) this.lastName = data.lastName;
    if (data.appearance !== undefined) this.appearance = { ...data.appearance };
    if (data.education !== undefined) {
      // Create a deep copy and ensure required properties are set
      const educationCopy = JSON.parse(JSON.stringify(data.education));

      // Ensure highSchool.name is set if highSchool exists
      if (educationCopy.highSchool && !educationCopy.highSchool.name) {
        educationCopy.highSchool.name = "Unknown";
      }

      // Ensure college.name is set if college exists
      if (educationCopy.college && !educationCopy.college.name) {
        educationCopy.college.name = "Unknown";
      }

      this.education = educationCopy;
    }
    if (data.workHistory !== undefined) {
      // Create a deep copy and ensure required properties are set
      const workHistoryCopy = JSON.parse(JSON.stringify(data.workHistory));

      // Ensure required fields in previous work history
      if (workHistoryCopy.previous) {
        workHistoryCopy.previous = workHistoryCopy.previous.map((job: any) => ({
          employer: job.employer || "Unknown",
          position: job.position || "Unknown",
          duration: job.duration || "Unknown",
          ...job,
        }));
      }

      // Ensure required fields in current.primary if it exists
      if (
        workHistoryCopy.current?.primary &&
        !workHistoryCopy.current.primary.role
      ) {
        workHistoryCopy.current.primary.role = "Unknown";
      }

      this.workHistory = workHistoryCopy;
    }
    if (data.financialStatus !== undefined)
      this.financialStatus = { ...data.financialStatus };
    if (data.dailyRoutine !== undefined)
      this.dailyRoutine = { ...data.dailyRoutine };
    if (data.challenges !== undefined) this.challenges = [...data.challenges];
    if (data.background !== undefined) this.background = { ...data.background };
  }
}

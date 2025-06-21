import { z } from "zod";
import { ZodSchema } from "@orbital/core";

/**
 * Zod schema for area generation input
 */
export const AreaGenerationInputSchema = z
  .object({
    /** Climate of the area */
    climate: z.string().describe("Climate type of the area"),
    /** Description of the area */
    description: z.string().describe("Detailed description of the area"),
  })
  .describe("Input schema for area generation");

/** Type for area generation input */
export type AreaGenerationInputProps = z.infer<
  typeof AreaGenerationInputSchema
>;

/**
 * Input class for area generation
 */
@ZodSchema(AreaGenerationInputSchema)
export class AreaGenerationInput implements AreaGenerationInputProps {
  /** Climate of the area */
  climate: string = "";
  /** Description of the area */
  description: string = "";

  constructor(data?: Partial<AreaGenerationInputProps>) {
    if (data) {
      const validated = AreaGenerationInputSchema.parse(data);
      this.climate = validated.climate;
      this.description = validated.description;
    }
  }
}

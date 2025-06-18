import { BaseLanguageModel } from "@langchain/core/language_models/base";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { z } from "zod";
import { LLMObjectGenerationService } from "./llm-object-generation.service";
import {
  setupOllamaForTest,
  createLLMServiceForTest,
} from "../testing/llm-test-utils";

/**
 * This is an E2E test that uses a real LLM (Ollama) to test the LLMObjectGenerationService.
 *
 * Prerequisites:
 * 1. Install Ollama: https://ollama.ai/
 * 2. Run a model: `ollama run llama3.1` or any other model you prefer
 *
 * To run this test:
 * npm test -- -t "E2E: LLMObjectGenerationService"
 */
describe("E2E: LLMObjectGenerationService", () => {
  let model: BaseLanguageModel;
  let service: LLMObjectGenerationService;

  // Set up the test environment with Ollama
  beforeAll(async () => {
    model = await setupOllamaForTest();
    service = createLLMServiceForTest(model);
  });

  // Define a simple test schema
  const PersonSchema = z
    .object({
      name: z.string().describe("The person's full name"),
      age: z.number().int().positive().describe("The person's age in years"),
      occupation: z.string().describe("The person's job or profession"),
      hobbies: z.array(z.string()).describe("List of the person's hobbies"),
    })
    .describe("Information about a person");

  type Person = z.infer<typeof PersonSchema>;

  it("should generate a structured object based on a schema", async () => {
    // Define the message builder function
    const buildMessages = (retryCount: number) => {
      const systemContent =
        retryCount > 0
          ? "You are a helpful assistant. Your previous response had errors. Please try again."
          : "You are a helpful assistant.";

      const humanContent =
        "Generate information about a fictional person who works in technology.";

      return {
        system: new SystemMessage(systemContent),
        human: new HumanMessage(humanContent),
      };
    };

    // Generate the person object
    const result = await service.generateObject<Person>(
      PersonSchema,
      buildMessages
    );

    // Assert
    expect(result).toBeDefined();
    expect(typeof result.name).toBe("string");
    expect(result.name.length).toBeGreaterThan(0);
    expect(typeof result.age).toBe("number");
    expect(result.age).toBeGreaterThan(0);
    expect(typeof result.occupation).toBe("string");
    expect(result.occupation.length).toBeGreaterThan(0);
    expect(Array.isArray(result.hobbies)).toBe(true);
    expect(result.hobbies.length).toBeGreaterThan(0);

    // Log the result
    console.log("Generated Person:", result);
  }, 30000); // Increase timeout to 30 seconds for LLM processing

  it("should handle complex nested schemas", async () => {
    // Define a more complex schema with nested objects
    const AddressSchema = z
      .object({
        street: z.string().describe("Street address"),
        city: z.string().describe("City name"),
        state: z.string().describe("State or province"),
        zipCode: z.string().describe("Postal code"),
      })
      .describe("A physical address");

    const CompanySchema = z
      .object({
        name: z.string().describe("Company name"),
        industry: z.string().describe("Industry sector"),
        founded: z
          .number()
          .int()
          .positive()
          .describe("Year the company was founded"),
        address: AddressSchema,
      })
      .describe("Information about a company");

    const EmployeeSchema = z
      .object({
        name: z.string().describe("Employee's full name"),
        title: z.string().describe("Job title"),
        department: z.string().describe("Department name"),
        yearsEmployed: z
          .number()
          .int()
          .nonnegative()
          .describe("Years working at the company"),
        skills: z.array(z.string()).describe("Professional skills"),
        company: CompanySchema,
      })
      .describe("Information about an employee and their company");

    type Employee = z.infer<typeof EmployeeSchema>;

    // Define the message builder function
    const buildMessages = (retryCount: number) => {
      const systemContent =
        retryCount > 0
          ? "You are a helpful assistant. Your previous response had errors. Please try again."
          : "You are a helpful assistant.";

      const humanContent =
        "Generate information about a fictional employee who works at a tech company.";

      return {
        system: new SystemMessage(systemContent),
        human: new HumanMessage(humanContent),
      };
    };

    // Generate the employee object
    const result = await service.generateObject<Employee>(
      EmployeeSchema,
      buildMessages
    );

    // Assert
    expect(result).toBeDefined();
    expect(typeof result.name).toBe("string");
    expect(typeof result.title).toBe("string");
    expect(typeof result.department).toBe("string");
    expect(typeof result.yearsEmployed).toBe("number");
    expect(Array.isArray(result.skills)).toBe(true);

    // Check nested company object
    expect(result.company).toBeDefined();
    expect(typeof result.company.name).toBe("string");
    expect(typeof result.company.industry).toBe("string");
    expect(typeof result.company.founded).toBe("number");

    // Check deeply nested address object
    expect(result.company.address).toBeDefined();
    expect(typeof result.company.address.street).toBe("string");
    expect(typeof result.company.address.city).toBe("string");
    expect(typeof result.company.address.state).toBe("string");
    expect(typeof result.company.address.zipCode).toBe("string");

    // Log the result
    console.log("Generated Employee:", JSON.stringify(result, null, 2));
  }, 60000); // Increase timeout to 60 seconds for complex LLM processing
});

import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { AsyncAPIDocumentGenerator } from "@orbital/microservices";
import * as fs from "fs";
import * as path from "path";

/**
 * Script to generate AsyncAPI document from controller metadata
 */
async function generateAsyncAPIDocument() {
  // Create a NestJS application context
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    // Get the AsyncAPIDocumentGenerator from the application context
    const generator = app.get(AsyncAPIDocumentGenerator);

    // Generate the AsyncAPI document
    const document = await generator.generateDocument();

    // Ensure the output directory exists
    const outputDir = path.join(process.cwd(), "asyncapi");
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Write the AsyncAPI document to a file
    const outputPath = path.join(outputDir, "asyncapi.json");
    fs.writeFileSync(outputPath, JSON.stringify(document, null, 2));

    console.log(`AsyncAPI document generated successfully at ${outputPath}`);
  } catch (error) {
    console.error("Error generating AsyncAPI document:", error);
    process.exit(1);
  } finally {
    // Close the application context
    await app.close();
  }
}

// Run the function
generateAsyncAPIDocument();
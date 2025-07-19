#!/usr/bin/env node

/**
 * Test script for the trainFaceLora workflow
 * This script tests the LoRA training functionality with a face dataset
 *
 * Prerequisites:
 * 1. ComfyUI must be running
 * 2. The "Lora Training in ComfyUI" custom node must be installed:
 *    git clone https://github.com/FizzleDorf/Lora-Training-in-Comfy custom_nodes/Lora-Training-in-Comfy
 * 3. Dependencies must be installed:
 *    pip install -r custom_nodes/Lora-Training-in-Comfy/requirements.txt
 *    pip install accelerate
 *
 * Usage:
 * node scripts/test-train-face-lora.js <dataset-path>
 */

import path from "path";
import { fileURLToPath } from "url";
import { trainModel } from "../dist/orchestrators/trainModel.js";
import { createTrainFaceLoraWorkflow } from "../dist/workflows/trainFaceLora.js";

// Get __dirname equivalent in ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Parse command line arguments
const datasetPath = process.argv[2];

if (!datasetPath) {
  console.error("Please provide a dataset path");
  console.error("Usage: node scripts/test-train-face-lora.js <dataset-path>");
  process.exit(1);
}

// Set up options for the trainFaceLora workflow
const options = {
  datasetPath: datasetPath,
  output: "test-lora", // Simplified path to avoid nesting issues
  networkDim: 32, // Lower dimension for faster testing
  trainingSteps: 100, // Fewer steps for testing
  batchSize: 1,
  saveEveryNSteps: 50,
  clipSkip: 2,
  resolution: 512, // Explicitly set resolution
  learningRate: 0.0001, // Explicitly set learning rate
};

// Log the options for debugging
console.log("Full options:", JSON.stringify(options, null, 2));

console.log("Testing trainFaceLora workflow");
console.log("Dataset path:", datasetPath);
console.log("Output directory:", options.output);
console.log("Training steps:", options.trainingSteps);

// Mock models for testing
const models = {
  checkpoints: ["realisticVisionV60B1.safetensors"],
  vaes: ["vae-ft-mse-840000-ema-pruned.safetensors"],
};

// Run the test
async function runTest() {
  try {
    console.log("Starting LoRA training...");

    const result = await trainModel(
      options,
      createTrainFaceLoraWorkflow,
      "trainFaceLora" // Workflow name
    );

    if (result) {
      console.log("Success! LoRA training completed. Model saved at:", result);
    } else {
      console.error("Failed to train LoRA model");
    }
  } catch (error) {
    console.error("Error:", error);
  }
}

runTest();

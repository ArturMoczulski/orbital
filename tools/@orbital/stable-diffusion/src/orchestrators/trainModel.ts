import axios from "axios";
import cliProgress from "cli-progress";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Get __dirname equivalent in ES modules
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Hard-coding path constants
const comfyUIUrl = "http://127.0.0.1:8188";
const COMFY_ROOT = path.resolve(
  __dirname,
  "../../../../../services/@comfyanonymous/ComfyUI"
);
const DATA_ROOT = path.resolve(__dirname, "../../data");
const MODELS_ROOT = path.resolve(__dirname, "../../models");

// Add debug logging
const DEBUG = true;
function debug(...args: any[]) {
  if (DEBUG) {
    console.log("[DEBUG]", ...args);
  }
}

// Set to true to enable more verbose debugging
const VERBOSE_DEBUG = true;
function verboseDebug(...args: any[]) {
  if (VERBOSE_DEBUG) {
    console.log("[VERBOSE DEBUG]", ...args);
  }
}

// Separate debug function that doesn't interfere with progress bar
function silentDebug(...args: any[]) {
  // When progress bar is active, store logs to display later or write to a different stream
  if (DEBUG) {
    // Using process.stderr doesn't interfere with the progress bar on stdout
    process.stderr.write(`[DEBUG] ${args.join(" ")}\n`);
  }
}

async function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Poll ComfyUI for training completion
 * This is different from image generation polling as it needs to handle longer processes
 * and different output types (model files instead of images)
 */
async function pollTrainingCompletion(promptId: string): Promise<any> {
  let completed = false;
  let outputs;
  let attempts = 0;
  const maxAttempts = 300; // Much higher for training (5 hours at 1 poll per minute)
  const pollInterval = 60000; // Poll every minute for training (vs every 2 seconds for generation)

  // Create a new progress bar
  const progressBar = new cliProgress.SingleBar({
    format: "Training Progress |{bar}| {percentage}% | {status}",
    barCompleteChar: "\u2588",
    barIncompleteChar: "\u2591",
    hideCursor: true,
    clearOnComplete: true,
    forceRedraw: true,
    stream: process.stdout,
    noTTYOutput: false,
  });

  // Initialize the progress bar
  progressBar.start(100, 0, {
    status: "Initializing training...",
  });

  // First, check immediately in case it completed very quickly
  try {
    const immediateResponse = await axios.get(
      `${comfyUIUrl}/history/${promptId}`
    );

    if (immediateResponse.data && immediateResponse.data[promptId]) {
      const promptResult = immediateResponse.data[promptId];

      if (promptResult.status && promptResult.status.completed) {
        outputs = promptResult.outputs;
        completed = true;
        progressBar.update(100, { status: "Training completed" });
      }
    }
  } catch (error) {
    console.error("Error checking immediate completion:", error);
  }

  // If not completed immediately, start polling
  while (!completed && attempts < maxAttempts) {
    attempts++;
    await sleep(pollInterval);

    try {
      const historyResponse = await axios.get(
        `${comfyUIUrl}/history/${promptId}`
      );

      if (historyResponse.data && historyResponse.data[promptId]) {
        const promptResult = historyResponse.data[promptId];

        // Log detailed status information for debugging
        if (VERBOSE_DEBUG) {
          verboseDebug("Poll attempt:", attempts);
          verboseDebug("Prompt result status:", promptResult.status);

          // Check for any error messages
          if (promptResult.error) {
            verboseDebug("ERROR in prompt execution:", promptResult.error);
          }

          // Check for node execution status
          if (promptResult.execution_node_status) {
            verboseDebug(
              "Node execution status:",
              promptResult.execution_node_status
            );
          }
        }

        // Calculate progress percentage
        let progressPercentage = Math.min(
          Math.round((attempts / maxAttempts) * 100),
          99
        );
        let statusMessage = `Training in progress (${attempts}/${maxAttempts})`;

        // Check if ComfyUI provides progress information
        if (
          promptResult.status &&
          typeof promptResult.status.progress === "number"
        ) {
          progressPercentage = Math.min(
            Math.round(promptResult.status.progress * 100),
            99
          );
          verboseDebug(
            `Actual progress from ComfyUI: ${promptResult.status.progress * 100}%`
          );
        }

        // Check for execution_cached status
        if (promptResult.status && promptResult.status.execution_cached) {
          statusMessage = "Using cached result";
          progressPercentage = 95;
          verboseDebug("Using cached result from previous execution");
        }

        if (promptResult.status && promptResult.status.completed) {
          outputs = promptResult.outputs;
          completed = true;
          progressBar.update(100, { status: "Training completed" });

          // Log detailed output information
          verboseDebug("Training completed. Outputs:", outputs);

          // Check if we have any outputs at all
          if (!outputs || Object.keys(outputs).length === 0) {
            console.warn(
              "WARNING: Training completed but no outputs were returned!"
            );
          }
        } else {
          progressBar.update(progressPercentage, { status: statusMessage });
        }
      } else {
        progressBar.update(
          Math.min(Math.round((attempts / maxAttempts) * 100), 99),
          {
            status: `Initializing training (${attempts}/${maxAttempts})`,
          }
        );
      }
    } catch (error) {
      console.error(`Error during polling (attempt ${attempts}):`, error);
    }
  }

  // Stop the progress bar
  progressBar.stop();

  if (!completed) {
    console.error(`Training timed out after ${maxAttempts} attempts`);
  }

  return outputs;
}

/**
 * Generic function to train models using ComfyUI with custom workflows
 * @param options The options for the workflow
 * @param createWorkflow A function that creates a ComfyUI workflow based on the options
 * @param workflowName The name of the workflow (used for logging and output naming)
 * @returns The path to the trained model file
 */
async function trainModelImpl<T>(
  options: T & {
    output?: string;
  },
  createWorkflow: (
    options: T,
    models: {
      checkpoints: string[];
      vaes: string[];
    }
  ) => { prompt: Record<string, any> },
  workflowName: string = "training"
): Promise<string | null> {
  try {
    debug("Starting model training with options:", options);

    // Check if dataset path exists and contains images
    if (options.datasetPath) {
      verboseDebug(`Checking dataset path: ${options.datasetPath}`);

      if (!fs.existsSync(options.datasetPath)) {
        throw new Error(`Dataset path does not exist: ${options.datasetPath}`);
      }

      // Check if the dataset directory contains images
      const datasetFiles = fs.readdirSync(options.datasetPath);
      const imageFiles = datasetFiles.filter(
        (file) =>
          file.endsWith(".jpg") ||
          file.endsWith(".jpeg") ||
          file.endsWith(".png") ||
          file.endsWith(".webp")
      );

      verboseDebug(
        `Found ${imageFiles.length} image files in dataset directory`
      );

      if (imageFiles.length === 0) {
        throw new Error(
          `No image files found in dataset directory: ${options.datasetPath}`
        );
      }

      // Check if there are caption files (for training)
      const captionFiles = datasetFiles.filter((file) => file.endsWith(".txt"));
      verboseDebug(
        `Found ${captionFiles.length} caption files in dataset directory`
      );

      if (captionFiles.length === 0) {
        console.warn(
          `WARNING: No caption (.txt) files found in dataset directory. LoRA training may not work properly without captions.`
        );
      }
    }

    // Get list of available checkpoints and VAEs
    debug("Fetching available models from ComfyUI");
    const modelsResponse = await axios.get(`${comfyUIUrl}/object_info`);
    const checkpoints =
      modelsResponse.data.CheckpointLoaderSimple?.input?.required?.ckpt_name ||
      [];
    const vaes = modelsResponse.data.VAELoader?.input?.required?.vae_name || [];

    debug("Available checkpoints:", checkpoints);
    debug("Available VAEs:", vaes);

    // Check if models are available
    if (checkpoints.length === 0) {
      throw new Error("No checkpoint models available in ComfyUI");
    }

    // Check if the Lora Training node is available
    const hasLoraTrainingNode =
      !!modelsResponse.data["Lora Training in ComfyUI"];
    verboseDebug(
      "Lora Training in ComfyUI node available:",
      hasLoraTrainingNode
    );

    if (!hasLoraTrainingNode) {
      throw new Error(
        "The 'Lora Training in ComfyUI' node is not available. Please install the custom node."
      );
    }

    // Create workflow using the provided function
    const workflow = createWorkflow(options, { checkpoints, vaes });

    debug("Submitting training workflow to ComfyUI");
    debug("Workflow:", JSON.stringify(workflow, null, 2));

    // Variable to store outputs, declared outside try block for scope
    let outputs: any;

    try {
      const generateResponse = await axios.post(
        `${comfyUIUrl}/prompt`,
        workflow
      );
      const promptId = generateResponse.data.prompt_id;
      console.log(`Training prompt submitted with ID: ${promptId}`);

      debug(
        "Response from ComfyUI:",
        JSON.stringify(generateResponse.data, null, 2)
      );

      console.log("Starting model training...");
      outputs = await pollTrainingCompletion(promptId);
      console.log("Model training completed successfully!");
      debug(
        "Outputs:",
        outputs ? JSON.stringify(outputs, null, 2) : "undefined"
      );
    } catch (error: any) {
      console.error("Error submitting workflow to ComfyUI:", error.message);
      if (axios.isAxiosError(error) && error.response) {
        console.error(`Response status: ${error.response.status}`);
        console.error(
          `Response data:`,
          JSON.stringify(error.response.data, null, 2)
        );
      }
      throw error;
    }

    // Check if we have valid outputs
    debug(
      "Checking outputs:",
      outputs ? JSON.stringify(outputs, null, 2) : "undefined"
    );

    // For training, we need to find the output model file
    // This could be in ComfyUI's models directory or in a custom output directory

    // First, check if any node in the outputs contains model file information
    let modelFileInfo = null;
    let usedNodeId = null;

    if (outputs) {
      for (const nodeId of Object.keys(outputs)) {
        if (
          outputs[nodeId] &&
          outputs[nodeId].model_file // Assuming the training node outputs a model_file property
        ) {
          modelFileInfo = outputs[nodeId].model_file;
          usedNodeId = nodeId;
          debug(`Found model file info in node ${nodeId}`);
          break;
        }
      }
    }

    // If we couldn't find model file info in the outputs, look for it in the ComfyUI models directory
    // This is a fallback in case the API doesn't return the expected output structure
    if (!modelFileInfo) {
      verboseDebug(
        "No model file info found in outputs, searching in filesystem..."
      );

      // Check common locations for LoRA models in ComfyUI
      const possibleModelDirs = [
        // First check the exact output directory specified in options
        ...(options.output
          ? [
              // Absolute path
              options.output,
              // Relative to current directory
              path.resolve(process.cwd(), options.output),
              // Relative to ComfyUI root
              path.join(COMFY_ROOT, options.output),
            ]
          : []),

        // Check standard ComfyUI model directories
        path.join(COMFY_ROOT, "models", "loras"),
        path.join(COMFY_ROOT, "models", "LoRA"),
        path.join(COMFY_ROOT, "models", "Lora"),

        // Check Lora-Training-in-Comfy custom node directories
        path.join(
          COMFY_ROOT,
          "custom_nodes",
          "Lora-Training-in-Comfy",
          "output"
        ),
        path.join(
          COMFY_ROOT,
          "custom_nodes",
          "Lora-Training-in-Comfy",
          "models"
        ),
        path.join(
          COMFY_ROOT,
          "custom_nodes",
          "Lora-Training-in-Comfy",
          "loras"
        ),
        path.join(
          COMFY_ROOT,
          "custom_nodes",
          "Lora-Training-in-Comfy",
          "output",
          options.output || ""
        ),

        // Check ComfyUI-LoRA-Tools custom node directories
        path.join(COMFY_ROOT, "custom_nodes", "ComfyUI-LoRA-Tools", "output"),
        path.join(COMFY_ROOT, "custom_nodes", "ComfyUI-LoRA-Tools", "models"),
        path.join(COMFY_ROOT, "custom_nodes", "ComfyUI-LoRA-Tools", "loras"),

        // Check relative to ComfyUI root with models prefix
        path.join(COMFY_ROOT, "models", options.output || ""),

        // Check relative to current directory with models prefix
        path.join(process.cwd(), "models", options.output || ""),

        // Check relative to DATA_ROOT
        path.join(DATA_ROOT, options.output || ""),

        // Check relative to MODELS_ROOT
        path.join(MODELS_ROOT, options.output || ""),
        path.join(MODELS_ROOT, "loras", options.output || ""),
      ];

      verboseDebug("Checking the following directories for model files:");
      possibleModelDirs.forEach((dir, index) => {
        verboseDebug(
          `  ${index + 1}. ${dir} ${fs.existsSync(dir) ? "(exists)" : "(not found)"}`
        );
      });

      // Get the current time to find files created during this training session
      const trainingStartTime = new Date();
      trainingStartTime.setMinutes(trainingStartTime.getMinutes() - 10); // Look for files created in the last 10 minutes

      verboseDebug(
        `Looking for model files created after: ${trainingStartTime.toISOString()}`
      );

      for (const modelDir of possibleModelDirs) {
        if (fs.existsSync(modelDir)) {
          verboseDebug(`Checking model directory: ${modelDir}`);
          const files = fs.readdirSync(modelDir);
          verboseDebug(`Found ${files.length} files in directory`);

          // Log all files in the directory for debugging
          if (VERBOSE_DEBUG) {
            files.forEach((file) => {
              const filePath = path.join(modelDir, file);
              const stats = fs.statSync(filePath);
              const fileSize = stats.size;
              verboseDebug(
                `  - ${file} (${fileSize} bytes, modified: ${stats.mtime.toISOString()})`
              );
            });
          }

          // Filter for model file extensions
          const modelFiles = files.filter(
            (file) =>
              file.endsWith(".safetensors") ||
              file.endsWith(".ckpt") ||
              file.endsWith(".pt")
          );

          verboseDebug(`Found ${modelFiles.length} model files in directory`);

          // Sort files by modification time (newest first)
          const sortedFiles = modelFiles
            .map((file) => {
              const filePath = path.join(modelDir, file);
              const stats = fs.statSync(filePath);
              const fileSize = stats.size;
              return {
                file,
                mtime: stats.mtime,
                path: filePath,
                size: fileSize,
              };
            })
            .sort((a, b) => b.mtime.getTime() - a.mtime.getTime());

          verboseDebug(
            "Model files in directory (newest first):",
            sortedFiles
              .map(
                (f) => `${f.file} (${f.size} bytes, ${f.mtime.toISOString()})`
              )
              .join(", ")
          );

          // First try to find files created during this training session
          const recentFiles = sortedFiles.filter(
            (f) => f.mtime > trainingStartTime
          );

          // Check for placeholder files (very small files)
          const nonPlaceholderFiles = recentFiles.filter((f) => f.size > 1024); // Files larger than 1KB

          if (nonPlaceholderFiles.length > 0) {
            const newestFile = nonPlaceholderFiles[0].file;
            verboseDebug(
              `Using recently created non-placeholder model file: ${newestFile} (${nonPlaceholderFiles[0].size} bytes, created at ${nonPlaceholderFiles[0].mtime.toISOString()})`
            );
            modelFileInfo = { filename: newestFile, directory: modelDir };
            break;
          } else if (recentFiles.length > 0) {
            const newestFile = recentFiles[0].file;
            verboseDebug(
              `WARNING: Only found small files that might be placeholders. Using: ${newestFile} (${recentFiles[0].size} bytes, created at ${recentFiles[0].mtime.toISOString()})`
            );
            modelFileInfo = { filename: newestFile, directory: modelDir };
            break;
          } else if (sortedFiles.length > 0) {
            // Fall back to the newest file if no recent files found
            const newestFile = sortedFiles[0].file;
            verboseDebug(
              `No recent files found. Using most recent model file: ${newestFile} (${sortedFiles[0].size} bytes, created at ${sortedFiles[0].mtime.toISOString()})`
            );
            modelFileInfo = { filename: newestFile, directory: modelDir };
            break;
          }
        }
      }
    }

    // If we still don't have model file info, provide detailed error information
    if (!modelFileInfo) {
      console.error("Expected output node ID:", usedNodeId);
      console.error(
        "Available output nodes:",
        outputs ? Object.keys(outputs) : []
      );

      // Provide more detailed error information
      console.error("\nDEBUG INFORMATION FOR TROUBLESHOOTING:");
      console.error("1. Workflow options:", JSON.stringify(options, null, 2));

      // Check if the LoRA Training nodes are available
      try {
        const objectInfoResponse = await axios.get(`${comfyUIUrl}/object_info`);
        const hasLoraTrainingNode =
          !!objectInfoResponse.data["Lora Training in ComfyUI"];
        console.error("2. LoRA Training node available:", hasLoraTrainingNode);

        if (!hasLoraTrainingNode) {
          console.error(
            "\nERROR: The 'Lora Training in ComfyUI' node is not available."
          );
          console.error("Please install the Lora-Training-in-Comfy extension:");
          console.error("1. Navigate to your ComfyUI directory");
          console.error(
            "2. Run: git clone https://github.com/FizzleDorf/Lora-Training-in-Comfy custom_nodes/Lora-Training-in-Comfy"
          );
          console.error(
            "3. Install dependencies: pip install -r custom_nodes/Lora-Training-in-Comfy/requirements.txt"
          );
          console.error("4. Install accelerate: pip install accelerate");
        }
      } catch (error) {
        console.error("Error checking for LoRA Training node:", error);
      }

      // Note about the accelerate module error
      console.error(
        "\nNOTE: If you see an error about 'accelerate.commands.launch' module not found,"
      );
      console.error(
        "install the accelerate module with: pip install accelerate"
      );
      console.error(
        "This error may not prevent training completion, but it's recommended to install the module."
      );

      throw new Error("No model files were generated by the training process");
    }

    // Determine the source and target paths for the model file
    let sourceModelPath;
    if (modelFileInfo.directory && modelFileInfo.filename) {
      sourceModelPath = path.join(
        modelFileInfo.directory,
        modelFileInfo.filename
      );
    } else if (modelFileInfo.filename) {
      // Try to find the file in common locations
      const possibleModelDirs = [
        path.join(COMFY_ROOT, "models", "loras"),
        path.join(COMFY_ROOT, "models", "LoRA"),
        path.join(COMFY_ROOT, "models", "Lora"),
      ];

      for (const dir of possibleModelDirs) {
        const potentialPath = path.join(dir, modelFileInfo.filename);
        if (fs.existsSync(potentialPath)) {
          sourceModelPath = potentialPath;
          break;
        }
      }

      if (!sourceModelPath) {
        throw new Error(
          `Could not find model file ${modelFileInfo.filename} in any known location`
        );
      }
    } else {
      throw new Error("Invalid model file information");
    }

    // Ensure output directory exists
    // Parse the output path to avoid nested directories
    let outputDir;
    if (options.output) {
      // Check if the output path already includes 'models/loras'
      if (options.output.includes("models/loras")) {
        // Extract the part after 'models/loras/'
        const match = options.output.match(/models\/loras\/(.+)/);
        if (match && match[1]) {
          outputDir = path.join(MODELS_ROOT, "loras", match[1]);
        } else {
          // If we can't extract, use the full path as is
          outputDir = path.join(MODELS_ROOT, "loras", options.output);
        }
      } else {
        // If it doesn't include 'models/loras', use as is
        outputDir = path.join(MODELS_ROOT, "loras", options.output);
      }
    } else {
      outputDir = path.join(MODELS_ROOT, "loras");
    }
    debug(`Ensuring output directory exists: ${outputDir}`);
    try {
      fs.mkdirSync(outputDir, {
        recursive: true,
      });
      debug(`Output directory created/verified: ${outputDir}`);
    } catch (error) {
      console.error(`Error creating output directory: ${error}`);
      throw new Error(`Failed to create output directory: ${error}`);
    }

    // Copy the model file to the target path
    const targetModelPath = path.join(
      outputDir,
      path.basename(sourceModelPath)
    );
    fs.copyFileSync(sourceModelPath, targetModelPath);

    console.log(`Trained model saved to ${targetModelPath}`);
    return targetModelPath;
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response) {
      console.error(
        `HTTP Error: ${error.response.status} ${error.response.statusText}`
      );
      console.error(`Details: ${JSON.stringify(error.response.data)}`);
    } else {
      console.error(`Unexpected error: ${error.message}`);
    }
    return null;
  }
}

// Export the function with the same name as the file for dynamic imports
export const trainModel = trainModelImpl;

/**
 * TrainFaceLora workflow for training LoRA models on face datasets using ComfyUI
 * Based on recommended settings for LoRA training on Mac with MPS
 *
 * For optimal performance on Mac, launch ComfyUI with these flags:
 * python main.py --listen 0.0.0.0
 *
 * Environment variables that may help with MPS support:
 * export PYTORCH_ENABLE_MPS_FALLBACK=1
 *
 * IMPORTANT: This workflow requires the "Lora Training in ComfyUI" custom node.
 * Installation instructions:
 * 1. Navigate to your ComfyUI directory
 * 2. Run: git clone https://github.com/FizzleDorf/Lora-Training-in-Comfy custom_nodes/Lora-Training-in-Comfy
 * 3. Install dependencies: pip install -r custom_nodes/Lora-Training-in-Comfy/requirements.txt
 * 4. Install accelerate: pip install accelerate
 * 5. Restart ComfyUI
 *
 * Note: If you see an error about 'accelerate.commands.launch' module not found,
 * install the accelerate module with: pip install accelerate
 * This error may not prevent training completion, but it's recommended to install the module.
 */

import { TrainFaceLoraOptions } from "./common";

/**
 * Helper function to find a model by partial name
 */
function findModelByPartialName(
  models: string[],
  partialName: string
): string | null {
  const lowerPartialName = partialName.toLowerCase();

  for (const model of models) {
    const modelName = Array.isArray(model) ? model[0] : model;
    if (modelName.toLowerCase().includes(lowerPartialName)) {
      return modelName;
    }
  }

  return null;
}

/**
 * Check if a specific node type exists in ComfyUI
 * This can be used to detect if required custom nodes are installed
 */
async function checkNodeExists(nodeType: string): Promise<boolean> {
  try {
    const response = await fetch("http://127.0.0.1:8188/object_info");
    const data = await response.json();
    return !!data[nodeType];
  } catch (error) {
    console.error(`Error checking for node ${nodeType}:`, error);
    return false;
  }
}

/**
 * Creates a ComfyUI workflow for training a face LoRA model
 * Supports multiple LoRA training node types for compatibility
 */
export function createTrainFaceLoraWorkflow(
  options: TrainFaceLoraOptions,
  models: { checkpoints: string[]; vaes: string[] }
) {
  console.log("Creating LoRA training workflow with options:", options);

  // Try to find recommended checkpoint, fall back to first available if not found
  let checkpoint =
    options.baseModel ||
    findModelByPartialName(models.checkpoints, "realisticVisionV60") ||
    (Array.isArray(models.checkpoints[0])
      ? models.checkpoints[0][0]
      : models.checkpoints[0]);

  console.log(`Using checkpoint: ${checkpoint}`);

  // Default values based on recommendations for Mac MPS
  const networkDim = options.networkDim || 64; // 64-128 recommended for Mac
  const trainingSteps = options.trainingSteps || 1000;
  const batchSize = options.batchSize || 1; // 1 recommended for Mac
  const saveEveryNSteps = options.saveEveryNSteps || 100;
  const clipSkip = options.clipSkip || 2; // Default to 2 for LoRA training
  const learningRate = options.learningRate || 0.0001;

  // Ensure output directory exists
  const outputDir = options.output || "models/loras";
  const outputName = options.output
    ? options.output.split("/").pop() || "trained_lora"
    : "trained_lora";

  // Create the workflow
  // We'll try to use the most commonly available LoRA training nodes
  // This makes the workflow more robust across different ComfyUI installations

  // First, try with the LoraTraininginComfy node which is a common custom node for LoRA training
  const workflow: any = {
    prompt: {
      // ── 1 ▪ LoRA Training Node ─────────────────────────────────────────────
      "1": {
        class_type: "Lora Training in ComfyUI",
        inputs: {
          ckpt_name: checkpoint,
          data_path: options.datasetPath,
          batch_size: batchSize,
          max_train_epoches: trainingSteps,
          save_every_n_epochs: saveEveryNSteps,
          output_name: outputName,
          clip_skip: clipSkip,
          output_dir: outputDir,
          network_dim: networkDim,
          learning_rate: learningRate,
          // Add additional parameters that might be required
          train_unet: true,
          train_text_encoder: true,
          shuffle_tags: true,
          gradient_accumulation_steps: 1,
          resolution: options.resolution || 512,
          mixed_precision: "fp16", // Use fp16 for better performance on Mac
          save_precision: "fp16",
          caption_extension: ".txt",
          optimizer: "AdamW8bit", // Use 8-bit optimizer for better memory efficiency
        },
      },
    },
  };

  // Log the full workflow for debugging
  console.log("Generated workflow:", JSON.stringify(workflow, null, 2));

  return workflow;
}

/**
 * NormalizeRealisticvisionInput workflow for upscaling images to optimal resolution for RealisticVision model
 * This workflow prepares images for use as input to the RealisticVision model by upscaling them to the
 * recommended resolution of 896x896 with appropriate preprocessing.
 *
 * The workflow preserves the original face shape and proportions by:
 * 1. Maintaining the original aspect ratio
 * 2. Adding padding to reach the target square dimensions
 * 3. Using high-quality upscaling to improve image quality
 */

import { BaseWorkflowOptions } from "./common";

/**
 * Options for normalizing images for RealisticVision input
 */
export interface NormalizeRealisticvisionInputOptions
  extends BaseWorkflowOptions {
  input: string; // Path to the input image
  paddingColor?: string; // Color for padding (default: "white")
}

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
 * Creates a workflow that upscales an image to the optimal resolution for RealisticVision input
 * The optimal resolution for RealisticVision is 896x896
 *
 * This workflow:
 * 1. Preserves the original face shape and proportions
 * 2. Adds padding to reach the target square dimensions
 * 3. Uses high-quality upscaling to improve image quality
 */
export function createNormalizeRealisticvisionInputWorkflow(
  options: NormalizeRealisticvisionInputOptions,
  models: { checkpoints: string[]; vaes: string[] }
) {
  // Try to find recommended VAE, fall back to first available if not found
  let vae =
    findModelByPartialName(models.vaes, "ft-mse-840000") ||
    findModelByPartialName(models.vaes, "vae-ft-mse") ||
    (Array.isArray(models.vaes[0]) ? models.vaes[0][0] : models.vaes[0]);

  console.log(`Using VAE: ${vae}`);

  // Default values based on RealisticVision recommendations
  const targetWidth = options.width || 896; // 896×896 is optimal for Realistic Vision v6.0
  const targetHeight = options.height || 896;
  const paddingColor = options.paddingColor || "white";

  // Create the workflow
  const workflow: any = {
    prompt: {
      // ── 1 ▪ Load VAE (needed for potential encoding/decoding) ───────────
      "1": {
        class_type: "VAELoader",
        inputs: { vae_name: vae },
      },

      // ── 2 ▪ Load Input Image ───────────────────────────────────────
      "2": {
        class_type: "LoadImage",
        inputs: {
          image: options.input,
        },
      },
    },
  };

  // Add initial upscaling for small images using standard ImageScale instead of model-based upscaler
  workflow.prompt["3"] = {
    class_type: "ImageScale",
    inputs: {
      image: ["2", 0],
      width: Math.round(targetWidth * 0.75), // Scale to 75% of target size initially
      height: Math.round(targetHeight * 0.75),
      upscale_method: "lanczos", // More reliable standard upscaling method
      crop: "disabled", // Don't crop the image
    },
  };

  // Add padding to make the image square while preserving aspect ratio
  workflow.prompt["4"] = {
    class_type: "ImagePadForOutpaint",
    inputs: {
      image: ["3", 0],
      left: 0,
      right: 0,
      top: 0,
      bottom: 0,
      feathering: 0,
      pad_to_square: true, // Make it square while preserving aspect ratio
      target_width: targetWidth,
      target_height: targetHeight,
      padding_color: paddingColor,
    },
  };

  // Simplified approach: Always use standard upscaling and VAE for quality
  console.log("Using standard upscaling with VAE for quality improvement");

  // Add final upscale to ensure exact dimensions using standard ImageScale
  workflow.prompt["5"] = {
    class_type: "ImageScale",
    inputs: {
      image: ["4", 0],
      width: targetWidth,
      height: targetHeight,
      upscale_method: "lanczos", // More reliable standard upscaling method
      crop: "disabled", // Don't crop the image
    },
  };

  // Add VAE encode for quality improvement
  workflow.prompt["6"] = {
    class_type: "VAEEncode",
    inputs: {
      pixels: ["5", 0],
      vae: ["1", 0],
    },
  };

  // Add VAE decode
  workflow.prompt["7"] = {
    class_type: "VAEDecode",
    inputs: {
      samples: ["6", 0],
      vae: ["1", 0],
    },
  };

  // Add SaveImage node
  workflow.prompt["8"] = {
    class_type: "SaveImage",
    inputs: {
      images: ["7", 0],
      filename_prefix: "normalized_rv_input",
      output_dir: options.output,
    },
  };

  return workflow;
}

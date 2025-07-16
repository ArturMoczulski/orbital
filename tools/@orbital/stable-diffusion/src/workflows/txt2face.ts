/**
 * Txt2Face workflow for generating photorealistic portrait images using ComfyUI
 * Based on recommended settings for Stable Diffusion face generation
 *
 * For optimal performance, launch ComfyUI with these flags:
 * python main.py --fp32-vae --force-upcast-attention --use-split-cross-attention
 *
 * Note: Each flag must be passed separately, not as a single string "flags"
 *
 * If you notice artifacts in hair or background bokeh areas, try adding:
 * --dont-upcast-attention (keeps attention in fp16 but stabilizes colors)
 *
 * This keeps VAE in fp32 for stability while allowing UNet to run in fp16 (~35% faster on consumer GPUs)
 * The --use-split-cross-attention flag provides up to 15% speedup on large latents, especially on Apple GPUs
 */

export interface Txt2FaceOptions {
  outputDirectory: string;
  prompt?: string; // Optional additional prompt
  negativePrompt?: string; // Optional additional negative prompt
  width?: number;
  height?: number;
  steps?: number;
  cfg?: number;
  seed?: number;
  upscale?: boolean; // Whether to add hi-res upscale pass
  upscaleDenoise?: number; // Denoise strength for upscale (0.25-0.35 recommended)
  fastSampler?: boolean; // Use faster sampler (dpmpp_2m without SDE) for ~10% speed boost
  preview?: boolean; // Use fast preview mode with lower resolution and fewer steps
}

// Single unified prompt template for both full-quality and preview modes
const PROMPT_TEMPLATE = `studio head-and-shoulders portrait of a {PROMPT}, *even softbox lighting*, neutral grey background, symmetrical face, natural skin texture, 85 mm lens, f/4, Canon EOS R5, 4 k UHD, ultra-sharp focus`;

// Single unified negative prompt for both modes
const NEGATIVE_PROMPT = `harsh shadows, dramatic lighting, spotlight, rim-light, top light, pattern light, high contrast, zebra pattern, cartoon, CGI, lowres, blurry, watermark, text, logo`;

// Recommended model names from the 2025 recipe
const RECOMMENDED_CHECKPOINT = "realisticVisionV60B1.safetensors"; // Realistic Vision v6.0 B1
const RECOMMENDED_VAE = "vae-ft-mse-840000-ema-pruned.safetensors"; // ft-MSE-840k-EMA (Stability)

/**
 * Creates a ComfyUI workflow for generating portrait images
 */
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

export function createTxt2faceWorkflow(
  options: Txt2FaceOptions,
  models: { checkpoints: string[]; vaes: string[] }
) {
  // Check if preview mode is enabled
  if (options.preview) {
    return createPreviewWorkflow(options, models);
  }
  // Try to find recommended checkpoint and VAE, fall back to first available if not found
  let checkpoint =
    findModelByPartialName(models.checkpoints, "realisticVisionV60") ||
    (Array.isArray(models.checkpoints[0])
      ? models.checkpoints[0][0]
      : models.checkpoints[0]);

  let vae =
    findModelByPartialName(models.vaes, "ft-mse-840000") ||
    findModelByPartialName(models.vaes, "vae-ft-mse") ||
    (Array.isArray(models.vaes[0]) ? models.vaes[0][0] : models.vaes[0]);

  console.log(`Using checkpoint: ${checkpoint}`);
  console.log(`Using VAE: ${vae}`);

  // Default values based on recommendations
  // Canvas size and parameters from the 2025 recipe
  const width = options.width || 896; // 896×896 is optimal for Realistic Vision v6.0
  const height = options.height || 896;
  const steps = options.steps || 28; // 28 steps recommended in the recipe
  const cfg = options.cfg || 7; // 7 CFG recommended in the recipe
  const seed = options.seed || 42;
  const upscale = options.upscale !== undefined ? options.upscale : true; // Enable upscale by default
  const upscaleDenoise = options.upscaleDenoise || 0.25; // 0.25 recommended in the recipe

  // Check if Impact Pack is available (not used in this version as we can't detect it reliably)
  const useFaceDetailer = false; // Disabled until we can verify Impact Pack is installed

  console.log("Note: For optimal face generation, install the Impact Pack:");
  console.log("ComfyUI Manager → Install Custom Nodes → ComfyUI-Impact-Pack");

  // Create the workflow
  const workflow: any = {
    prompt: {
      // ── 1 ▪ Checkpoint ─────────────────────────────────────────────
      "1": {
        class_type: "CheckpointLoaderSimple",
        inputs: { ckpt_name: checkpoint },
      },

      // ── 2 ▪ VAE (needed to turn latents into pixels) ───────────────
      "2": {
        class_type: "VAELoader",
        inputs: { vae_name: vae },
      },

      // ── 3-4 ▪ Prompts ──────────────────────────────────────────────
      "3": {
        class_type: "CLIPTextEncode",
        inputs: {
          clip: ["1", 1],
          text: PROMPT_TEMPLATE.replace("{PROMPT}", options.prompt || "person"),
        },
      },
      "4": {
        class_type: "CLIPTextEncode",
        inputs: {
          clip: ["1", 1],
          text: options.negativePrompt
            ? `${NEGATIVE_PROMPT}, ${options.negativePrompt}`
            : NEGATIVE_PROMPT,
        },
      },

      // ── 5 ▪ Empty latent ───────────────────────────────────────────
      "5": {
        class_type: "EmptyLatentImage",
        inputs: { width, height, batch_size: 1 },
      },

      // ── 6 ▪ Sampler (latent → latent) ─────────────────────────────
      "6": {
        class_type: "KSampler",
        inputs: {
          model: ["1", 0],
          positive: ["3", 0],
          negative: ["4", 0],
          latent_image: ["5", 0],
          sampler_name: "dpmpp_2m_sde_gpu", // Use consistent sampler that's available
          scheduler: "karras",
          steps,
          cfg,
          denoise: 1.0,
          seed,
        },
      },

      // ── 7 ▪ Decode latent → RGB ───────────────────────────────────
      "7": {
        class_type: "VAEDecode",
        inputs: { samples: ["6", 0], vae: ["2", 0] },
      },
    },
  };

  // Add SaveImage node for the base pass when upscale is disabled
  if (!upscale) {
    workflow.prompt["8"] = {
      class_type: "SaveImage",
      inputs: {
        images: ["7", 0], // Connect to VAEDecode output
        filename_prefix: "txt2face",
        output_dir: "",
      },
    };
  }

  // Add hi-res upscale pass if enabled (following the recipe's recommendations)
  if (upscale) {
    // Add latent upscaler with 1.5x scale as recommended in the recipe
    workflow.prompt["8"] = {
      class_type: "LatentUpscale",
      inputs: {
        samples: ["6", 0], // Connect to KSampler output
        scale_by: 1.5, // As specified in the recipe
        upscale_method: "bicubic", // Better interpolation for smoother results
        width: Math.round(width * 1.5),
        height: Math.round(height * 1.5),
        crop: "disabled",
      },
    };

    // Add KSampler for the hi-res pass with recipe settings
    workflow.prompt["9"] = {
      class_type: "KSampler",
      inputs: {
        model: ["1", 0],
        positive: ["3", 0],
        negative: ["4", 0],
        latent_image: ["8", 0],
        sampler_name: "dpmpp_2m_sde_gpu", // Use consistent sampler that's available
        scheduler: "karras",
        steps: 10, // Recipe recommends ~10 steps for upscale
        cfg,
        denoise: upscaleDenoise, // 0.25 recommended in the recipe
        seed: seed + 1, // Different seed for variation
      },
    };

    // Decode the upscaled latent
    workflow.prompt["10"] = {
      class_type: "VAEDecode",
      inputs: { samples: ["9", 0], vae: ["2", 0] },
    };

    // Add SaveImage node to ensure proper output handling
    workflow.prompt["11"] = {
      class_type: "SaveImage",
      inputs: {
        images: ["10", 0], // Connect to VAEDecode output
        filename_prefix: "txt2face",
        output_dir: "",
      },
    };
  }

  return workflow;
}

/**
 * Creates a fast preview workflow for quickly checking composition, pose, and lighting
 * Based on the "preview-speed" recipe for ComfyUI
 */
function createPreviewWorkflow(
  options: Txt2FaceOptions,
  models: { checkpoints: string[]; vaes: string[] }
) {
  // Try to find recommended checkpoint and VAE, fall back to first available if not found
  let checkpoint =
    findModelByPartialName(models.checkpoints, "realisticVisionV60") ||
    (Array.isArray(models.checkpoints[0])
      ? models.checkpoints[0][0]
      : models.checkpoints[0]);

  let vae =
    findModelByPartialName(models.vaes, "ft-mse-840000") ||
    findModelByPartialName(models.vaes, "vae-ft-mse") ||
    (Array.isArray(models.vaes[0]) ? models.vaes[0][0] : models.vaes[0]);

  console.log(`Using checkpoint: ${checkpoint}`);
  console.log(`Using VAE: ${vae}`);
  console.log("PREVIEW MODE: Using fast preview settings");

  // Preview mode settings
  const width = options.width || 512; // 512×512 for preview
  const height = options.height || 512;
  const steps = options.steps || 12; // 10 steps for preview
  const cfg = options.cfg || 5; // Lower CFG for faster convergence
  const seed = options.seed || 0; // Random seed (0) for variety

  // Create the workflow
  const workflow: any = {
    prompt: {
      // ── 1 ▪ Checkpoint ─────────────────────────────────────────────
      "1": {
        class_type: "CheckpointLoaderSimple",
        inputs: { ckpt_name: checkpoint },
      },

      // ── 2 ▪ VAE (needed to turn latents into pixels) ───────────────
      "2": {
        class_type: "VAELoader",
        inputs: { vae_name: vae },
      },

      // ── 3-4 ▪ Prompts ──────────────────────────────────────────────
      "3": {
        class_type: "CLIPTextEncode",
        inputs: {
          clip: ["1", 1],
          text: PROMPT_TEMPLATE.replace("{PROMPT}", options.prompt || "person"),
        },
      },
      "4": {
        class_type: "CLIPTextEncode",
        inputs: {
          clip: ["1", 1],
          text: options.negativePrompt
            ? `${NEGATIVE_PROMPT}, ${options.negativePrompt}`
            : NEGATIVE_PROMPT,
        },
      },

      // ── 5 ▪ Empty latent ───────────────────────────────────────────
      "5": {
        class_type: "EmptyLatentImage",
        inputs: { width, height, batch_size: 1 },
      },

      // ── 6 ▪ Sampler (latent → latent) ─────────────────────────────
      "6": {
        class_type: "KSampler",
        inputs: {
          model: ["1", 0],
          positive: ["3", 0],
          negative: ["4", 0],
          latent_image: ["5", 0],
          sampler_name: "dpmpp_2m_sde_gpu", // Use consistent sampler that's available
          scheduler: "karras",
          steps,
          cfg,
          denoise: 1.0,
          seed,
        },
      },

      // ── 7 ▪ Decode latent → RGB ───────────────────────────────────
      // Try to use TAESD decoder if available, otherwise fall back to VAEDecode
      "7": {
        class_type: "VAEDecode", // Default to standard VAE decode
        inputs: { samples: ["6", 0], vae: ["2", 0] },
      },

      // ── 8 ▪ Save Image ─────────────────────────────────────────────
      "8": {
        class_type: "SaveImage",
        inputs: {
          images: ["7", 0],
          filename_prefix: "txt2face_preview", // Add _preview suffix
          output_dir: "",
        },
      },
    },
  };

  // Note: We're not adding upscaling for preview mode as it's meant to be fast

  console.log("Note: For even faster previews, install the TAESD extension:");
  console.log("ComfyUI Manager → Install Custom Nodes → ComfyUI TAESD");
  console.log("This will enable the TAESDDecode node for much faster decoding");

  return workflow;
}

/**
 * Face2Face workflow for generating photorealistic portrait images from an input face using ComfyUI
 * Based on recommended settings for Stable Diffusion face generation with image-to-image
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

import { Face2FaceOptions } from "./common";

// Single unified prompt template for both full-quality and preview modes
const PROMPT_TEMPLATE = `studio head-and-shoulders portrait of {PROMPT}, *even softbox lighting*, neutral grey background, symmetrical face, natural skin texture, 85 mm lens, f/4, Canon EOS R5, 4 k UHD, ultra-sharp focus`;

// Single unified negative prompt for both modes
const NEGATIVE_PROMPT = `harsh shadows, dramatic lighting, spotlight, rim-light, top light, pattern light, high contrast, zebra pattern, cartoon, CGI, lowres, blurry, watermark, text, logo`;

// Recommended model names from the 2025 recipe
const RECOMMENDED_CHECKPOINT = "realisticVisionV60B1.safetensors"; // Realistic Vision v6.0 B1
const RECOMMENDED_VAE = "vae-ft-mse-840000-ema-pruned.safetensors"; // ft-MSE-840k-EMA (Stability)

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

export function createFace2faceWorkflow(
  options: Face2FaceOptions,
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
  const denoise = options.denoise || 0.4; // 0.4 is better for preserving facial identity
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

      // ── 5 ▪ Load Input Image ───────────────────────────────────────
      "5": {
        class_type: "LoadImage",
        inputs: {
          image: options.input,
        },
      },

      // ── 6 ▪ Resize Image ───────────────────────────────────────────
      "6": {
        class_type: "ImageScale",
        inputs: {
          image: ["5", 0],
          width: width,
          height: height,
          upscale_method: "lanczos",
          crop: "center",
        },
      },

      // ── 7 ▪ VAE Encode (image → latent) ───────────────────────────
      "7": {
        class_type: "VAEEncode",
        inputs: {
          pixels: ["6", 0],
          vae: ["2", 0],
        },
      },

      // ── 8 ▪ Sampler (latent → latent) ─────────────────────────────
      "8": {
        class_type: "KSampler",
        inputs: {
          model: ["1", 0],
          positive: ["3", 0],
          negative: ["4", 0],
          latent_image: ["7", 0],
          sampler_name: "dpmpp_2m_sde_gpu", // Use consistent sampler that's available
          scheduler: "karras",
          steps,
          cfg,
          denoise,
          seed,
          add_noise: false, // Don't inject extra noise
          noise_type: "original", // Reuse the source latent noise
        },
      },

      // ── 9 ▪ Decode latent → RGB ───────────────────────────────────
      "9": {
        class_type: "VAEDecode",
        inputs: { samples: ["8", 0], vae: ["2", 0] },
      },
    },
  };

  // Add SaveImage node for the base pass when upscale is disabled
  if (!upscale) {
    workflow.prompt["10"] = {
      class_type: "SaveImage",
      inputs: {
        images: ["9", 0], // Connect to VAEDecode output
        filename_prefix: "face2face",
        output_dir: options.output,
      },
    };
  }

  // Add hi-res upscale pass if enabled (following the recipe's recommendations)
  if (upscale) {
    // Add latent upscaler with 1.5x scale as recommended in the recipe
    workflow.prompt["10"] = {
      class_type: "LatentUpscale",
      inputs: {
        samples: ["8", 0], // Connect to KSampler output
        scale_by: 1.5, // As specified in the recipe
        upscale_method: "bicubic", // Better interpolation for smoother results
        width: Math.round(width * 1.5),
        height: Math.round(height * 1.5),
        crop: "disabled",
      },
    };

    // Add KSampler for the hi-res pass with recipe settings
    workflow.prompt["11"] = {
      class_type: "KSampler",
      inputs: {
        model: ["1", 0],
        positive: ["3", 0],
        negative: ["4", 0],
        latent_image: ["10", 0],
        sampler_name: "dpmpp_2m_sde_gpu", // Use consistent sampler that's available
        scheduler: "karras",
        steps: 10, // Recipe recommends ~10 steps for upscale
        cfg,
        denoise: upscaleDenoise, // 0.25 recommended in the recipe
        seed: seed + 1, // Different seed for variation
        add_noise: false, // Don't inject extra noise
        noise_type: "original", // Reuse the source latent noise
      },
    };

    // Decode the upscaled latent
    workflow.prompt["12"] = {
      class_type: "VAEDecode",
      inputs: { samples: ["11", 0], vae: ["2", 0] },
    };

    // Add SaveImage node to ensure proper output handling
    workflow.prompt["13"] = {
      class_type: "SaveImage",
      inputs: {
        images: ["12", 0], // Connect to VAEDecode output
        filename_prefix: "face2face",
        output_dir: options.output,
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
  options: Face2FaceOptions,
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
  const steps = options.steps || 12; // 12 steps for preview
  const cfg = options.cfg || 5; // Lower CFG for faster convergence
  const seed = options.seed || 0; // Random seed (0) for variety
  const denoise = options.denoise || 0.4; // Lower denoise for better identity preservation

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

      // ── 5 ▪ Load Input Image ───────────────────────────────────────
      "5": {
        class_type: "LoadImage",
        inputs: {
          image: options.input,
        },
      },

      // ── 6 ▪ Resize Image ───────────────────────────────────────────
      "6": {
        class_type: "ImageScale",
        inputs: {
          image: ["5", 0],
          width: width,
          height: height,
          upscale_method: "lanczos",
          crop: "center",
        },
      },

      // ── 7 ▪ VAE Encode (image → latent) ───────────────────────────
      "7": {
        class_type: "VAEEncode",
        inputs: {
          pixels: ["6", 0],
          vae: ["2", 0],
        },
      },

      // ── 8 ▪ Sampler (latent → latent) ─────────────────────────────
      "8": {
        class_type: "KSampler",
        inputs: {
          model: ["1", 0],
          positive: ["3", 0],
          negative: ["4", 0],
          latent_image: ["7", 0],
          sampler_name: "dpmpp_2m_sde_gpu", // Use consistent sampler that's available
          scheduler: "karras",
          steps,
          cfg,
          denoise,
          seed,
          add_noise: false, // Don't inject extra noise
          noise_type: "original", // Reuse the source latent noise
        },
      },

      // ── 9 ▪ Decode latent → RGB ───────────────────────────────────
      "9": {
        class_type: "VAEDecode", // Default to standard VAE decode
        inputs: { samples: ["8", 0], vae: ["2", 0] },
      },

      // ── 10 ▪ Save Image ─────────────────────────────────────────────
      "10": {
        class_type: "SaveImage",
        inputs: {
          images: ["9", 0],
          filename_prefix: "face2face_preview", // Add _preview suffix
          output_dir: options.output,
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

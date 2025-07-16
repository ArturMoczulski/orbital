/**
 * Face2Face workflow for generating portrait images using ComfyUI
 */

export interface Face2FaceOptions {
  outputDirectory: string;
  prompt?: string; // Optional additional prompt
  negativePrompt?: string; // Optional additional negative prompt
  width?: number;
  height?: number;
  steps?: number;
  cfg?: number;
  seed?: number;
}

// Default prompts for Realistic Vision v6
const BASE_PROMPT =
  "portrait photo of a person, highly detailed skin, 8k uhd, dslr, soft lighting, high quality, film grain";
const BASE_NEGATIVE_PROMPT =
  "blurry, distorted, deformed, bad anatomy, disfigured, poorly drawn face, mutation, mutated";

/**
 * Creates a ComfyUI workflow for generating portrait images
 */
export function createFace2faceWorkflow(
  options: Face2FaceOptions,
  models: { checkpoints: string[]; vaes: string[] }
) {
  // Use the first available checkpoint and VAE
  const checkpoint = Array.isArray(models.checkpoints[0])
    ? models.checkpoints[0][0]
    : models.checkpoints[0];
  const vae = Array.isArray(models.vaes[0])
    ? models.vaes[0][0]
    : models.vaes[0];

  // Default values
  const width = options.width || 832;
  const height = options.height || 832;
  const steps = options.steps || 28;
  const cfg = options.cfg || 7;
  const seed = options.seed || 42;

  // Create the workflow
  return {
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
          text: options.prompt
            ? `${BASE_PROMPT}, ${options.prompt}`
            : BASE_PROMPT,
        },
      },
      "4": {
        class_type: "CLIPTextEncode",
        inputs: {
          clip: ["1", 1],
          text: options.negativePrompt
            ? `${BASE_NEGATIVE_PROMPT}, ${options.negativePrompt}`
            : BASE_NEGATIVE_PROMPT,
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
          sampler_name: "dpmpp_2m_sde_gpu",
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
}

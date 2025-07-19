# Stable Diffusion Tools

A collection of TypeScript tools for working with Stable Diffusion.

## Installation

```bash
# Install dependencies
yarn install

# Build the project
yarn build
```

### System Dependencies

The canvas package requires some native dependencies to be installed on your system:

#### macOS

For macOS, especially on Apple Silicon (M1/M2/M3) Macs:

```bash
# Install Cairo, Pango, and other dependencies
brew install pkg-config cairo pango libpng jpeg giflib librsvg

# Clean node_modules and reinstall with specific canvas version
rm -rf node_modules
yarn install

# Use the provided setup script for Apple Silicon Macs
yarn setup-canvas-m1

# If you still encounter issues, try installing canvas globally
npm install -g canvas@2.11.0
```

For Intel Macs:

```bash
# Install Cairo, Pango, and other dependencies
brew install pkg-config cairo pango libpng jpeg giflib librsvg

# Clean node_modules and reinstall
rm -rf node_modules
yarn install

# Use the provided setup script
yarn setup-canvas
```

**Troubleshooting Canvas Installation:**

If you're still having issues with canvas, try these steps:

1. Make sure XCode Command Line Tools are installed:

   ```bash
   xcode-select --install
   ```

2. Set the PKG_CONFIG_PATH manually:

   ```bash
   # For Apple Silicon Macs
   export PKG_CONFIG_PATH="/opt/homebrew/lib/pkgconfig:/opt/homebrew/opt/libffi/lib/pkgconfig"

   # For Intel Macs
   export PKG_CONFIG_PATH="/usr/local/lib/pkgconfig:/usr/local/opt/libffi/lib/pkgconfig"
   ```

3. Install canvas globally with a specific version:

   ```bash
   npm install -g canvas@2.11.0
   ```

4. Link the global canvas to your project:
   ```bash
   npm link canvas
   ```

#### Linux (Ubuntu/Debian)

```bash
# Install Cairo, Pango, and other dependencies
sudo apt-get update
sudo apt-get install build-essential libcairo2-dev libpango1.0-dev libjpeg-dev libgif-dev librsvg2-dev
```

#### Windows

For Windows, follow the detailed instructions in the [node-canvas wiki](https://github.com/Automattic/node-canvas/wiki/Installation:-Windows).

## Available Commands

### Prepare Facial Dataset

Processes a folder of images (e.g., Instagram photos) and prepares them for LoRA training by:

1. Detecting faces using face-api.js
2. Cropping faces with padding
3. Resizing to target resolution
4. Optionally upscaling small faces using Real-ESRGAN
5. Saving processed images to output directories

#### Prerequisites

Before running the script, you need to:

1. Install the required dependencies:

   ```bash
   yarn add @vladmandic/face-api @tensorflow/tfjs-node @napi-rs/canvas sharp
   ```

2. Download face-api.js models:

   ```bash
   # Use the provided script to download the models
   yarn download-face-api-models
   ```

   This will download the required face-api.js models to the `./models` directory.

   Alternatively, you can download the models manually:

   ```bash
   # Create models directory
   mkdir -p models

   # Download models (example using curl)
   curl -L https://github.com/vladmandic/face-api/raw/master/model/ssd_mobilenetv1_model-weights_manifest.json -o models/ssd_mobilenetv1_model-weights_manifest.json
   curl -L https://github.com/vladmandic/face-api/raw/master/model/ssd_mobilenetv1_model-shard1 -o models/ssd_mobilenetv1_model-shard1
   ```

   **Important**: Make sure the models are downloaded to the correct location. The script expects them to be in the `./models` directory relative to where you run the script from.

3. (Optional) Install Real-ESRGAN for upscaling small faces:
   ```bash
   brew install real-esrgan
   # or for Intel Macs:
   # arch -x86_64 brew install real-esrgan
   ```

#### Usage

```bash
# Basic usage with default options
yarn prepareFacialDataset

# Specify source and output directories
yarn prepareFacialDataset --source data/source/instagram.com/username/posts --face-output data/source/instagram.com/username/face

# Full options
yarn prepareFacialDataset \
  --source data/source/instagram.com/username/posts \
  --face-output data/source/instagram.com/username/face \
  --full-output data/source/instagram.com/username/full \
  --min-face 160 \
  --padding 0.2 \
  --target 512 \
  --upscale-threshold 200 \
  --upscale-factor 2 \
  --models ./models \
  --augment \
  --augment-count 5
```

#### Options

- `--source`: Source directory containing images (default: `data/source/instagram.com/arturinvegas/posts`)
- `--face-output`: Output directory for face crops (default: `data/source/instagram.com/arturinvegas/face`)
- `--full-output`: Output directory for full-body crops (default: `data/source/instagram.com/arturinvegas/full`)
- `--min-face`: Minimum face size to process in pixels (default: `160`)
- `--padding`: Padding around face as ratio of face size (default: `0.2`)
- `--target`: Target size for output images in pixels (default: `512`)
- `--upscale-threshold`: Threshold for upscaling small faces in pixels (default: `200`)
- `--upscale-factor`: Factor for upscaling small faces (default: `2`)
- `--models`: Directory containing face-api models (default: `./models`)
- `--augment`: Generate augmented versions of processed images (default: `false`)
- `--augment-count`: Number of augmentations to generate per image (default: `5`)

### Scrape Instagram

Downloads images from Instagram posts.

```bash
yarn scrapeInstagram <json file path> <destination directory> [--limit <number>]
```

### Run Workflow

Executes a workflow with a specific orchestrator.

```bash
yarn workflow <orchestrator> <workflow> [options]
```

## Directory Structure

```
data/
  source/
    instagram.com/
      username/
        posts/     # Source images
        face/      # Face crops
        full/      # Full-body crops
  raw/             # Alternative location for raw images
  crops/           # Alternative location for face crops
  full/            # Alternative location for full-body crops
  reg/             # Regularization images
models/            # Face-api.js models
src/
  commands/        # CLI commands
  workflows/       # Workflow definitions
  orchestrators/   # Workflow orchestrators
```

## LoRA Training with ComfyUI

This project supports training LoRA models directly through ComfyUI using the `trainModel` orchestrator.

### Prerequisites

Before training LoRA models with ComfyUI, you need to install the required custom nodes:

```bash
# Navigate to your ComfyUI directory
cd /path/to/your/ComfyUI

# Install Lora Training in ComfyUI
git clone https://github.com/FizzleDorf/Lora-Training-in-Comfy custom_nodes/Lora-Training-in-Comfy

# Install dependencies
pip install -r custom_nodes/Lora-Training-in-Comfy/requirements.txt

# Install accelerate module (required for training)
pip install accelerate

# Restart ComfyUI after installing the custom nodes
```

> **Note**: If you see an error about 'accelerate.commands.launch' module not found during training, install the accelerate module with: `pip install accelerate`. This error may prevent proper training, so it's strongly recommended to install the module.

### Dataset Requirements for LoRA Training

For successful LoRA training, your dataset directory should:

1. Contain image files (JPG, PNG, WEBP)
2. Include caption files (TXT) with the same base name as the images
3. Be properly structured according to the LoRA training node requirements

Example of a properly structured dataset:

```
dataset_directory/
  ├── image1.jpg
  ├── image1.txt  # Caption file for image1.jpg
  ├── image2.jpg
  ├── image2.txt  # Caption file for image2.jpg
  └── ...
```

The caption files should contain text descriptions of the images, which will be used during training to associate the images with text prompts.

### The trainModel Orchestrator

The `trainModel` orchestrator is designed to handle the training process for LoRA models. It:

1. Verifies that the dataset path exists and contains images
2. Checks that the required custom nodes are installed
3. Submits the training workflow to ComfyUI
4. Monitors the training progress with a progress bar
5. Attempts to locate the trained model file after completion
6. Copies the model file to the specified output directory

**Known Issues and Fixes:**

- **Path Resolution**: The orchestrator now correctly handles paths to avoid nested directory structures
- **Node Configuration**: Additional parameters have been added to the LoRA training node for better compatibility
- **Placeholder Detection**: The orchestrator now checks file sizes to distinguish between actual model files and placeholders
- **Dataset Validation**: The orchestrator verifies that the dataset directory contains images before starting training

### Training a Face LoRA

To train a face LoRA model:

```bash
# Using the test script
node scripts/test-train-face-lora.js data/source/instagram.com/username/face

# Using the workflow command
yarn workflow trainModel trainFaceLora --options='{"datasetPath":"data/source/instagram.com/username/face","output":"models/loras/username_lora","networkDim":32,"trainingSteps":100}'
```

### Training Options

The `trainFaceLora` workflow supports the following options:

- `datasetPath`: Path to the directory containing the training dataset (required)
- `output`: Output directory for the trained model (default: "models/loras")
- `networkDim`: Dimension of the LoRA network (4-128, default: 64)
- `trainingSteps`: Number of training steps (default: 1000)
- `batchSize`: Batch size for training (default: 1)
- `saveEveryNSteps`: Save checkpoint every N steps (default: 100)
- `clipSkip`: Number of CLIP layers to skip (default: 2)
- `learningRate`: Learning rate for training (default: 0.0001)

### Mac-Specific Optimizations

For optimal performance on Mac with MPS:

1. Launch ComfyUI with these flags and environment variables:

   ```bash
   PYTORCH_ENABLE_MPS_FALLBACK=1 python main.py --listen 127.0.0.1
   ```

   The `PYTORCH_ENABLE_MPS_FALLBACK=1` environment variable allows operations that exceed MPS memory limits to run on the CPU instead, which helps prevent crashes with large models or complex workflows.

2. Avoid problematic image resolutions that can cause memory errors:
   - 1024x1024
   - 2048x512
   - 512x2048
   - 1024x512
   - 512x1024

   These resolutions can trigger the error: `failed assertion [MPSTemporaryNDArray initWithDevice:descriptor:] Error: total bytes of NDArray > 2**32`

   This error occurs due to a 32-bit integer limitation (2^31 = 2,147,483,648) in the Metal Performance Shaders (MPS) implementation. When processing images with these dimensions, internal tensor operations can create arrays with dimensions that exceed this 32-bit limit. This is a software limitation, not an actual memory limitation - even on high-end Apple Silicon chips with plenty of RAM, the same error occurs.

   Use slightly different dimensions (e.g., 1023x1023 instead of 1024x1024) to avoid this issue. This small change keeps the tensor dimensions just under the limit that would trigger the error.

3. Use these recommended settings:
   - `networkDim`: 32-64 (lower is faster)
   - `batchSize`: 1
   - `trainingSteps`: 500-1000 for initial testing

### Troubleshooting

If you encounter issues with LoRA training:

1. **Model file not found**: The trained model file might be saved in one of these locations:
   - The specified output directory (e.g., `models/loras/test-lora`)
   - ComfyUI's models directory: `/path/to/ComfyUI/models/loras`
   - Custom node directories: `/path/to/ComfyUI/custom_nodes/Lora-Training-in-Comfy/output`

2. **Accelerate module error**: If you see an error about 'accelerate.commands.launch' module not found:

   ```
   Error while finding module specification for 'accelerate.commands.launch' (ModuleNotFoundError: No module named 'accelerate')
   ```

   This error will likely prevent proper training. Install the accelerate module:

   ```bash
   pip install accelerate
   ```

3. **Training appears to complete but no model file is generated**: This could be due to several issues:
   - **Missing caption files**: Ensure your dataset directory contains .txt caption files for each image
   - **Path resolution issues**: Use simple paths for the output directory (e.g., "test-lora" instead of "models/loras/test-lora")
   - **Node configuration**: The LoRA training node might need additional parameters. Try using the advanced version of the node
   - **ComfyUI configuration**: Ensure ComfyUI is properly configured for your system (e.g., MPS for Mac)

4. **Placeholder files instead of actual models**: The orchestrator now checks file sizes to distinguish between actual model files and placeholders. If you only see small placeholder files (< 1KB), the training process likely failed silently.

5. **Debugging the training process**: Run the check-comfyui-nodes.js script to verify that the LoRA training node is properly installed:

   ```bash
   node tools/@orbital/stable-diffusion/scripts/check-comfyui-nodes.js
   ```

   This will list all available nodes, including the LoRA training nodes.

6. **Environment variables for Mac**: Make sure to set these environment variables before launching ComfyUI:
   ```bash
   export PYTORCH_ENABLE_MPS_FALLBACK=1
   ```

## ComfyUI Custom Nodes on macOS with Apple Silicon

If you're using ComfyUI on macOS with Apple Silicon (M1/M2/M3), you may encounter issues with custom nodes installation and compatibility. We've created resources to help troubleshoot and fix these issues.

### Common Issues

- Version conflicts between packages (huggingface_hub, diffusers, numpy)
- Missing dependencies
- Incompatible packages with Apple Silicon
- Security policy restrictions

### Automated Fix Script

We've created a script that automates the process of fixing ComfyUI custom nodes issues on macOS with Apple Silicon:

```bash
# Navigate to your ComfyUI directory
cd /path/to/your/ComfyUI

# Make the script executable
chmod +x /path/to/orbital/tools/@orbital/stable-diffusion/scripts/fix-comfyui-nodes-macos.sh

# Run the script
/path/to/orbital/tools/@orbital/stable-diffusion/scripts/fix-comfyui-nodes-macos.sh
```

The script performs the following actions:

- Upgrades huggingface_hub to version 0.33.4
- Upgrades diffusers to version 0.34.0
- Downgrades NumPy to version 1.26.4 for compatibility
- Reinstalls torch for Apple Silicon
- Installs dghs-imgutils for comfyui-logicutils
- Fixes comfyui-mvadapter requirements
- Manually installs comfyui_controlnet_aux

### Running ComfyUI Securely

To avoid security policy issues, always run ComfyUI with the `--listen 127.0.0.1` parameter:

```bash
python main.py --listen 127.0.0.1
```

### Detailed Documentation

For more detailed information about troubleshooting ComfyUI custom nodes on macOS with Apple Silicon, see the [ComfyUI macOS Troubleshooting Guide](docs/comfyui-macos-troubleshooting.md).

## LoRA Training (Python)

After preparing your dataset, you can train a LoRA using kohya-ss:

1. Generate regularization images:

   ```bash
   python gen_reg_images.py --class_prompt "photo of a person" --n 200 --w 512 --h 512 --out data/reg
   ```

2. Create a training configuration file (`data/training_config.toml`):

   ```toml
   [general]
   flip_aug = true
   resolution = 512,512

   [[datasets]]
   data_dir = "data/source/instagram.com/username/face"
   class_tokens = "my_person"
   num_repeats = 10

   [[datasets]]
   data_dir = "data/reg"
   class_tokens = "person"
   num_repeats = 1
   ```

3. Train the LoRA:
   ```bash
   accelerate launch kohya_ss/train_network.py \
     --pretrained_model_name_or_path stabilityai/stable-diffusion-1.5 \
     --dataset_config data/training_config.toml \
     --network_module networks.lora \
     --output_dir loras/my_person \
     --prior_loss_weight 1.0 \
     --max_train_steps 2000 \
     --learning_rate 1e-4 \
     --network_dim 128 --network_alpha 64 \
     --mixed_precision fp16
   ```

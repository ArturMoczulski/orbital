# ComfyUI macOS Troubleshooting Guide

This document provides solutions for common issues encountered when running ComfyUI with custom nodes on macOS with Apple Silicon.

## Common Issues

### 1. Custom Nodes Installation Failures

Many custom nodes fail to install properly on macOS with Apple Silicon due to dependency issues. The most common problems include:

- Version conflicts between packages
- Missing dependencies
- Incompatible packages with Apple Silicon
- Security policy restrictions

### 2. Specific Node Issues

#### comfyui-mvadapter

This node has strict version requirements for `diffusers` and `huggingface_hub` that may conflict with other nodes.

#### comfyui_controlnet_aux

This node has many dependencies, including some that are not available for macOS with Apple Silicon (like `mediapipe`).

#### comfyui-logicutils

This node requires `dghs-imgutils` which may not be installed automatically.

#### comfyui-diffusers

This node may fail to install due to script execution issues. If you need this functionality, you may need to manually install it.

#### xformers

The xformers package is not available for macOS with Apple Silicon. Installation attempts will fail with compilation errors related to OpenMP support. This is expected and not critical for most functionality.

#### ReSharpen and DiffusionCG

These nodes may cause issues with workflows and are better left uninstalled.

### Successfully Installable Nodes

The following nodes have been tested and confirmed to install successfully on macOS with Apple Silicon:

- ComfyUI-AutoCropFaces
- ComfyUI-DDUF
- comfyui_controlnet_aux (with manual installation)

## Solutions

### 1. Package Version Management

We've found the following package versions work well together:

- `huggingface_hub==0.33.4` (upgraded from 0.24.6)
- `diffusers==0.34.0` (upgraded from 0.27.2)
- `numpy==1.26.4` (downgraded from 2.3.1)
- `torch`, `torchvision`, and `torchaudio` reinstalled for Apple Silicon

### 2. Manual Installation Steps

For some nodes, manual installation with specific steps is required:

#### comfyui-mvadapter

Modify the `requirements.txt` file to accept newer versions of dependencies:

```
sed -i '' 's/diffusers==0.27.2/diffusers>=0.27.2/g' custom_nodes/comfyui-mvadapter/requirements.txt
sed -i '' 's/huggingface_hub==0.24.6/huggingface_hub>=0.24.6/g' custom_nodes/comfyui-mvadapter/requirements.txt
```

#### comfyui_controlnet_aux

Manual installation is required, skipping `mediapipe` which isn't available for Apple Silicon:

```
git clone https://github.com/Fannovel16/comfyui_controlnet_aux.git
cd comfyui_controlnet_aux
pip install -r requirements.txt --no-deps
pip install opencv-python timm scipy svglib reportlab
pip install onnxruntime
```

### 3. Security Settings

When running ComfyUI, use the `--listen 127.0.0.1` parameter to avoid security policy issues:

```
python main.py --listen 127.0.0.1
```

## Automated Fix

We've created a script that automates all the necessary fixes. You can run it from the ComfyUI directory:

```bash
./fix-comfyui-nodes-macos.sh
```

The script is located at `tools/@orbital/stable-diffusion/scripts/fix-comfyui-nodes-macos.sh`.

## Verification

To verify that all nodes are properly installed and working, you can run:

```bash
node tools/@orbital/stable-diffusion/scripts/check-comfyui-nodes.js
```

This will list all available nodes in your ComfyUI installation.

## Memory Limitations on Apple Silicon

When running ComfyUI on macOS with Apple Silicon, you may encounter memory-related crashes, especially with large models or complex workflows. A common error is:

```
failed assertion `[MPSTemporaryNDArray initWithDevice:descriptor:] Error: total bytes of NDArray > 2**32'
```

This error occurs when Metal Performance Shaders (MPS) tries to allocate more than 4GB (2^32 bytes) of memory for a single operation.

### Problematic Image Resolutions

The error is particularly common with certain image resolutions that cause the MPS backend to crash. Based on research, these problematic resolutions include:

- 1024x1024
- 2048x512
- 512x2048
- 1024x512
- 512x1024

The issue occurs because these resolutions create tensor dimensions whose product approaches or exceeds the 32-bit integer limit (2^31 = 2,147,483,648). This is a software limitation in the Metal Performance Shaders (MPS) implementation, not an actual memory limitation.

For example, when processing a 1024x1024 image, the internal tensor operations can create arrays with dimensions that multiply to exceed this 32-bit limit. According to the PyTorch GitHub issue #84039, this is why the error specifically mentions "total bytes of NDArray > 2**32" (or 2**31 in some cases).

Interestingly, this is not related to the actual available VRAM or system memory. Even on high-end Apple Silicon chips with plenty of memory (like M1 Max with 64GB), the same error occurs because it's a limitation in how the MPS backend handles large tensor dimensions.

### Workarounds

1. **Avoid problematic resolutions**: Use slightly different dimensions (e.g., 1023x1023 instead of 1024x1024)
2. **Reduce model size**: Use smaller models or lower precision models (e.g., fp16 instead of fp32)
3. **Simplify workflows**: Break complex workflows into smaller, simpler ones
4. **Reduce batch size**: Process fewer images at once
5. **Lower resolution**: Work with smaller image dimensions
6. **Use CPU fallback**: Set the environment variable `PYTORCH_ENABLE_MPS_FALLBACK=1` to fall back to CPU for operations that exceed MPS limits

### Example of CPU Fallback

```bash
export PYTORCH_ENABLE_MPS_FALLBACK=1
python main.py --listen 127.0.0.1
```

This will allow operations that exceed MPS memory limits to run on the CPU instead, which is slower but can handle larger memory requirements.

### Note on Resolution Adjustment

Even with CPU fallback enabled, you may still encounter crashes with the problematic resolutions. The most reliable solution is to adjust your image dimensions to avoid the specific sizes that trigger the error.

## Workflow Validation Errors

You may see validation errors for workflows when:

- Required models are missing
- Custom nodes are not installed
- There are incompatible model versions
- Expression nodes have syntax errors

These errors typically look like:

```
Failed to validate prompt for output XXX:
* NodeName XXX:
  - Error description
Output will be ignored
```

Most of these errors can be resolved by:

1. Installing the required custom nodes
2. Downloading the necessary model files
3. Fixing expression syntax errors
4. Updating workflows to use available models

## Conclusion

By following these steps, you should be able to resolve most issues with ComfyUI custom nodes on macOS with Apple Silicon. If you encounter other issues, please document them and the solutions you find.

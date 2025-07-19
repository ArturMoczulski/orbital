import axios from "axios";

async function checkComfyUINodes() {
  try {
    console.log("Checking available ComfyUI nodes...");

    // Get the object_info from ComfyUI API
    const response = await axios.get("http://127.0.0.1:8188/object_info");

    // Extract all node types
    const nodeTypes = Object.keys(response.data);

    // Filter for nodes related to LoRA training
    const loraNodes = nodeTypes.filter(
      (node) =>
        node.toLowerCase().includes("lora") ||
        node.toLowerCase().includes("train")
    );

    console.log("\nAvailable LoRA/Training related nodes:");
    loraNodes.forEach((node) => console.log(`- ${node}`));

    console.log("\nAll available nodes:");
    nodeTypes.sort().forEach((node) => console.log(`- ${node}`));
  } catch (error) {
    console.error("Error checking ComfyUI nodes:", error.message);
    if (error.response) {
      console.error("Response status:", error.response.status);
      console.error("Response data:", error.response.data);
    }
  }
}

checkComfyUINodes();

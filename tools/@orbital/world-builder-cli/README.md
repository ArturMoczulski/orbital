# world-builder-cli

CLI tool to generate `Area` objects using LLMs and the CompositeObjectGenerationRunnable.

## Installation

```bash
npm install -g world-builder-cli
```

Or from local project:

```bash
cd tools/@orbital/world-builder
npm install
npm run build
npm link
```

## Usage

### Environment Setup

Create a `.env.local` file in the `tools/@orbital/world-builder-cli` directory with your OpenAI API key:

```
OPENAI_API_KEY=your-api-key-here
OPENAI_MODEL_NAME=gpt-4o  # Optional, defaults to gpt-4o
```

### Basic Usage

```bash
world-builder-cli generate <input> [options]
```

Where:

- `<input>`: Path to a JSON file or a JSON string containing the generation input

Options:

- `-o, --output <file>`: Save the generated area to a file instead of stdout
- `-v, --verbose`: Enable verbose output for debugging

### Input Format

The input JSON should contain:

- Root properties matching `AreaGenerationInputSchema` (climate, description)
- Optional `nestedInputs` object for nested objects like areaMap

Example input file (see `examples/area-input.json`):

```json
{
  "climate": "temperate",
  "description": "A lush forest area with ancient ruins",
  "nestedInputs": {
    "areaMap": {
      "size": "medium",
      "description": "A forest clearing with ancient stone structures and a small stream",
      "tiles": {
        "grass": 0,
        "water": 1,
        "stone": 2,
        "tree": 3
      }
    }
  }
}
```

### Examples

Generate an area using a JSON file and save the output:

```bash
world-builder-cli generate examples/area-input.json --output generated-area.json --verbose
```

Generate an area using a JSON string:

```bash
world-builder-cli generate '{"climate":"arid","description":"a desert oasis","nestedInputs":{"areaMap":{"size":"small","description":"A small oasis","tiles":{"sand":0,"water":1}}}}' --verbose
```

Outputs a generated `Area` object as JSON.

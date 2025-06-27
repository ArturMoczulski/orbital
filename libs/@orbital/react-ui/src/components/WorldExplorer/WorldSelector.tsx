import Box from "@mui/material/Box";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import MenuItem from "@mui/material/MenuItem";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import { useEffect, useState } from "react";
import { useNotification } from "../../components/NotificationProvider";
import { useWorld } from "../../contexts/WorldContext";

// World interface
export interface World {
  id: string;
  name: string;
}

export interface WorldSelectorProps {
  label?: string;
  worlds?: World[];
  loading?: boolean;
  onFetchWorlds?: () => Promise<World[]>;
}

export default function WorldSelector({
  label = "World",
  worlds = [],
  loading: externalLoading = false,
  onFetchWorlds,
}: WorldSelectorProps) {
  const { worldId, setWorldId, setWorldName } = useWorld();
  const { notify } = useNotification();
  const [internalWorlds, setInternalWorlds] = useState<World[]>(worlds);
  const [loading, setLoading] = useState(false);

  // Fetch worlds if onFetchWorlds is provided
  useEffect(() => {
    if (onFetchWorlds) {
      setLoading(true);

      onFetchWorlds()
        .then((fetchedWorlds) => {
          setInternalWorlds(fetchedWorlds);

          // Set default world if none is selected
          if (!worldId && fetchedWorlds.length > 0) {
            setWorldId(fetchedWorlds[0].id);
            setWorldName(fetchedWorlds[0].name);
          }
        })
        .catch((error) => {
          console.error("Error fetching worlds:", error);
          notify("Failed to load worlds", "error");
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      // Use provided worlds if no fetch function
      setInternalWorlds(worlds);

      // Set default world if none is selected
      if (!worldId && worlds.length > 0) {
        setWorldId(worlds[0].id);
        setWorldName(worlds[0].name);
      }
    }
  }, [worldId, setWorldId, setWorldName, notify, worlds, onFetchWorlds]);

  const handleChange = (event: SelectChangeEvent) => {
    const selectedId = event.target.value;
    const selectedWorld = internalWorlds.find(
      (world) => world.id === selectedId
    );

    if (selectedWorld) {
      setWorldId(selectedWorld.id);
      setWorldName(selectedWorld.name);
    }
  };

  const isLoading = loading || externalLoading;

  return (
    <Box sx={{ minWidth: 120 }}>
      <FormControl fullWidth size="small">
        <InputLabel id="world-selector-label">{label}</InputLabel>
        <Select
          labelId="world-selector-label"
          id="world-selector"
          value={worldId || ""}
          label={label}
          onChange={handleChange}
          disabled={isLoading}
          data-testid="world-selector"
          data-cy="world-selector"
        >
          {internalWorlds.map((world) => (
            <MenuItem key={world.id} value={world.id}>
              {world.name}
            </MenuItem>
          ))}
        </Select>
      </FormControl>
    </Box>
  );
}

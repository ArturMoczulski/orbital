import AppBar from "@mui/material/AppBar";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import Typography from "@mui/material/Typography";
import { ReactNode, useEffect, useState } from "react";
import {
  ObjectType,
  ObjectTypeProvider,
  useObjectType,
} from "../../contexts/ObjectTypeContext";
import { WorldProvider, useWorld } from "../../contexts/WorldContext";
import ObjectTypeSelector from "./ObjectTypeSelector";
import WorldSelector, { World } from "./WorldSelector";

// User interface
export interface User {
  username: string;
  displayName?: string;
}

// Object type definition
export interface ObjectTypeDefinition {
  type: ObjectType;
  label: string;
  component: ReactNode;
}

interface WorldExplorerContentProps {
  username?: string;
  worlds?: World[];
  objectTypes: ObjectTypeDefinition[];
  fetchWorlds?: () => Promise<World[]>;
  fetchUsername?: () => Promise<string>;
  children?: ReactNode;
}

// This is the inner content component that uses the context hooks
function WorldExplorerContent({
  username: initialUsername = "",
  worlds = [],
  objectTypes = [],
  fetchWorlds,
  fetchUsername,
  children,
}: WorldExplorerContentProps) {
  const { worldId, worldName } = useWorld();
  const { objectType } = useObjectType();
  const [username, setUsername] = useState(initialUsername);

  // Fetch username if provided
  useEffect(() => {
    if (fetchUsername) {
      fetchUsername()
        .then((name) => {
          setUsername(name);
        })
        .catch((error) => {
          console.error("Error fetching username:", error);
        });
    }
  }, [fetchUsername]);

  // Find the current object type component
  const currentTypeDefinition = objectTypes.find(
    (def) => def.type === objectType
  );

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        width: "30%", // Take up 30% of the width
        borderRight: "1px solid rgba(0, 0, 0, 0.12)", // Add a border on the right
      }}
    >
      {/* Header Bar */}
      <AppBar
        position="static"
        color="default"
        sx={{
          backgroundColor: "background.paper",
          boxShadow: 1,
        }}
      >
        <Toolbar>
          {/* Left: Username */}
          <Typography
            variant="subtitle1"
            component="div"
            sx={{ flexGrow: 1 }}
            data-testid="username-display"
            data-cy="username-display"
          >
            {username}
          </Typography>

          {/* Right: Selectors */}
          <Box sx={{ display: "flex", gap: 2 }}>
            <ObjectTypeSelector
              objectTypes={objectTypes.map((def) => ({
                type: def.type,
                label: def.label,
              }))}
            />
            <WorldSelector worlds={worlds} onFetchWorlds={fetchWorlds} />
          </Box>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, overflow: "auto", p: 0 }}>
        {/* Conditional rendering based on object type */}
        {currentTypeDefinition?.component}
        {children}
      </Box>
    </Box>
  );
}

// This is the main component that provides the contexts
export interface WorldExplorerProps {
  username?: string;
  worlds?: World[];
  objectTypes: ObjectTypeDefinition[];
  defaultWorldId?: string;
  defaultWorldName?: string;
  defaultObjectType?: ObjectType;
  fetchWorlds?: () => Promise<World[]>;
  fetchUsername?: () => Promise<string>;
  children?: ReactNode;
}

export default function WorldExplorer({
  username,
  worlds,
  objectTypes,
  defaultWorldId,
  defaultWorldName,
  defaultObjectType,
  fetchWorlds,
  fetchUsername,
  children,
}: WorldExplorerProps) {
  return (
    <WorldProvider
      defaultWorldId={defaultWorldId}
      defaultWorldName={defaultWorldName}
    >
      <ObjectTypeProvider
        defaultObjectType={
          defaultObjectType ||
          (objectTypes.length > 0 ? objectTypes[0].type : "")
        }
      >
        <WorldExplorerContent
          username={username}
          worlds={worlds}
          objectTypes={objectTypes}
          fetchWorlds={fetchWorlds}
          fetchUsername={fetchUsername}
        >
          {children}
        </WorldExplorerContent>
      </ObjectTypeProvider>
    </WorldProvider>
  );
}

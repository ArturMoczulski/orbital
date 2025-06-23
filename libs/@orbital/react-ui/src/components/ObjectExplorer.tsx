import React, { useState } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import MapIcon from "@mui/icons-material/Map";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import Typography from "@mui/material/Typography";
import { useTheme } from "@mui/material/styles";
import { ExplorerObject, ObjectExplorerProps } from "./types";
import { useOrbitalTheme } from "../theme/ThemeContext";

/**
 * A generic tree-view component for displaying hierarchical objects
 */
export function ObjectExplorer<T extends ExplorerObject>({
  queryResult,
  onSelect,
  objectTypeName,
  renderNode,
}: ObjectExplorerProps<T>) {
  // Use the orbital theme if available, otherwise fall back to the default MUI theme
  const orbitalTheme = useOrbitalTheme();
  const defaultTheme = useTheme();
  const theme = orbitalTheme || defaultTheme;

  const { data: objects, isLoading, error } = queryResult;
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>(
    {}
  );

  // Handle expanding/collapsing nodes
  const toggleNode = (id: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Handle clicking the select button
  const handleSelectClick = (id: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering the tree node toggle
    const selectedObject = objects?.find((obj) => obj.id === id);
    if (selectedObject) {
      onSelect(selectedObject.id);
    }
  };

  // Default tree node component
  const DefaultTreeNode = ({
    object,
    level = 0,
  }: {
    object: T;
    level?: number;
  }) => {
    const hasChildren = objects?.some((o) => o.parentId === object.id);
    const isExpanded = expandedNodes[object.id] || false;
    const childObjects = objects?.filter((o) => o.parentId === object.id) || [];

    return (
      <Box key={object.id} sx={{ ml: level * 2 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            py: 1,
            px: 1,
            cursor: "pointer",
            borderRadius: "4px",
            color: "text.primary",
            "&:hover": { bgcolor: "secondary.main", color: "text.primary" },
          }}
          onClick={() => toggleNode(object.id)}
          data-testid={`tree-node-${object.id}`}
        >
          {hasChildren ? (
            isExpanded ? (
              <ExpandMoreIcon fontSize="small" color="inherit" />
            ) : (
              <ChevronRightIcon fontSize="small" color="inherit" />
            )
          ) : (
            <Box sx={{ width: 24 }} /> // Spacer
          )}
          <Typography sx={{ flexGrow: 1, ml: 1 }}>{object.name}</Typography>
          <IconButton
            size="small"
            color="inherit"
            onClick={(e) => handleSelectClick(object.id, e)}
            title={`Select ${objectTypeName.slice(0, -1)}`}
            data-testid={`select-button-${object.id}`}
          >
            <MapIcon fontSize="small" color="inherit" />
          </IconButton>
        </Box>

        {isExpanded && hasChildren && (
          <Box>
            {childObjects.map((childObject) => (
              <DefaultTreeNode
                key={childObject.id}
                object={childObject}
                level={level + 1}
              />
            ))}
          </Box>
        )}
      </Box>
    );
  };

  // Handle loading states
  if (isLoading)
    return (
      <Box sx={{ color: "text.primary" }} data-testid="loading-state">
        Loading {objectTypeName.toLowerCase()}...
      </Box>
    );
  if (error || !objects)
    return (
      <Box sx={{ color: "error.main" }} data-testid="error-state">
        Error loading {objectTypeName.toLowerCase()}
      </Box>
    );
  if (objects.length === 0)
    return (
      <Box sx={{ color: "text.primary" }} data-testid="empty-state">
        No {objectTypeName.toLowerCase()} available
      </Box>
    );

  // Get root level objects (those without a parentId)
  const rootObjects = objects.filter((object) => !object.parentId);

  return (
    <Box
      sx={{
        height: "100%",
        bgcolor: "background.default",
        color: "text.primary",
        overflow: "auto",
      }}
      data-testid="object-explorer"
    >
      <Box sx={{ p: 1 }}>
        <Typography
          variant="body2"
          color="text.secondary"
          data-testid="objects-count"
        >
          {objectTypeName} loaded: {objects.length}
        </Typography>
      </Box>

      <Box sx={{ mt: 1 }}>
        {rootObjects.map((object) => {
          // Use default tree node if no custom renderer
          if (!renderNode) {
            return <DefaultTreeNode key={object.id} object={object} />;
          }

          // For custom rendering, create a simple wrapper
          const renderedContent = renderNode(
            object,
            () => toggleNode(object.id),
            (e) => handleSelectClick(object.id, e)
          );

          // Return the rendered content in a Box
          return (
            <Box key={object.id}>{renderedContent as React.ReactElement}</Box>
          );
        })}
      </Box>
    </Box>
  );
}

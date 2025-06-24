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
  type,
  objectTypeName,
  renderNode,
}: ObjectExplorerProps<T>) {
  // Determine display type name: use provided or default from constructor
  const typeName = objectTypeName ?? `${type.name}s`;

  // Use the orbital theme if available, otherwise fall back to the default MUI theme
  const orbitalTheme = useOrbitalTheme();
  const defaultTheme = useTheme();
  const theme = orbitalTheme || defaultTheme;

  const { data: objects, isLoading, error } = queryResult;
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>(
    {}
  );

  const toggleNode = (id: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  const handleSelectClick = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const selectedObject = objects?.find((obj: T) => obj.id === id);
    if (selectedObject) {
      onSelect(selectedObject.id);
    }
  };

  const DefaultTreeNode = ({
    object,
    level = 0,
  }: {
    object: T;
    level?: number;
  }) => {
    const hasChildren = objects?.some((o: T) => o.parentId === object.id);
    const isExpanded = expandedNodes[object.id] || false;
    const childObjects =
      objects?.filter((o: T) => o.parentId === object.id) || [];

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
            <Box sx={{ width: 24 }} />
          )}
          <Typography sx={{ flexGrow: 1, ml: 1 }}>{object.name}</Typography>
          <IconButton
            size="small"
            color="inherit"
            onClick={(e) => handleSelectClick(object.id, e)}
            title={`Select ${type.name}`}
            data-testid={`select-button-${object.id}`}
          >
            <MapIcon fontSize="small" color="inherit" />
          </IconButton>
        </Box>
        {isExpanded && hasChildren && (
          <Box>
            {childObjects.map((child: T) => (
              <DefaultTreeNode
                key={child.id}
                object={child}
                level={level + 1}
              />
            ))}
          </Box>
        )}
      </Box>
    );
  };

  if (isLoading) {
    return (
      <Box sx={{ color: "text.primary" }} data-testid="loading-state">
        Loading {typeName.toLowerCase()}...
      </Box>
    );
  }
  if (error || !objects) {
    return (
      <Box sx={{ color: "error.main" }} data-testid="error-state">
        Error loading {typeName.toLowerCase()}
      </Box>
    );
  }
  if (objects.length === 0) {
    return (
      <Box sx={{ color: "text.primary" }} data-testid="empty-state">
        No {typeName.toLowerCase()} available
      </Box>
    );
  }

  const rootObjects = objects.filter((obj: T) => !obj.parentId);

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
          {typeName} loaded: {objects.length}
        </Typography>
      </Box>
      <Box sx={{ mt: 1 }}>
        {rootObjects.map((obj: T) =>
          !renderNode ? (
            <DefaultTreeNode key={obj.id} object={obj} />
          ) : (
            <Box key={obj.id}>
              {
                renderNode(
                  obj,
                  () => toggleNode(obj.id),
                  (e) => handleSelectClick(obj.id, e)
                ) as React.ReactElement
              }
            </Box>
          )
        )}
      </Box>
    </Box>
  );
}

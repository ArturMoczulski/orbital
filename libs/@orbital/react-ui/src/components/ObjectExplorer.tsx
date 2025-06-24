import React, { useState } from "react";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import MapIcon from "@mui/icons-material/Map";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import Typography from "@mui/material/Typography";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import AddIcon from "@mui/icons-material/Add";
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
  const typeName = objectTypeName ?? `${type.name}s`;
  const theme = useOrbitalTheme() || useTheme();

  const { data, isLoading, error } = queryResult;
  const objects: T[] = data ?? [];

  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>(
    {}
  );
  const [showAddModal, setShowAddModal] = useState(false);

  const openAddModal = () => setShowAddModal(true);
  const closeAddModal = () => setShowAddModal(false);

  const toggleNode = (id: string) => {
    setExpandedNodes((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const handleSelectClick = (id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const selected = objects.find((o) => o.id === id);
    if (selected) onSelect(selected.id);
  };

  const DefaultTreeNode = ({
    object,
    level = 0,
  }: {
    object: T;
    level?: number;
  }) => {
    const children = objects.filter((o) => o.parentId === object.id);
    const isExpanded = !!expandedNodes[object.id];

    return (
      <Box key={object.id} sx={{ ml: level * 2 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            py: 1,
            px: 1,
            cursor: "pointer",
            borderRadius: 1,
            "&:hover": { bgcolor: "secondary.main" },
          }}
          onClick={() => toggleNode(object.id)}
          data-testid={`tree-node-${object.id}`}
        >
          {children.length > 0 ? (
            isExpanded ? (
              <ExpandMoreIcon fontSize="small" />
            ) : (
              <ChevronRightIcon fontSize="small" />
            )
          ) : (
            <Box sx={{ width: 24 }} />
          )}
          <Typography sx={{ flexGrow: 1, ml: 1 }}>{object.name}</Typography>
          <IconButton
            size="small"
            onClick={(e) => handleSelectClick(object.id, e)}
            title={`Select ${type.name}`}
            data-testid={`select-button-${object.id}`}
          >
            <MapIcon fontSize="small" />
          </IconButton>
        </Box>
        {isExpanded && children.length > 0 && (
          <Box>
            {children.map((child) => (
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
      <Box sx={{ p: 2, color: "text.primary" }} data-testid="loading-state">
        Loading {typeName.toLowerCase()}...
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 2, color: "error.main" }} data-testid="error-state">
        Error loading {typeName.toLowerCase()}
      </Box>
    );
  }

  const rootObjects = objects.filter((o) => !o.parentId);

  return (
    <>
      <Box
        sx={{
          height: "100%",
          bgcolor: "background.default",
          color: "text.primary",
          display: "flex",
          flexDirection: "column",
        }}
        data-testid="object-explorer"
      >
        {/* Header */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            p: 1,
            borderBottom: 1,
            borderColor: "divider",
          }}
        >
          <Typography variant="body2" color="text.secondary">
            {typeName} loaded: {objects.length}
          </Typography>
          <IconButton
            size="small"
            onClick={openAddModal}
            title="Add object"
            data-testid="add-object-button"
            sx={{
              bgcolor: "primary.main",
              color: "primary.contrastText",
              "&:hover": { bgcolor: "primary.dark" },
            }}
          >
            <AddIcon />
          </IconButton>
        </Box>

        {/* Body or Empty State */}
        <Box sx={{ flexGrow: 1, overflow: "auto", p: 1 }}>
          {rootObjects.length === 0 ? (
            <Box
              sx={{
                display: "flex",
                flexDirection: "column",
                justifyContent: "center",
                alignItems: "center",
                height: "100%",
              }}
              data-testid="empty-state"
            >
              <Typography color="text.secondary" sx={{ mb: 1 }}>
                No {typeName.toLowerCase()} available
              </Typography>
              <IconButton
                size="large"
                onClick={openAddModal}
                title="Add object"
                data-testid="add-object-button-empty"
                sx={{
                  bgcolor: "primary.main",
                  color: "primary.contrastText",
                  "&:hover": { bgcolor: "primary.dark" },
                }}
              >
                <AddIcon fontSize="large" />
              </IconButton>
            </Box>
          ) : (
            rootObjects.map((obj) =>
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
            )
          )}
        </Box>
      </Box>

      {/* Add Object Modal */}
      <Dialog
        open={showAddModal}
        onClose={closeAddModal}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            width: "80%",
            height: "80%",
            border: "2px solid",
            borderColor: "primary.main",
          },
        }}
      >
        <DialogTitle>Add Object</DialogTitle>
      </Dialog>
    </>
  );
}

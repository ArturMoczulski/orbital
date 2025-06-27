import AddIcon from "@mui/icons-material/Add";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import DeleteIcon from "@mui/icons-material/Delete";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { kebabCase } from "lodash";
import React, { useState } from "react";
import { ZodBridge } from "uniforms-bridge-zod";
import { AutoForm } from "uniforms-mui";
import { z } from "zod";
import { useOrbitalTheme } from "../../theme/ThemeContext";
import { ExplorerObject, ObjectExplorerProps } from "../types";
import { ObjectExplorerItemActionButton } from "./ObjectExplorerItemActionButton";

/**
 * A generic tree-view component for displaying hierarchical objects
 */
export function ObjectExplorer<T extends ExplorerObject>({
  queryResult,
  onSelect,
  type,
  objectTypeName,
  renderNode,
  schema: providedSchema,
  onAdd,
  onDelete,
  itemActions,
}: ObjectExplorerProps<T>) {
  const typeName = objectTypeName ?? `${type.name}s`;
  const typePrefix = kebabCase(type.name.toLowerCase());
  const theme = useOrbitalTheme() || useTheme();

  const { data, isLoading, error } = queryResult;
  const objects: T[] = data ?? [];

  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>(
    {}
  );
  const [showAddModal, setShowAddModal] = useState(false);

  const openAddModal = () => setShowAddModal(true);
  const closeAddModal = () => setShowAddModal(false);

  const toggleNode = (_id: string) => {
    setExpandedNodes((prev) => ({ ...prev, [_id]: !prev[_id] }));
  };

  const handleSelectClick = (_id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    const selected = objects.find((o) => o._id === _id);
    if (selected && onSelect) onSelect(selected._id);
  };

  const handleDeleteClick = (_id: string, event: React.MouseEvent) => {
    event.stopPropagation();
    if (
      onDelete &&
      confirm(
        `Are you sure you want to delete this ${type.name.toLowerCase()}?`
      )
    ) {
      onDelete(_id);
    }
  };

  const DefaultTreeNode = ({
    object,
    level = 0,
  }: {
    object: T;
    level?: number;
  }) => {
    const children = objects.filter((o) => o.parentId === object._id);
    const isExpanded = !!expandedNodes[object._id];

    return (
      <Box key={object._id} sx={{ ml: level * 2 }}>
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
          onClick={() => toggleNode(object._id)}
          data-testid={`${typePrefix}-tree-node-${object._id}`}
          data-cy={`${typePrefix}-tree-node-${object._id}`}
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

          {/* Action buttons container */}
          <Box sx={{ display: "flex", alignItems: "center" }}>
            {/* Custom item actions */}
            {itemActions && itemActions(object)}

            {/* Delete button (if onDelete is provided) */}
            {onDelete && (
              <ObjectExplorerItemActionButton
                icon={<DeleteIcon fontSize="small" />}
                onClick={(e: React.MouseEvent) =>
                  handleDeleteClick(object._id, e)
                }
                title={`Delete ${type.name}`}
                testId={`${typePrefix}-delete-button-${object._id}`}
                dataCy={`${typePrefix}-delete-button-${object._id}`}
              />
            )}
          </Box>
        </Box>
        {isExpanded && children.length > 0 && (
          <Box>
            {children.map((child) => (
              <DefaultTreeNode
                key={child._id}
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
      <Box
        sx={{ p: 2, color: "text.primary" }}
        data-testid={`${typePrefix}-loading-state`}
      >
        Loading {typeName.toLowerCase()}...
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{ p: 2, color: "error.main" }}
        data-testid={`${typePrefix}-error-state`}
      >
        Error loading {typeName.toLowerCase()}
      </Box>
    );
  }

  const rootObjects = objects.filter((o) => !o.parentId);

  // Create a very simple schema for the form with basic types
  // that are known to work with ZodBridge
  const simpleSchema = z.object({
    name: z.string().min(1, "Name is required"),
    parentId: z.string().optional(),
    worldId: z.string().optional(),
  });

  // Create the form schema bridge
  const formSchema = new ZodBridge({ schema: simpleSchema });

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
        data-testid={`${typePrefix}-explorer`}
        data-cy={`${typePrefix}-explorer`}
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
            data-testid={`${typePrefix}-add-button`}
            data-cy={`${typePrefix}-add-button`}
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
              data-testid={`${typePrefix}-empty-state`}
            >
              <Typography color="text.secondary" sx={{ mb: 1 }}>
                No {typeName.toLowerCase()} available
              </Typography>
              <IconButton
                size="large"
                onClick={openAddModal}
                title="Add new object"
                data-testid={`${typePrefix}-add-button-empty`}
                data-cy={`${typePrefix}-add-button-empty`}
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
                <DefaultTreeNode key={obj._id} object={obj} />
              ) : (
                <Box key={obj._id}>
                  {
                    renderNode(
                      obj,
                      () => toggleNode(obj._id),
                      (e) => handleSelectClick(obj._id, e)
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
        data-cy={`${typePrefix}-add-dialog`}
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
        <DialogTitle>Add New Object</DialogTitle>
        <Box sx={{ p: 3 }} data-cy={`${typePrefix}-add-form`}>
          <AutoForm
            schema={formSchema}
            onSubmit={(data) => {
              if (onAdd) {
                onAdd(data);
                closeAddModal();
              } else {
                console.log("Form submitted:", data);
              }
            }}
          />
        </Box>
      </Dialog>
    </>
  );
}

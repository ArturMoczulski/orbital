import AddIcon from "@mui/icons-material/Add";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import IconButton from "@mui/material/IconButton";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { lowerFirst } from "lodash";
import React, { useEffect, useState } from "react";
import { ZodBridge } from "uniforms-bridge-zod";
import { AutoForm } from "uniforms-mui";
import { z } from "zod";
import { useOrbitalTheme } from "../../theme/ThemeContext";
import { useNotification } from "../NotificationProvider/NotificationProvider";
import { ExplorerObject, ObjectExplorerProps, QueryResult } from "../types";
import { DefaultTreeNodeActions } from "./DefaultTreeNodeActions";

/**
 * A generic tree-view component for displaying hierarchical objects
 */
export function ObjectExplorer<T extends ExplorerObject>({
  queryResult: providedQueryResult,
  onSelect,
  type,
  objectTypeName,
  renderNode,
  schema: providedSchema,
  onAdd: providedOnAdd,
  onDelete: providedOnDelete,
  itemActions,
  api,
  query: customQuery,
}: ObjectExplorerProps<T>) {
  // Infer type name and prefix from type
  const typeName = objectTypeName ?? `${type}s`;
  // Create PascalCase version for test IDs
  const typePrefixPascal = type.charAt(0).toUpperCase() + type.slice(1);
  const theme = useOrbitalTheme() || useTheme();

  // Determine which query to use
  let queryResult: QueryResult<T>;

  if (providedQueryResult) {
    // Use the provided query result
    queryResult = providedQueryResult;
  } else if (customQuery) {
    // Use the custom query hook
    queryResult = customQuery();
  } else if (api?.queryHook) {
    // Use the API's query hook
    queryResult = api.queryHook();
  } else {
    // No query available, throw an error
    throw new Error(
      `No query available for type '${type}'. Either provide 'queryResult', 'query', or ensure the API has a 'queryHook' property.`
    );
  }

  const { data, isLoading, error } = queryResult;
  const objects: T[] = data ?? [];

  // Use the mutation hooks if available
  const [createMutation] = api?.createHook ? api.createHook() : [null];
  const [deleteMutation] = api?.deleteHook ? api.deleteHook() : [null];

  // Create handlers that use the API hooks
  const { notify } = useNotification();

  // Show notification when there's an error in the query result
  useEffect(() => {
    if (error) {
      const errorMessage =
        error?.data?.message ||
        error?.message ||
        `Error loading ${lowerFirst(typeName)}`;
      notify(errorMessage, "error");
    }
  }, [error, notify, typeName]);

  const handleApiAdd = async (object: Partial<T>) => {
    if (!createMutation) {
      const errorMessage = `No create endpoint function found for type '${type}'. The API must provide a 'createHook' property.`;
      notify(errorMessage, "error");
      throw new Error(errorMessage);
    }

    // RTK Query endpoints for admin API expect an object with a DTO property
    // The property name follows the convention: create{Type}Dto
    const createDtoName = `create${type}Dto`;

    // Create the payload with the correct structure
    // For example: { createAreaDto: object }
    const payload = { [createDtoName]: object };

    try {
      return await createMutation(payload).unwrap();
    } catch (error: any) {
      const errorMessage =
        error?.data?.message ||
        error?.message ||
        `Failed to create ${lowerFirst(type)}`;
      notify(errorMessage, "error");
      console.error("Error in handleApiAdd:", error);
      throw error;
    }
  };

  const handleApiDelete = async (objectId: string) => {
    if (!deleteMutation) {
      const errorMessage = `No delete endpoint function found for type '${type}'. The API must provide a 'deleteHook' property.`;
      notify(errorMessage, "error");
      throw new Error(errorMessage);
    }

    try {
      return await deleteMutation({ _id: objectId }).unwrap();
    } catch (error: any) {
      const errorMessage =
        error?.data?.message ||
        error?.message ||
        `Failed to delete ${lowerFirst(type)}`;
      notify(errorMessage, "error");
      console.error("Error in handleApiDelete:", error);
      throw error;
    }
  };

  // Use provided handlers or fall back to API-based handlers
  const onAdd = providedOnAdd || (api?.createHook ? handleApiAdd : undefined);
  const onDelete =
    providedOnDelete || (api?.deleteHook ? handleApiDelete : undefined);

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
    if (onDelete) {
      // Use the notification system to confirm deletion
      if (
        window.confirm(
          `Are you sure you want to delete this ${lowerFirst(type)}?`
        )
      ) {
        try {
          onDelete(_id);
          notify(`${type} deleted successfully`, "success");
        } catch (error: any) {
          // Error handling is already in handleApiDelete, this is just a fallback
          const errorMessage =
            error?.message || `Failed to delete ${lowerFirst(type)}`;
          notify(errorMessage, "error");
        }
      }
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
          data-testid="TreeNode"
          data-object-id={object._id}
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
            {/* Render default actions or custom actions */}
            {(() => {
              // Create the default actions component
              const defaultActions = (
                <DefaultTreeNodeActions
                  object={object}
                  type={type}
                  onDelete={onDelete ? handleDeleteClick : undefined}
                />
              );

              // If custom item actions are provided, pass them the default actions
              return itemActions
                ? itemActions(object, defaultActions)
                : defaultActions;
            })()}
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
        data-testid="ObjectExplorerLoadingState"
      >
        Loading {typeName.toLowerCase()}...
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{ p: 2, color: "error.main" }}
        data-testid="ObjectExplorerErrorState"
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
        data-testid={`ObjectExplorer ${typePrefixPascal}Explorer`}
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
            data-testid="AddButton"
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
              data-testid="EmptyState"
            >
              <Typography color="text.secondary" sx={{ mb: 1 }}>
                No {typeName.toLowerCase()} available
              </Typography>
              <IconButton
                size="large"
                onClick={openAddModal}
                title="Add new object"
                data-testid="AddButtonEmpty"
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
        data-testid="ObjectExplorerAddDialog"
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
        <Box sx={{ p: 3 }} data-testid="AddForm">
          <AutoForm
            schema={formSchema}
            onSubmit={async (data) => {
              if (onAdd) {
                try {
                  await onAdd(data as Partial<T>);
                  notify(`${type} created successfully`, "success");
                  closeAddModal();
                } catch (error: any) {
                  // Error handling is already in handleApiAdd, this is just a fallback
                  // The modal will stay open so the user can correct the input
                  console.error("Form submission error:", error);
                }
              } else {
                console.log("Form submitted:", data);
                notify("No handler provided for form submission", "warning");
              }
            }}
          />
        </Box>
      </Dialog>
    </>
  );
}

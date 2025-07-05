import AddIcon from "@mui/icons-material/Add";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import { useTheme } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import { RelationshipType } from "@orbital/core/src/zod/reference/reference";
import { lowerFirst } from "lodash";
import React, { useEffect, useState } from "react";
import { ZodBridge } from "uniforms-bridge-zod";
import { z } from "zod";
import { ZodReferencesBridge } from "../../forms/ZodReferencesBridge";
import { useOrbitalTheme } from "../../theme/ThemeContext";
import { useNotification } from "../NotificationProvider/NotificationProvider";
import { QueryResult, TreeExplorerProps, TreeNodeData } from "../types";
import { AddBranchDialog } from "./AddBranchDialog";
import { TreeNode } from "./TreeNode";

/**
 * A generic tree-view component for displaying hierarchical objects
 */
export function TreeExplorer<T extends TreeNodeData>({
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
}: TreeExplorerProps<T>) {
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

  const handleApiDelete = async (object: T) => {
    if (!deleteMutation) {
      const errorMessage = `No delete endpoint function found for type '${type}'. The API must provide a 'deleteHook' property.`;
      notify(errorMessage, "error");
      throw new Error(errorMessage);
    }

    try {
      return await deleteMutation({ _id: object._id }).unwrap();
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

  const handleSelectClick = (event: React.MouseEvent, object: T) => {
    event.stopPropagation();
    if (onSelect) onSelect(object);
  };

  const handleDeleteClick = (event: React.MouseEvent, object: T) => {
    event.stopPropagation();
    if (onDelete) {
      // Use the notification system to confirm deletion
      if (
        window.confirm(
          `Are you sure you want to delete this ${lowerFirst(type)}?`
        )
      ) {
        try {
          onDelete(object);
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

  if (isLoading) {
    return (
      <Box
        sx={{ p: 2, color: "text.primary" }}
        data-testid="TreeExplorerLoadingState"
      >
        Loading {typeName.toLowerCase()}...
      </Box>
    );
  }

  if (error) {
    return (
      <Box
        sx={{ p: 2, color: "error.main" }}
        data-testid="TreeExplorerErrorState"
      >
        Error loading {typeName.toLowerCase()}
      </Box>
    );
  }

  const rootObjects = objects.filter((o) => !o.parentId);

  // Create a schema for the form with reference support
  const formSchema = (() => {
    // If a schema was provided, use it
    if (providedSchema) {
      return providedSchema;
    }

    // Create a schema with references if we have world data
    const worldData =
      api?.queryHook && api.queryHook.name.includes("world")
        ? api.queryHook().data || []
        : [];

    // Create a schema with basic types and references
    const schema = z.object({
      name: z.string().min(1, "Name is required"),
      parentId: z.string().optional(),
      worldId: z
        .string()
        .reference({
          schema: z
            .object({
              _id: z.string(),
              name: z.string(),
              shard: z.string(),
              techLevel: z.number(),
            })
            .describe("A world in the game universe"),
          type: RelationshipType.MANY_TO_ONE,
          name: "world",
        })
        .optional(),
    });

    // Use ZodReferencesBridge if we have world data, otherwise use standard ZodBridge
    return worldData.length > 0
      ? new ZodReferencesBridge({
          schema,
          dependencies: {
            world: worldData,
          },
        })
      : new ZodBridge({ schema });
  })();

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
        data-testid={`TreeExplorer ${typePrefixPascal}Explorer`}
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
                <TreeNode
                  key={obj._id}
                  object={obj}
                  objects={objects}
                  expandedNodes={expandedNodes}
                  toggleNode={toggleNode}
                  type={type}
                  onDelete={onDelete ? handleDeleteClick : undefined}
                  itemActions={itemActions}
                />
              ) : (
                <Box key={obj._id}>
                  {
                    renderNode(
                      obj,
                      () => toggleNode(obj._id),
                      (e) => handleSelectClick(e, obj)
                    ) as React.ReactElement
                  }
                </Box>
              )
            )
          )}
        </Box>
      </Box>

      <AddBranchDialog<T>
        open={showAddModal}
        onClose={closeAddModal}
        type={type}
        onAdd={onAdd}
        notify={notify}
        formSchema={formSchema}
      />
    </>
  );
}

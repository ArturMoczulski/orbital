import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import React from "react";
import { TreeNodeData } from "../types";
import { TreeNodeActions } from "./TreeNodeActions";

interface TreeNodeProps<T extends TreeNodeData> {
  object: T;
  level?: number;
  objects: T[];
  expandedNodes: Record<string, boolean>;
  toggleNode: (id: string) => void;
  type: string;
  onDelete?: (event: React.MouseEvent, object: T) => void;
  itemActions?: (object: T, defaultActions: React.ReactNode) => React.ReactNode;
}

/**
 * Default tree node component for the TreeExplorer
 */
export function TreeNode<T extends TreeNodeData>({
  object,
  level = 0,
  objects,
  expandedNodes,
  toggleNode,
  type,
  onDelete,
  itemActions,
}: TreeNodeProps<T>) {
  const children = objects.filter((o) => o.parentId === object._id);
  const isExpanded = !!expandedNodes[object._id];

  const handleDeleteClick = (event: React.MouseEvent, obj: T) => {
    event.stopPropagation();
    if (onDelete) {
      onDelete(event, obj);
    }
  };

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
              <TreeNodeActions
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
            <TreeNode
              key={child._id}
              object={child}
              level={level + 1}
              objects={objects}
              expandedNodes={expandedNodes}
              toggleNode={toggleNode}
              type={type}
              onDelete={onDelete}
              itemActions={itemActions}
            />
          ))}
        </Box>
      )}
    </Box>
  );
}

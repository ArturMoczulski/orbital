import DeleteIcon from "@mui/icons-material/Delete";
import React from "react";
import { TreeNodeData } from "../types";
import { TreeNodeActionButton } from "./TreeNodeActionButton";

export interface TreeNodeActionsProps<T extends TreeNodeData> {
  object: T;
  type: string;
  onDelete?: (event: React.MouseEvent, object: T) => void;
}

/**
 * Default action buttons for TreeExplorer items
 * This component renders the standard action buttons (currently just delete)
 * It can be used as-is, extended, or completely replaced by custom itemActions
 */
export function TreeNodeActions<T extends TreeNodeData>({
  object,
  type,
  onDelete,
}: TreeNodeActionsProps<T>) {
  return (
    <>
      {/* Delete button (if onDelete is provided) */}
      {onDelete && (
        <TreeNodeActionButton
          icon={<DeleteIcon fontSize="small" />}
          onClick={(e: React.MouseEvent) => onDelete(e, object)}
          title={`Delete ${type}`}
          testId="DeleteButton"
          object={object}
        />
      )}
    </>
  );
}

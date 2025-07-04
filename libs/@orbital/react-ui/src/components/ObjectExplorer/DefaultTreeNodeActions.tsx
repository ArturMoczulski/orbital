import DeleteIcon from "@mui/icons-material/Delete";
import React from "react";
import { ExplorerObject } from "../types";
import { TreeNodeActionButton } from "./TreeNodeActionButton";

export interface DefaultTreeNodeActionsProps<T extends ExplorerObject> {
  object: T;
  type: string;
  onDelete?: (objectId: string, event: React.MouseEvent) => void;
}

/**
 * Default action buttons for ObjectExplorer items
 * This component renders the standard action buttons (currently just delete)
 * It can be used as-is, extended, or completely replaced by custom itemActions
 */
export function DefaultTreeNodeActions<T extends ExplorerObject>({
  object,
  type,
  onDelete,
}: DefaultTreeNodeActionsProps<T>) {
  return (
    <>
      {/* Delete button (if onDelete is provided) */}
      {onDelete && (
        <TreeNodeActionButton
          icon={<DeleteIcon fontSize="small" />}
          onClick={(e: React.MouseEvent) => onDelete(object._id, e)}
          title={`Delete ${type}`}
          testId="DeleteButton"
          objectId={object._id}
        />
      )}
    </>
  );
}

import DeleteIcon from "@mui/icons-material/Delete";
import React from "react";
import { ExplorerObject } from "../types";
import { ObjectExplorerItemActionButton } from "./ObjectExplorerItemActionButton";

export interface DefaultItemActionsProps<T extends ExplorerObject> {
  object: T;
  type: string;
  typePrefix: string;
  onDelete?: (objectId: string, event: React.MouseEvent) => void;
}

/**
 * Default action buttons for ObjectExplorer items
 * This component renders the standard action buttons (currently just delete)
 * It can be used as-is, extended, or completely replaced by custom itemActions
 */
export function DefaultItemActions<T extends ExplorerObject>({
  object,
  type,
  typePrefix,
  onDelete,
}: DefaultItemActionsProps<T>) {
  return (
    <>
      {/* Delete button (if onDelete is provided) */}
      {onDelete && (
        <ObjectExplorerItemActionButton
          icon={<DeleteIcon fontSize="small" />}
          onClick={(e: React.MouseEvent) => onDelete(object._id, e)}
          title={`Delete ${type}`}
          testId={`${typePrefix}-delete-button-${object._id}`}
          dataCy={`${typePrefix}-delete-button-${object._id}`}
        />
      )}
    </>
  );
}

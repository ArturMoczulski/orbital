import IconButton from "@mui/material/IconButton";
import React from "react";

export interface TreeNodeActionButtonProps<T extends { _id: string } = any> {
  icon: React.ReactNode;
  onClick: (e: React.MouseEvent, object?: T) => void;
  title: string;
  testId?: string;
  object?: T; // The object with _id field
}

/**
 * Standardized action button for TreeExplorer items
 * Provides consistent styling and behavior for all item actions
 */
export function TreeNodeActionButton<T extends { _id: string } = any>({
  icon,
  onClick,
  title,
  testId,
  object,
}: TreeNodeActionButtonProps<T>) {
  return (
    <IconButton
      size="small"
      onClick={(e) => {
        e.stopPropagation();
        onClick(e, object);
      }}
      title={title}
      data-testid={testId || "ActionButton"}
      data-object-id={object?._id}
      sx={{
        mx: 0.5,
      }}
    >
      {icon}
    </IconButton>
  );
}

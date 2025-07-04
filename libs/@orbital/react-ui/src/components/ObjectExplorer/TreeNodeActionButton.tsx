import IconButton from "@mui/material/IconButton";
import React from "react";

export interface TreeNodeActionButtonProps {
  icon: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  title: string;
  testId?: string;
  objectId?: string;
}

/**
 * Standardized action button for ObjectExplorer items
 * Provides consistent styling and behavior for all item actions
 */
export function TreeNodeActionButton({
  icon,
  onClick,
  title,
  testId,
  objectId,
}: TreeNodeActionButtonProps) {
  return (
    <IconButton
      size="small"
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      title={title}
      data-testid={testId || "ActionButton"}
      data-object-id={objectId}
      sx={{
        mx: 0.5,
      }}
    >
      {icon}
    </IconButton>
  );
}

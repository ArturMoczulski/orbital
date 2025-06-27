import IconButton from "@mui/material/IconButton";
import React from "react";

export interface ObjectExplorerItemActionButtonProps {
  icon: React.ReactNode;
  onClick: (e: React.MouseEvent) => void;
  title: string;
  testId?: string;
  dataCy?: string;
}

/**
 * Standardized action button for ObjectExplorer items
 * Provides consistent styling and behavior for all item actions
 */
export function ObjectExplorerItemActionButton({
  icon,
  onClick,
  title,
  testId,
  dataCy,
}: ObjectExplorerItemActionButtonProps) {
  return (
    <IconButton
      size="small"
      onClick={(e) => {
        e.stopPropagation();
        onClick(e);
      }}
      title={title}
      data-testid={testId}
      data-cy={dataCy}
      sx={{
        mx: 0.5,
      }}
    >
      {icon}
    </IconButton>
  );
}

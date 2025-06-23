import React, { useState } from "react";
import { useGetAreasQuery } from "../services/areaApi";
import Box from "@mui/material/Box";
import IconButton from "@mui/material/IconButton";
import MapIcon from "@mui/icons-material/Map";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import Typography from "@mui/material/Typography";
import type { Area } from "../services/areaApi";

interface ObjectExplorerProps {
  onSelect: (areaId: string) => void;
}

export default function ObjectExplorer({ onSelect }: ObjectExplorerProps) {
  const { data: areas, isLoading, error } = useGetAreasQuery();
  const [expandedNodes, setExpandedNodes] = useState<Record<string, boolean>>(
    {}
  );

  // Debug: Log areas data
  console.log("Areas data:", areas);

  // Handle expanding/collapsing nodes
  const toggleNode = (id: string) => {
    setExpandedNodes((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Handle clicking the load button
  const handleLoadClick = (id: string, event: React.MouseEvent) => {
    event.stopPropagation(); // Prevent triggering the tree node toggle
    console.log("Load button clicked for area:", id);
    onSelect(id);
    console.log("onSelect called with id:", id);
  };

  // Custom tree node component
  const TreeNode = ({ area, level = 0 }: { area: Area; level?: number }) => {
    const hasChildren = areas?.some((a) => a.parentId === area.id);
    const isExpanded = expandedNodes[area.id] || false;
    const childAreas = areas?.filter((a) => a.parentId === area.id) || [];

    return (
      <Box key={area.id} sx={{ ml: level * 2 }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            py: 1,
            px: 1,
            cursor: "pointer",
            "&:hover": { bgcolor: "rgba(0, 0, 0, 0.04)" },
          }}
          onClick={() => toggleNode(area.id)}
        >
          {hasChildren ? (
            isExpanded ? (
              <ExpandMoreIcon fontSize="small" />
            ) : (
              <ChevronRightIcon fontSize="small" />
            )
          ) : (
            <Box sx={{ width: 24 }} /> // Spacer
          )}
          <Typography sx={{ flexGrow: 1, ml: 1 }}>{area.name}</Typography>
          <IconButton
            size="small"
            onClick={(e) => handleLoadClick(area.id, e)}
            title="Load area map"
          >
            <MapIcon fontSize="small" />
          </IconButton>
        </Box>

        {isExpanded && hasChildren && (
          <Box>
            {childAreas.map((childArea) => (
              <TreeNode key={childArea.id} area={childArea} level={level + 1} />
            ))}
          </Box>
        )}
      </Box>
    );
  };

  // Handle loading states
  if (isLoading) return <div>Loading areas...</div>;
  if (error || !areas) return <div>Error loading areas</div>;
  if (areas.length === 0) return <div>No areas available</div>;

  // Get root level areas (those without a parentId)
  const rootAreas = areas.filter((area) => !area.parentId);

  return (
    <Box
      sx={{ height: "100%", bgcolor: "background.default", overflow: "auto" }}
    >
      <Box sx={{ p: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Areas loaded: {areas.length}
        </Typography>
      </Box>

      <Box sx={{ mt: 1 }}>
        {rootAreas.map((area) => (
          <TreeNode key={area.id} area={area} />
        ))}
      </Box>
    </Box>
  );
}

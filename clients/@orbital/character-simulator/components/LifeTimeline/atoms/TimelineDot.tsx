import TimelineDot from "@mui/lab/TimelineDot";
import { styled } from "@mui/material/styles";

// Styled version of MUI TimelineDot with customizable color
const StyledTimelineDot = styled(TimelineDot)(({ theme, color }) => ({
  backgroundColor: color || theme.palette.primary.main,
}));

export interface CustomTimelineDotProps {
  color?: string;
  category?: string;
}

// Custom TimelineDot component that accepts a color prop
// Map of category to color
const categoryColorMap: Record<string, string> = {
  work: "#4caf50", // Green
  education: "#2196f3", // Blue
  social: "#ff9800", // Orange
  health: "#f44336", // Red
  travel: "#9c27b0", // Purple
  entertainment: "#e91e63", // Pink
  family: "#3f51b5", // Indigo
  personal: "#009688", // Teal
  default: "#757575", // Grey
};

const CustomTimelineDot: React.FC<CustomTimelineDotProps> = ({
  color,
  category,
}) => {
  // If category is provided, use the color from the map, otherwise use the provided color
  const dotColor = category
    ? categoryColorMap[category.toLowerCase()] || categoryColorMap.default
    : color;

  return <StyledTimelineDot sx={{ bgcolor: dotColor }} />;
};

export default CustomTimelineDot;

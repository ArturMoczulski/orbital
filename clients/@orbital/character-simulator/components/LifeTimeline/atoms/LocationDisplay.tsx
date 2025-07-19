import { Typography } from "@mui/material";

interface LocationDisplayProps {
  location: string;
  variant?: "body1" | "body2" | "caption";
  icon?: boolean;
}

/**
 * LocationDisplay component for displaying location information
 *
 * @param location - The location text to display
 * @param variant - MUI Typography variant (default: "caption")
 * @param icon - Whether to show the location pin icon (default: true)
 */
const LocationDisplay: React.FC<LocationDisplayProps> = ({
  location,
  variant = "caption",
  icon = true,
}) => {
  return (
    <Typography variant={variant} color="text.secondary">
      {icon ? "📍 " : ""}
      {location}
    </Typography>
  );
};

export default LocationDisplay;

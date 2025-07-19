import { Chip, ChipProps } from "@mui/material";

interface TimelineChipProps extends Omit<ChipProps, "color"> {
  label: string;
  color?: string;
  textColor?: string;
}

/**
 * TimelineChip component for displaying chips with custom colors
 *
 * @param label - The text to display in the chip
 * @param color - Background color (can be hex, rgb, or theme color)
 * @param textColor - Text color (default: "white")
 * @param props - Other MUI Chip props
 */
const TimelineChip: React.FC<TimelineChipProps> = ({
  label,
  color,
  textColor = color ? "#f0f0f0" : "inherit", // Use light gray for colored chips, inherit for default
  ...props
}) => {
  return (
    <Chip
      label={label}
      size="small"
      sx={{
        bgcolor: color,
        color: textColor,
        ...props.sx,
      }}
      {...props}
    />
  );
};

export default TimelineChip;

import TimelineConnector from "@mui/lab/TimelineConnector";
import { styled } from "@mui/material/styles";

// Styled version of MUI TimelineConnector with customizable color
const StyledTimelineConnector = styled(TimelineConnector)(
  ({ theme, color }) => ({
    backgroundColor: color || theme.palette.grey[400],
  })
);

interface CustomTimelineConnectorProps {
  color?: string;
}

// Custom TimelineConnector component that accepts a color prop
const CustomTimelineConnector: React.FC<CustomTimelineConnectorProps> = ({
  color,
}) => {
  return <StyledTimelineConnector sx={{ bgcolor: color }} />;
};

export default CustomTimelineConnector;

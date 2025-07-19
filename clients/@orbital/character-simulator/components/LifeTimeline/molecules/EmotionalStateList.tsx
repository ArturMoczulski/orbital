import { Box, Typography } from "@mui/material";
import { TimelineChip } from "../atoms";

interface EmotionalStateListProps {
  emotionalState: string[] | string;
}

/**
 * EmotionalStateList component for displaying a list of emotional states
 *
 * @param emotionalState - The emotional state(s) to display
 */
const EmotionalStateList: React.FC<EmotionalStateListProps> = ({
  emotionalState,
}) => {
  // Return null if emotionalState is falsy or an empty array
  if (
    !emotionalState ||
    (Array.isArray(emotionalState) && emotionalState.length === 0)
  ) {
    return null;
  }

  return (
    <Box
      sx={{
        mt: 1,
        display: "flex",
        flexWrap: "wrap",
        gap: 0.5,
      }}
    >
      <Typography variant="subtitle2" color="text.secondary" sx={{ mr: 1 }}>
        Feeling:
      </Typography>
      {Array.isArray(emotionalState) ? (
        emotionalState.map((emotion, index) => (
          <TimelineChip key={index} label={emotion} variant="outlined" />
        ))
      ) : (
        <TimelineChip label={emotionalState} variant="outlined" />
      )}
    </Box>
  );
};

export default EmotionalStateList;

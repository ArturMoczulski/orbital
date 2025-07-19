import { Box, Typography } from "@mui/material";

interface ThoughtsListProps {
  thoughts: string[] | string;
}

/**
 * ThoughtsList component for displaying thoughts
 *
 * @param thoughts - The thoughts to display
 */
const ThoughtsList: React.FC<ThoughtsListProps> = ({ thoughts }) => {
  // Return null if thoughts is falsy or an empty array
  if (!thoughts || (Array.isArray(thoughts) && thoughts.length === 0)) {
    return null;
  }

  return (
    <Box sx={{ mt: 2 }}>
      <Typography variant="subtitle2" color="text.secondary">
        Thoughts:
      </Typography>
      <Typography variant="body2" sx={{ fontStyle: "italic" }}>
        {Array.isArray(thoughts) ? thoughts.join(" ") : thoughts}
      </Typography>
    </Box>
  );
};

export default ThoughtsList;

import { Box, Card, CardContent, Typography } from "@mui/material";
import { TimelineChip } from "../atoms";
import EmotionalStateList from "./EmotionalStateList";
import SocialMediaPost from "./SocialMediaPost";
import ThoughtsList from "./ThoughtsList";

// Import the LifeEvent interface from store
import { LifeEvent } from "../../../store";

// Helper function to get category color
const getCategoryColor = (category: string) => {
  const categories: Record<string, string> = {
    birth: "#4CAF50", // Green
    childhood: "#2196F3", // Blue
    education: "#9C27B0", // Purple
    career: "#FF9800", // Orange
    relationship: "#E91E63", // Pink
    family: "#673AB7", // Deep Purple
    achievement: "#FFC107", // Amber
    travel: "#00BCD4", // Cyan
    health: "#F44336", // Red
    death: "#000000", // Black
    "Physical Needs": "#4CAF50", // Green
    "Social Needs": "#2196F3", // Blue
    "Cognitive Needs": "#9C27B0", // Purple
    "Emotional Needs": "#E91E63", // Pink
    Activity: "#607D8B", // Blue-grey
  };

  return categories[category] || "#607D8B"; // Default to blue-grey
};

interface TimelineEventCardProps {
  event: LifeEvent;
  showSocialMedia?: boolean;
}

/**
 * TimelineEventCard component for displaying a single timeline event
 *
 * @param event - The life event to display
 * @param showSocialMedia - Whether to show social media indicators (default: true)
 */
const TimelineEventCard: React.FC<TimelineEventCardProps> = ({
  event,
  showSocialMedia = true,
}) => {
  // Determine if this is a social media post
  const hasSocialMedia = !!event.socialMediaContent && showSocialMedia;

  // Default category for styling
  const category = "Activity";

  return (
    <Card
      variant="outlined"
      sx={{
        mb: 2,
        border: hasSocialMedia ? "2px solid #1DA1F2" : undefined,
        boxShadow: hasSocialMedia
          ? "0 0 10px rgba(29, 161, 242, 0.3)"
          : undefined,
      }}
    >
      <CardContent>
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            mb: 1,
          }}
        >
          <Box sx={{ display: "flex", gap: 1 }}>
            <TimelineChip
              label={category}
              color={getCategoryColor(category)}
              textColor="white"
            />
            {/* Social media chip is now shown in the SocialMediaPost component */}
          </Box>
        </Box>
        <Typography variant="body1">{event.activity}</Typography>

        {/* Display thoughts if available */}
        {event.thoughts && <ThoughtsList thoughts={event.thoughts} />}

        {/* Display emotional state if available */}
        {event.emotionalState && (
          <EmotionalStateList emotionalState={event.emotionalState} />
        )}

        {/* Display social media content if available */}
        {hasSocialMedia && event.socialMediaContent && (
          <Box sx={{ mt: 2 }}>
            <SocialMediaPost
              content={event.socialMediaContent}
              date={new Date(event.timestamp).toLocaleString()}
              platform="Social Media"
            />
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default TimelineEventCard;

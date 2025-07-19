import SocialMediaIcon from "@mui/icons-material/Share";
import { Box, Card, CardContent, Chip, Typography } from "@mui/material";
import { TimelineChip } from "../atoms";

interface SocialMediaContent {
  postType?: string;
  promptImage?: string;
  caption?: string;
}

interface SocialMediaPostProps {
  content: string | SocialMediaContent;
  date: string;
  platform?: string;
  align?: "left" | "right" | "center";
}

/**
 * SocialMediaPost component for displaying social media content
 *
 * @param content - The content of the social media post
 * @param date - The date of the post
 * @param platform - The social media platform (default: "Social Media")
 */
const SocialMediaPost: React.FC<SocialMediaPostProps> = ({
  content,
  date,
  platform = "Social Media",
  align = "left",
}) => {
  return (
    <Card
      variant="outlined"
      sx={{
        mb: 2,
        border: "2px solid #1DA1F2",
        boxShadow: "0 0 10px rgba(29, 161, 242, 0.3)",
        maxWidth: 350,
        marginLeft:
          align === "right" ? "auto" : align === "center" ? "auto" : undefined,
        marginRight:
          align === "left" ? "auto" : align === "center" ? "auto" : undefined,
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
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <TimelineChip
              icon={<SocialMediaIcon />}
              label={platform}
              color="primary"
              textColor="#333" // Darker text color for better visibility
            />
            {typeof content !== "string" && content.postType && (
              <Chip
                size="small"
                label={content.postType === "story" ? "Story" : "Feed Post"}
                color={content.postType === "story" ? "secondary" : "info"}
              />
            )}
          </Box>
          <Typography variant="caption" color="text.secondary">
            {date}
          </Typography>
        </Box>

        <Typography variant="body1">
          {typeof content === "string"
            ? content
            : content.caption || "No caption provided"}
        </Typography>

        {/* Display prompt image text in cursive if available */}
        {typeof content !== "string" && content.promptImage && (
          <Box
            sx={{
              mt: 2,
              bgcolor: "#f5f5f5",
              p: 1.5,
              borderRadius: 1,
              borderTop: "1px solid #eee",
            }}
          >
            <Typography
              variant="caption"
              sx={{
                display: "block",
                mb: 0.5,
                fontWeight: "bold",
                color: "text.secondary",
              }}
            >
              Image Generation Prompt
            </Typography>
            <Typography
              variant="body2"
              sx={{
                fontStyle: "italic",
                color: "text.secondary",
              }}
            >
              {content.promptImage}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

export default SocialMediaPost;

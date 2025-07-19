import { Box, Paper, Typography } from "@mui/material";
import { styled } from "@mui/material/styles";
import { Message } from "../../../store";

interface MessageBubbleProps {
  message: Message;
}

// Styled components for different message types
const UserMessagePaper = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.primary.contrastText,
  padding: theme.spacing(1, 2),
  maxWidth: "70%",
  borderRadius: "18px 18px 0 18px",
  marginLeft: "auto",
  marginBottom: theme.spacing(1),
}));

const CharacterMessagePaper = styled(Paper)(({ theme }) => ({
  backgroundColor: theme.palette.grey[200],
  padding: theme.spacing(1, 2),
  maxWidth: "70%",
  borderRadius: "18px 18px 18px 0",
  marginRight: "auto",
  marginBottom: theme.spacing(1),
}));

const MessageBubble = ({ message }: MessageBubbleProps) => {
  const isUserMessage = message.sender === "user";
  const MessageContainer = isUserMessage
    ? UserMessagePaper
    : CharacterMessagePaper;

  // Format the timestamp
  const formattedTime = new Date(message.timestamp).toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <Box sx={{ display: "flex", flexDirection: "column", width: "100%" }}>
      <MessageContainer>
        <Typography variant="body1">{message.content}</Typography>
      </MessageContainer>
      <Typography
        variant="caption"
        color="text.secondary"
        sx={{
          alignSelf: isUserMessage ? "flex-end" : "flex-start",
          mb: 1,
          mx: 1,
        }}
      >
        {formattedTime}
      </Typography>
    </Box>
  );
};

export default MessageBubble;

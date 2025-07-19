import { Box, CircularProgress, Typography } from "@mui/material";
import { useEffect, useRef } from "react";
import { Message } from "../../../store";
import MessageBubble from "../atoms/MessageBubble";

interface MessageListProps {
  messages: Message[];
  characterName: string;
  isLoading?: boolean;
}

const MessageList = ({
  messages,
  characterName,
  isLoading = false,
}: MessageListProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        height: "400px",
        overflowY: "auto",
        p: 2,
        bgcolor: "background.default",
        borderRadius: 2,
      }}
    >
      {isLoading ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
          }}
        >
          <CircularProgress />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
            Loading messages...
          </Typography>
        </Box>
      ) : messages.length === 0 ? (
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            height: "100%",
            opacity: 0.7,
          }}
        >
          <Typography variant="body1" color="text.secondary" align="center">
            No messages yet. Start a conversation with {characterName}.
          </Typography>
        </Box>
      ) : (
        messages.map((message) => (
          <MessageBubble key={message.id} message={message} />
        ))
      )}
      <div ref={messagesEndRef} />
    </Box>
  );
};

export default MessageList;

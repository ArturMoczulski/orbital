import { Send } from "@mui/icons-material";
import { Box, IconButton, TextField } from "@mui/material";
import { KeyboardEvent, useState } from "react";

interface MessageInputProps {
  onSendMessage: (content: string) => void;
  disabled?: boolean;
}

const MessageInput = ({
  onSendMessage,
  disabled = false,
}: MessageInputProps) => {
  const [message, setMessage] = useState("");

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSendMessage(message.trim());
      setMessage("");
    }
  };

  const handleKeyPress = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <Box sx={{ display: "flex", alignItems: "center", mt: 2 }}>
      <TextField
        fullWidth
        variant="outlined"
        placeholder="Type a message..."
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        disabled={disabled}
        multiline
        maxRows={4}
        sx={{
          "& .MuiOutlinedInput-root": {
            borderRadius: "24px",
            paddingRight: "14px",
          },
        }}
        InputProps={{
          endAdornment: (
            <IconButton
              color="primary"
              onClick={handleSend}
              disabled={!message.trim() || disabled}
              sx={{ ml: 1 }}
            >
              <Send />
            </IconButton>
          ),
        }}
      />
    </Box>
  );
};

export default MessageInput;

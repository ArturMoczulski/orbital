import { ListItemButton, ListItemText, Typography } from "@mui/material";
import { ConversationThread } from "../../../store";

interface ThreadItemProps {
  thread: ConversationThread;
  isSelected: boolean;
  onClick: () => void;
}

const ThreadItem = ({ thread, isSelected, onClick }: ThreadItemProps) => {
  // Format the date for the secondary text
  const formattedDate = new Date(thread.updatedAt).toLocaleDateString(
    undefined,
    {
      month: "short",
      day: "numeric",
      year: "numeric",
    }
  );

  // Get the last message preview if available
  const lastMessage =
    thread.messages.length > 0
      ? thread.messages[thread.messages.length - 1].content
      : "No messages yet";

  // Truncate the message if it's too long
  const messagePreview =
    lastMessage.length > 30
      ? `${lastMessage.substring(0, 30)}...`
      : lastMessage;

  return (
    <ListItemButton
      selected={isSelected}
      onClick={onClick}
      sx={{
        borderRadius: 1,
        mb: 0.5,
        "&.Mui-selected": {
          backgroundColor: "background.paper",
          border: "1px solid",
          borderColor: "primary.main",
        },
      }}
    >
      <ListItemText
        primary={
          <Typography
            variant="subtitle1"
            fontWeight={isSelected ? "bold" : "normal"}
            color="text.primary"
          >
            {thread.name}
          </Typography>
        }
        secondary={
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: "0.75rem",
            }}
          >
            <span>{messagePreview}</span>
            <span>{formattedDate}</span>
          </Typography>
        }
      />
    </ListItemButton>
  );
};

export default ThreadItem;

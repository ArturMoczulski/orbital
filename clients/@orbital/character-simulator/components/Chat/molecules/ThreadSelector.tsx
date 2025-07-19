import {
  Autocomplete,
  Box,
  CircularProgress,
  TextField,
  Typography,
} from "@mui/material";
import { ConversationThread } from "../../../store";
import NewThreadButton from "../atoms/NewThreadButton";

interface ThreadSelectorProps {
  threads: ConversationThread[];
  selectedThreadId: string | null;
  onSelectThread: (threadId: string) => void;
  onCreateThread: (name: string) => void;
  isLoading?: boolean;
}

const ThreadSelector = ({
  threads,
  selectedThreadId,
  onSelectThread,
  onCreateThread,
  isLoading = false,
}: ThreadSelectorProps) => {
  // Find the selected thread
  const selectedThread = threads.find((t) => t.id === selectedThreadId);

  return (
    <Box
      sx={{
        mb: 2,
        display: "flex",
        alignItems: "center",
        gap: 1,
      }}
    >
      <Autocomplete
        id="thread-selector"
        options={threads}
        getOptionLabel={(option) => option.name}
        value={selectedThread || null}
        onChange={(_, newValue) => {
          if (newValue) {
            onSelectThread(newValue.id);
          }
        }}
        loading={isLoading}
        sx={{ flexGrow: 1 }}
        renderInput={(params) => (
          <TextField
            {...params}
            label="Conversation"
            variant="outlined"
            size="small"
            InputProps={{
              ...params.InputProps,
              endAdornment: (
                <>
                  {isLoading ? (
                    <CircularProgress color="inherit" size={20} />
                  ) : null}
                  {params.InputProps.endAdornment}
                </>
              ),
            }}
          />
        )}
        renderOption={(props, option) => (
          <li {...props}>
            <Typography
              variant="body1"
              sx={{
                fontWeight: option.id === selectedThreadId ? "bold" : "normal",
              }}
            >
              {option.name}
            </Typography>
          </li>
        )}
        noOptionsText={
          <Typography variant="body2" color="text.secondary">
            No conversations yet. Create one to get started.
          </Typography>
        }
      />
      <NewThreadButton onCreateThread={onCreateThread} disabled={isLoading} />
    </Box>
  );
};

export default ThreadSelector;

import { Add } from "@mui/icons-material";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  TextField,
  Tooltip,
} from "@mui/material";
import { useState } from "react";

interface NewThreadButtonProps {
  onCreateThread: (name: string) => void;
  disabled?: boolean;
}

const NewThreadButton = ({
  onCreateThread,
  disabled = false,
}: NewThreadButtonProps) => {
  const [open, setOpen] = useState(false);
  const [threadName, setThreadName] = useState("");
  const [error, setError] = useState("");

  const handleOpen = () => {
    setOpen(true);
    setThreadName("");
    setError("");
  };

  const handleClose = () => {
    setOpen(false);
  };

  const validateThreadName = (name: string): boolean => {
    // Thread name should be filesystem safe
    // No special characters except dashes and underscores
    // No spaces
    const regex = /^[a-zA-Z0-9_-]+$/;
    return regex.test(name);
  };

  const handleCreate = () => {
    if (!threadName.trim()) {
      setError("Thread name cannot be empty");
      return;
    }

    if (!validateThreadName(threadName)) {
      setError(
        "Thread name can only contain letters, numbers, dashes, and underscores"
      );
      return;
    }

    onCreateThread(threadName);
    handleClose();
  };

  return (
    <>
      <Tooltip title="New Conversation">
        <IconButton
          color="primary"
          onClick={handleOpen}
          disabled={disabled}
          aria-label="New Conversation"
          sx={{
            borderRadius: "50%",
            backgroundColor: disabled ? "grey.400" : "primary.main",
            color: "white",
            "&:hover": {
              backgroundColor: disabled ? "grey.400" : "primary.dark",
            },
            width: 40,
            height: 40,
          }}
        >
          <Add />
        </IconButton>
      </Tooltip>

      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>Create New Conversation</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="Conversation Name"
            type="text"
            fullWidth
            variant="outlined"
            value={threadName}
            onChange={(e) => setThreadName(e.target.value)}
            error={!!error}
            helperText={
              error || "Use only letters, numbers, dashes, and underscores"
            }
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleCreate} variant="contained">
            Create
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default NewThreadButton;

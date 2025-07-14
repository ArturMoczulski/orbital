import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { ReactNode } from "react";
import { ObjectForm, ObjectFormProps } from "./ObjectForm";

/**
 * Props for the ObjectFormDialog component
 */
export interface ObjectFormDialogProps
  extends Omit<
    ObjectFormProps,
    | "onSubmit"
    | "arrayDispatch"
    | "arrayCreateUpdateAction"
    | "arrayCreateRemoveAction"
    | "arrayItemsSelector"
  > {
  /**
   * Whether the dialog is open
   */
  open: boolean;

  /**
   * Function to close the dialog
   */
  onClose: () => void;

  /**
   * The title of the dialog
   */
  title?: ReactNode;

  /**
   * Function to handle form submission
   * Can return a Promise or void
   */
  onSubmit: (data: any) => Promise<any> | any;

  /**
   * Function to show notifications (optional)
   */
  notify?: (
    message: string,
    type: "success" | "error" | "warning" | "info"
  ) => void;

  /**
   * Custom actions to display in the dialog footer (optional)
   * If not provided, default Submit and Cancel buttons will be shown
   */
  actions?: ReactNode;

  /**
   * Success message to show when form is submitted successfully (optional)
   */
  successMessage?: string;

  /**
   * Dialog width (optional, default is "md")
   */
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl" | false;

  /**
   * Whether the dialog should take up the full width (optional)
   */
  fullWidth?: boolean;

  /**
   * Custom styles for the dialog paper (optional)
   */
  paperSx?: Record<string, any>;
}

/**
 * A dialog component that displays an ObjectForm
 *
 * This component combines Material UI Dialog with the ObjectForm component
 * to create a modal form for editing objects with reference support.
 */
export function ObjectFormDialog({
  open,
  onClose,
  title,
  onSubmit,
  notify,
  actions,
  successMessage = "Form submitted successfully",
  maxWidth = "md",
  fullWidth = true,
  paperSx,
  // ObjectForm props
  schema,
  model,
  objectType,
  showInlineError = true,
  disabled = false,
  readOnly = false,
  objectDispatch,
  objectCreateUpdateAction,
  objectDataSelector,
  ...props
}: ObjectFormDialogProps) {
  // Handle form submission
  const handleSubmit = async (data: any) => {
    try {
      await onSubmit(data);

      // Show success notification if notify function is provided
      if (notify) {
        notify(successMessage, "success");
      }

      // Close the dialog
      onClose();
    } catch (error: any) {
      // Show error notification if notify function is provided
      if (notify) {
        notify(error.message || "An error occurred", "error");
      }

      // Log the error
      console.error("Form submission error:", error);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth={fullWidth}
      maxWidth={maxWidth}
      data-testid="ObjectFormDialog"
      PaperProps={{
        sx: {
          ...(paperSx || {}),
        },
      }}
    >
      {title && <DialogTitle>{title}</DialogTitle>}

      <DialogContent>
        <Box sx={{ py: 2 }}>
          <ObjectForm
            schema={schema}
            onSubmit={handleSubmit}
            model={model}
            objectType={objectType}
            showInlineError={showInlineError}
            disabled={disabled}
            readOnly={readOnly}
            // Redux integration props for individual objects
            objectDispatch={objectDispatch}
            objectCreateUpdateAction={objectCreateUpdateAction}
            objectDataSelector={objectDataSelector}
            data-testid="ObjectForm"
            {...props}
          />
        </Box>
      </DialogContent>

      {actions ? (
        <DialogActions>{actions}</DialogActions>
      ) : (
        <DialogActions>
          <Button onClick={onClose} color="primary">
            Cancel
          </Button>
          <Button
            type="submit"
            form="uniforms-auto-form"
            color="primary"
            variant="contained"
            disabled={disabled}
          >
            Submit
          </Button>
        </DialogActions>
      )}
    </Dialog>
  );
}

export default ObjectFormDialog;

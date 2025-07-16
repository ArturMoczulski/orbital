import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import { useCallback, useState } from "react";
import { ObjectForm, ObjectFormProps } from "./ObjectForm";

/**
 * Props for the ObjectFormDialog component
 * Extends ObjectFormProps and adds dialog-specific props
 */
export interface ObjectFormDialogProps extends ObjectFormProps {
  /**
   * Whether the dialog is open
   */
  open: boolean;

  /**
   * Function to call when the dialog is closed
   */
  onClose: () => void;

  /**
   * Title of the dialog
   */
  title: string;

  /**
   * Text for the submit button
   * @default "Submit"
   */
  submitButtonText?: string;

  /**
   * Text for the cancel button
   * @default "Cancel"
   */
  cancelButtonText?: string;

  /**
   * Whether to show the cancel button
   * @default true
   */
  showCancelButton?: boolean;

  /**
   * Whether to close the dialog on successful submission
   * @default true
   */
  closeOnSuccess?: boolean;

  /**
   * Maximum width of the dialog
   * @default "sm"
   */
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl" | false;

  /**
   * Whether the dialog takes up the full width
   * @default false
   */
  fullWidth?: boolean;

  /**
   * Dialog-specific props that should not be passed to ObjectForm
   * This is used internally to filter out dialog props
   * @private
   */
  _dialogProps?: Array<string>;
}

// List of props that are specific to the dialog and should not be passed to ObjectForm
const DIALOG_PROPS = [
  "open",
  "onClose",
  "title",
  "submitButtonText",
  "cancelButtonText",
  "showCancelButton",
  "closeOnSuccess",
  "maxWidth",
  "fullWidth",
  "_dialogProps",
];

/**
 * A dialog component that wraps ObjectForm
 * Provides a modal interface for creating or editing objects
 */
export function ObjectFormDialog({
  // Dialog-specific props
  open,
  onClose,
  title,
  submitButtonText = "Submit",
  cancelButtonText = "Cancel",
  showCancelButton = true,
  closeOnSuccess = true,
  maxWidth = "sm",
  fullWidth = false,

  // ObjectForm props that need special handling
  onSuccess,
  overlay = {},
  disabled = false,
  readOnly = false,

  // All other props are passed to ObjectForm
  ...objectFormProps
}: ObjectFormDialogProps) {
  // State to track form submission
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Process overlay to hide the submit button
  const processedOverlay = {
    ...overlay,
    components: {
      ...overlay.components,
      SubmitField: false,
    },
  };

  // Handle form submission via dialog action button
  const handleSubmit = useCallback(() => {
    // Find the form element and submit it programmatically
    const formElement = document.querySelector(
      '[data-testid="ObjectForm"] form'
    ) as HTMLFormElement;

    if (formElement) {
      setIsSubmitting(true);
      formElement.dispatchEvent(
        new Event("submit", { bubbles: true, cancelable: true })
      );
    }
  }, []);

  // Handle successful form submission
  const handleSuccess = useCallback(
    (result: any) => {
      setIsSubmitting(false);

      // Call the original onSuccess if provided
      if (onSuccess) {
        onSuccess(result);
      }

      // Close the dialog if closeOnSuccess is true
      if (closeOnSuccess) {
        onClose();
      }
    },
    [onSuccess, closeOnSuccess, onClose]
  );

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth={maxWidth}
      fullWidth={fullWidth}
      data-testid="ObjectFormDialog"
    >
      <DialogTitle data-testid="ObjectFormDialogTitle">{title}</DialogTitle>
      <DialogContent data-testid="ObjectFormDialogContent">
        <ObjectForm
          {...objectFormProps}
          overlay={processedOverlay}
          onSuccess={handleSuccess}
          disabled={disabled || isSubmitting}
          readOnly={readOnly}
        />
      </DialogContent>
      <DialogActions data-testid="ObjectFormDialogActions">
        {showCancelButton && (
          <Button
            onClick={onClose}
            color="primary"
            disabled={disabled || isSubmitting}
            data-testid="ObjectFormDialogCancelButton"
          >
            {cancelButtonText}
          </Button>
        )}
        <Button
          onClick={handleSubmit}
          color="primary"
          variant="contained"
          disabled={disabled || isSubmitting || readOnly}
          data-testid="ObjectFormDialogSubmitButton"
        >
          {submitButtonText}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default ObjectFormDialog;

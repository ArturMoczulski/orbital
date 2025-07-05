import Box from "@mui/material/Box";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import { ZodBridge } from "uniforms-bridge-zod";
import { FormWithReferences } from "../../forms";
import { ZodReferencesBridge } from "../../forms/ZodReferencesBridge";
import { TreeNodeData } from "../types";

interface AddBranchDialogProps<T extends TreeNodeData> {
  /**
   * Whether the dialog is open
   */
  open: boolean;

  /**
   * Function to close the dialog
   */
  onClose: () => void;

  /**
   * The type of object being added (e.g., "Area", "Character")
   */
  type: string;

  /**
   * Function to add the object
   * Can return a Promise or void
   */
  onAdd?: (data: Partial<T>) => Promise<any> | any;

  /**
   * Function to show notifications
   */
  notify: (
    message: string,
    type: "success" | "error" | "warning" | "info"
  ) => void;

  /**
   * The schema for the form
   * Can be a standard ZodBridge or our custom ZodReferencesBridge
   */
  formSchema: ZodBridge<any> | ZodReferencesBridge<any>;
}

/**
 * Dialog for adding a new item in the TreeExplorer
 */
export function AddBranchDialog<T extends TreeNodeData>({
  open,
  onClose,
  type,
  onAdd,
  notify,
  formSchema,
}: AddBranchDialogProps<T>) {
  return (
    <Dialog
      data-testid="TreeExplorerAddDialog"
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{
        sx: {
          width: "80%",
          height: "80%",
          border: "2px solid",
          borderColor: "primary.main",
        },
      }}
    >
      <DialogTitle>Add New {type}</DialogTitle>
      <Box sx={{ p: 3 }} data-testid="AddForm">
        <FormWithReferences
          schema={formSchema}
          onSubmit={async (data) => {
            if (onAdd) {
              try {
                await onAdd(data as Partial<T>);
                notify(`${type} created successfully`, "success");
                onClose();
              } catch (error: any) {
                // Error handling is already in handleApiAdd, this is just a fallback
                // The modal will stay open so the user can correct the input
                console.error("Form submission error:", error);
              }
            } else {
              console.log("Form submitted:", data);
              notify("No handler provided for form submission", "warning");
            }
          }}
        />
      </Box>
    </Dialog>
  );
}

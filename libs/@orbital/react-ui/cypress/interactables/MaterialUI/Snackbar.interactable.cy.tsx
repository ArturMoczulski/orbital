import Button from "@mui/material/Button";
import { mount } from "cypress/react";
import { SnackbarProvider, useSnackbar } from "notistack";
import { snackbar } from "./Snackbar.interactable";

// Component that shows notifications when buttons are clicked
const NotificationDemo = () => {
  const { enqueueSnackbar } = useSnackbar();

  const showSuccessNotification = () => {
    enqueueSnackbar("Success message", { variant: "success" });
  };

  const showErrorNotification = () => {
    enqueueSnackbar("Error message", { variant: "error" });
  };

  const showWarningNotification = () => {
    enqueueSnackbar("Warning message", { variant: "warning" });
  };

  const showInfoNotification = () => {
    enqueueSnackbar("Info message", { variant: "info" });
  };

  const showDefaultNotification = () => {
    enqueueSnackbar("Default message");
  };

  return (
    <div>
      <Button
        data-testid="success-button"
        onClick={showSuccessNotification}
        variant="contained"
        color="success"
      >
        Show Success
      </Button>
      <Button
        data-testid="error-button"
        onClick={showErrorNotification}
        variant="contained"
        color="error"
      >
        Show Error
      </Button>
      <Button
        data-testid="warning-button"
        onClick={showWarningNotification}
        variant="contained"
        color="warning"
      >
        Show Warning
      </Button>
      <Button
        data-testid="info-button"
        onClick={showInfoNotification}
        variant="contained"
        color="info"
      >
        Show Info
      </Button>
      <Button
        data-testid="default-button"
        onClick={showDefaultNotification}
        variant="contained"
      >
        Show Default
      </Button>
    </div>
  );
};

describe("Snackbar Interactable", () => {
  beforeEach(() => {
    // Mount the component with SnackbarProvider
    mount(
      <SnackbarProvider maxSnack={3}>
        <NotificationDemo />
      </SnackbarProvider>
    );
  });

  it("should show success notification", () => {
    // Click the button to show a success notification
    cy.get('[data-testid="success-button"]').click();

    // Use the snackbar interactable to verify the notification
    const successSnackbar = snackbar({ variant: "success" });
    successSnackbar.should("exist");
    successSnackbar.should("contain", "Success message");

    // Verify using the getMessage method
    successSnackbar.getMessage().should("include", "Success message");
  });

  it("should show error notification", () => {
    cy.get('[data-testid="error-button"]').click();

    const errorSnackbar = snackbar({ variant: "error" });
    errorSnackbar.should("exist");
    errorSnackbar.should("contain", "Error message");
  });

  it("should show multiple notifications", () => {
    // Show multiple notifications
    cy.get('[data-testid="success-button"]').click();
    cy.get('[data-testid="error-button"]').click();
    cy.get('[data-testid="warning-button"]').click();

    // Verify all notifications are visible
    snackbar().getAll().should("have.length", 3);

    // Verify specific variants
    snackbar().getByVariant("success").should("exist");
    snackbar().getByVariant("error").should("exist");
    snackbar().getByVariant("warning").should("exist");
  });

  it("should handle notification dismissal", () => {
    // Mount with autoHideDuration to auto-close notifications
    mount(
      <SnackbarProvider maxSnack={3} autoHideDuration={500}>
        <NotificationDemo />
      </SnackbarProvider>
    );

    cy.get('[data-testid="info-button"]').click();

    // Verify it appears
    snackbar({ variant: "info" }).should("exist");

    // Use the waitForAllToClose method instead of manual wait + assertion
    snackbar().waitForAllToClose(3000);
  });

  it("should wait for notification with specific text", () => {
    cy.get('[data-testid="default-button"]').click();

    // Wait for notification with specific text
    snackbar().waitForMessage("Default message");

    // Check if notification contains message
    snackbar().containsMessage("Default message").should("be.true");
  });

  it("should wait for all notifications to close", () => {
    // Mount with autoHideDuration to auto-close notifications
    mount(
      <SnackbarProvider maxSnack={3} autoHideDuration={1000}>
        <NotificationDemo />
      </SnackbarProvider>
    );

    // Show a notification
    cy.get('[data-testid="info-button"]').click();

    // Verify it appears
    snackbar().should("exist");

    // Wait for it to close automatically
    snackbar().waitForAllToClose();

    // Verify all notifications are gone
    snackbar().getAll().should("not.exist");
  });
});

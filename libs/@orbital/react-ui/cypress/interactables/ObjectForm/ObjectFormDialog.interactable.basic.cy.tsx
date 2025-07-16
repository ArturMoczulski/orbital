import Button from "@mui/material/Button";
import { mount } from "cypress/react";
import React from "react";
import { ObjectFormDialog } from "../../../src/components/ObjectForm/ObjectFormDialog";
import { TestWrapper, userBridge } from "./ObjectFormDialog.api.utils";
import { objectFormDialog } from "./ObjectFormDialog.interactable";

describe("ObjectFormDialog Basic Tests", () => {
  // Test component that manages the dialog state
  const TestComponent = () => {
    const [open, setOpen] = React.useState(false);
    const [submittedData, setSubmittedData] = React.useState<any>(null);

    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);
    const handleSuccess = (data: any) => {
      setSubmittedData(data);
      setOpen(false);
    };

    return (
      <TestWrapper>
        <div>
          <Button onClick={handleOpen} data-testid="open-dialog-button">
            Open Dialog
          </Button>

          {submittedData && (
            <div data-testid="submitted-data">
              {JSON.stringify(submittedData)}
            </div>
          )}

          <ObjectFormDialog
            open={open}
            onClose={handleClose}
            title="Test Form"
            schema={userBridge}
            objectType="User"
            isNew={true}
            onSubmit={(data) => {
              // Simulate API call
              console.log("Form submitted with data:", data);
              // Store the data for verification
              setSubmittedData(data);
              // Return void to match the expected type
              return Promise.resolve();
            }}
            onSuccess={handleSuccess}
          />
        </div>
      </TestWrapper>
    );
  };

  beforeEach(() => {
    mount(<TestComponent />);
    // Open the dialog
    cy.get('[data-testid="open-dialog-button"]').click();
  });

  it("should render the dialog with the correct title", () => {
    const dialog = objectFormDialog({ objectType: "User" });
    dialog.getTitle().should("contain.text", "Test Form");
  });

  it("should be able to fill form fields", () => {
    const dialog = objectFormDialog({ objectType: "User" });

    // Fill the form fields
    dialog.setFieldValue("name", "Test Name");
    dialog.setFieldValue("email", "test@example.com");

    // Verify the values were set
    dialog.getFieldValue("name").should("eq", "Test Name");
    dialog.getFieldValue("email").should("eq", "test@example.com");
  });

  it("should be able to submit the form", () => {
    const dialog = objectFormDialog({ objectType: "User" });

    // Fill and submit the form
    dialog.setFieldValue("name", "Test Name");
    dialog.setFieldValue("email", "test@example.com");
    dialog.submit();

    // Verify the form was submitted and dialog closed
    cy.get('[data-testid="submitted-data"]').should("exist");
    cy.get('[data-testid="submitted-data"]').should(
      "contain.text",
      "Test Name"
    );

    // Dialog should be closed
    dialog.get().should("not.exist");
  });

  it("should be able to cancel the form", () => {
    const dialog = objectFormDialog({ objectType: "User" });

    // Fill the form but cancel
    dialog.setFieldValue("name", "Test Name");
    dialog.setFieldValue("email", "test@example.com");
    dialog.cancel();

    // Dialog should be closed
    dialog.get().should("not.exist");

    // No data should be submitted
    cy.get('[data-testid="submitted-data"]').should("not.exist");
  });

  it("should be able to use fillAndSubmit method", () => {
    const dialog = objectFormDialog({ objectType: "User" });

    // Use the convenience method
    dialog.fillAndSubmit({
      name: "Test Name",
      email: "test@example.com",
      isActive: false,
    });

    // Verify the form was submitted and dialog closed
    cy.get('[data-testid="submitted-data"]').should("exist");
    cy.get('[data-testid="submitted-data"]').should(
      "contain.text",
      "Test Name"
    );
    cy.get('[data-testid="submitted-data"]').should(
      "contain.text",
      "test@example.com"
    );

    // Dialog should be closed
    dialog.get().should("not.exist");
  });

  it("should be able to get form data", () => {
    const dialog = objectFormDialog({ objectType: "User" });

    // Fill the form
    dialog.setFieldValue("name", "Test Name");
    dialog.setFieldValue("email", "test@example.com");

    // Get the form data
    dialog.getFormData().should("deep.include", {
      name: "Test Name",
      email: "test@example.com",
      isActive: true, // Default value from schema
    });
  });

  it("should delegate to ObjectFormInteractable for form operations", () => {
    const dialog = objectFormDialog({ objectType: "User" });

    // Get the form interactable
    const form = dialog.getForm();

    // Use the form interactable directly
    form.setFieldValue("name", "Test Name");
    form.getFieldValue("name").should("eq", "Test Name");
  });
});

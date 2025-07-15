import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import CircularProgress from "@mui/material/CircularProgress";
import { mount } from "cypress/react";
import { useEffect, useState } from "react";
import { circularProgress } from "./CircularProgress.interactable";

// Demo component that shows/hides a CircularProgress
const LoadingDemo = ({
  autoHide = false,
  hideDelay = 1000,
  dataTestId = "loading-indicator",
}: {
  autoHide?: boolean;
  hideDelay?: number;
  dataTestId?: string;
}) => {
  const [loading, setLoading] = useState(false);

  // Auto-hide the loading indicator after the specified delay
  useEffect(() => {
    if (autoHide && loading) {
      const timer = setTimeout(() => {
        setLoading(false);
      }, hideDelay);
      return () => clearTimeout(timer);
    }
  }, [autoHide, loading, hideDelay]);

  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
      <Button
        variant="contained"
        onClick={() => setLoading(true)}
        disabled={loading}
        data-testid="start-loading"
      >
        Start Loading
      </Button>
      <Button
        variant="contained"
        onClick={() => setLoading(false)}
        disabled={!loading}
        data-testid="stop-loading"
      >
        Stop Loading
      </Button>
      <Box
        sx={{
          display: loading ? "flex" : "none",
          justifyContent: "center",
          mt: 2,
        }}
        data-testid={dataTestId}
      >
        <CircularProgress data-testid="CircularProgressComponent" />
      </Box>
    </Box>
  );
};

describe("CircularProgress Interactable", () => {
  beforeEach(() => {
    // Mount the demo component before each test
    mount(<LoadingDemo />);
  });

  it("should detect when loading indicator is visible", () => {
    // Initially the loading indicator should be hidden
    circularProgress({ dataTestId: "loading-indicator" }).isHidden();

    // Click the start loading button
    cy.get('[data-testid="start-loading"]').click();

    // The loading indicator should now be visible
    circularProgress({ dataTestId: "loading-indicator" }).isVisible();

    // Click the stop loading button
    cy.get('[data-testid="stop-loading"]').click();

    // The loading indicator should be hidden again
    circularProgress({ dataTestId: "loading-indicator" }).isHidden();
  });

  it("should wait for loading indicator to appear and disappear", () => {
    // Mount with auto-hide enabled
    mount(<LoadingDemo autoHide={true} hideDelay={500} />);

    // Initially the loading indicator should be hidden
    circularProgress({ dataTestId: "loading-indicator" }).isHidden();

    // Click the start loading button
    cy.get('[data-testid="start-loading"]').click();

    // Wait for the loading indicator to complete its cycle
    circularProgress({ dataTestId: "loading-indicator" }).waitForCompletion(
      2000
    );

    // After completion, the button should be enabled again
    cy.get('[data-testid="start-loading"]').should("not.be.disabled");
  });

  it("should work with component name selector", () => {
    // Click the start loading button
    cy.get('[data-testid="start-loading"]').click();

    // Use the component name to find the CircularProgress
    circularProgress().isVisible();

    // Click the stop loading button
    cy.get('[data-testid="stop-loading"]').click();

    // The CircularProgress should be hidden
    circularProgress().isHidden();
  });

  it("should work with specific data-testid", () => {
    // Mount with a specific data-testid for the CircularProgress component
    mount(<LoadingDemo dataTestId="custom-loading-indicator" />);

    // Click the start loading button
    cy.get('[data-testid="start-loading"]').click();

    // Use the specific data-testid to find the CircularProgress
    circularProgress({ dataTestId: "custom-loading-indicator" }).isVisible();

    // Click the stop loading button
    cy.get('[data-testid="stop-loading"]').click();

    // The CircularProgress should be hidden
    circularProgress({ dataTestId: "custom-loading-indicator" }).isHidden();
  });
});

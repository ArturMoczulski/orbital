/// <reference types="cypress" />
import Avatar from "@mui/material/Avatar";
import Chip from "@mui/material/Chip";
import Stack from "@mui/material/Stack";
import { mount } from "cypress/react";
import { ChipInteractable } from "./Chip.interactable";

// Mock icon component for testing
const MockIcon = () => <span data-testid="mock-icon">Icon</span>;

describe("ChipInteractable", () => {
  beforeEach(() => {
    mount(
      <Stack direction="row" spacing={1} data-cy="chip-container">
        {/* Basic chip */}
        <Chip label="Basic Chip" data-testid="basic-chip" />

        {/* Outlined chip */}
        <Chip
          label="Outlined Chip"
          variant="outlined"
          data-testid="outlined-chip"
        />

        {/* Colored chip */}
        <Chip label="Primary Chip" color="primary" data-testid="primary-chip" />

        {/* Small chip */}
        <Chip label="Small Chip" size="small" data-testid="small-chip" />

        {/* Disabled chip */}
        <Chip label="Disabled Chip" disabled data-testid="disabled-chip" />

        {/* Deletable chip */}
        <Chip
          label="Deletable Chip"
          onDelete={() => {}}
          data-testid="deletable-chip"
        />

        {/* Chip with avatar */}
        <Chip
          avatar={<Avatar>A</Avatar>}
          label="Avatar Chip"
          data-testid="avatar-chip"
        />

        {/* Chip with icon */}
        <Chip icon={<MockIcon />} label="Icon Chip" data-testid="icon-chip" />

        {/* Clickable chip */}
        <Chip
          label="Clickable Chip"
          onClick={() => {}}
          data-testid="clickable-chip"
        />
      </Stack>
    );
  });

  it("should get the label text", () => {
    const chip = new ChipInteractable("basic-chip");
    chip.label().should("eq", "Basic Chip");
  });

  it("should check if a chip is deletable", () => {
    const deletableChip = new ChipInteractable("deletable-chip");
    const basicChip = new ChipInteractable("basic-chip");

    deletableChip.isDeletable().should("be.true");
    basicChip.isDeletable().should("be.false");
  });

  it("should delete a chip", () => {
    const deletableChip = new ChipInteractable("deletable-chip");

    // Set up a spy to verify the delete action
    const onDeleteSpy = cy.spy().as("deleteSpy");
    cy.window().then((win) => {
      win.document
        .querySelector('[data-testid="deletable-chip"] .MuiChip-deleteIcon')
        ?.addEventListener("click", onDeleteSpy);
    });

    deletableChip.delete();
    cy.get("@deleteSpy").should("have.been.called");
  });

  it("should throw an error when trying to delete a non-deletable chip", () => {
    const basicChip = new ChipInteractable("basic-chip");

    // Use cy.on to catch the error
    cy.on("fail", (err) => {
      expect(err.message).to.include(
        "Cannot delete chip: no delete icon found"
      );
      return false; // Return false to prevent the error from failing the test
    });

    basicChip.delete();
  });

  it("should click on a chip", () => {
    const clickableChip = new ChipInteractable("clickable-chip");

    // Set up a spy to verify the click action
    const onClickSpy = cy.spy().as("clickSpy");
    cy.window().then((win) => {
      win.document
        .querySelector('[data-testid="clickable-chip"]')
        ?.addEventListener("click", onClickSpy);
    });

    clickableChip.click();
    cy.get("@clickSpy").should("have.been.called");
  });

  it("should check if a chip has a specific variant", () => {
    const basicChip = new ChipInteractable("basic-chip");
    const outlinedChip = new ChipInteractable("outlined-chip");

    basicChip.hasVariant("filled").should("be.true");
    basicChip.hasVariant("outlined").should("be.false");

    outlinedChip.hasVariant("outlined").should("be.true");
    outlinedChip.hasVariant("filled").should("be.false");
  });

  it("should check if a chip has a specific color", () => {
    const basicChip = new ChipInteractable("basic-chip");
    const primaryChip = new ChipInteractable("primary-chip");

    primaryChip.hasColor("primary").should("be.true");
    primaryChip.hasColor("secondary").should("be.false");

    // Default chips don't have a specific color class
    basicChip.hasColor("primary").should("be.false");
  });

  it("should check if a chip is disabled", () => {
    const basicChip = new ChipInteractable("basic-chip");
    const disabledChip = new ChipInteractable("disabled-chip");

    disabledChip.isDisabled().should("be.true");
    basicChip.isDisabled().should("be.false");
  });

  it("should check if a chip has an avatar", () => {
    const basicChip = new ChipInteractable("basic-chip");
    const avatarChip = new ChipInteractable("avatar-chip");

    avatarChip.hasAvatar().should("be.true");
    basicChip.hasAvatar().should("be.false");
  });

  it("should check if a chip has an icon", () => {
    const basicChip = new ChipInteractable("basic-chip");
    const iconChip = new ChipInteractable("icon-chip");

    iconChip.hasIcon().should("be.true");
    basicChip.hasIcon().should("be.false");
  });

  it("should get the size of a chip", () => {
    const basicChip = new ChipInteractable("basic-chip");
    const smallChip = new ChipInteractable("small-chip");

    smallChip.getSize().should("eq", "small");
    basicChip.getSize().should("eq", "medium");
  });

  it("should support string shorthand for data-testid in constructor", () => {
    // Test that we can create a ChipInteractable with just a string
    const chip = new ChipInteractable("basic-chip");
    chip.get().should("exist");
    chip.label().should("eq", "Basic Chip");
  });

  it("should support options object in constructor", () => {
    // Test that we can create a ChipInteractable with an options object
    const chip = new ChipInteractable({ dataTestId: "basic-chip" });
    chip.get().should("exist");
    chip.label().should("eq", "Basic Chip");
  });
});

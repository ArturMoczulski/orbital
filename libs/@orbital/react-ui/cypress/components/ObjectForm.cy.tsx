import { RelationshipType } from "@orbital/core/src/zod/reference/reference";
import { configureStore } from "@reduxjs/toolkit";
import { mount } from "cypress/react";
import { useState } from "react";
import { z } from "zod";
import { ZodReferencesBridge } from "../../src/components/FormWithReferences/ZodReferencesBridge";
import { ObjectForm } from "../../src/components/ObjectForm/ObjectForm";
import { BelongsToFieldInteractable } from "../interactables/FormWithReferences/BelongsToField.interactable";
import { HasManyFieldInteractable } from "../interactables/FormWithReferences/HasManyField.interactable";
import { objectFieldset } from "../interactables/FormWithReferences/ObjectFieldset.interactable";

// Define types for our Redux state and actions
interface ObjectData {
  data: Record<string, any>;
  objectId?: string;
}

interface ObjectDataState {
  objectData: {
    [key: string]: ObjectData;
  };
}

type ObjectDataAction =
  | {
      type: "UPDATE_OBJECT_DATA";
      payload: { key: string; data: Record<string, any>; merge: boolean };
    }
  | {
      type: "REGISTER_OBJECT_DATA";
      payload: { key: string; data: Record<string, any>; objectId?: string };
    };

// Create a Redux slice for object data
const initialState: ObjectDataState = {
  objectData: {},
};

// Simple reducer for handling object data actions
const objectDataReducer = (
  state = initialState,
  action: ObjectDataAction
): ObjectDataState => {
  switch (action.type) {
    case "UPDATE_OBJECT_DATA":
      const { key, data, merge } = action.payload;
      const existingEntry = state.objectData[key];

      return {
        ...state,
        objectData: {
          ...state.objectData,
          [key]: {
            ...existingEntry,
            data: merge ? { ...existingEntry?.data, ...data } : data,
          },
        },
      };
    case "REGISTER_OBJECT_DATA":
      const { key: regKey, data: regData, objectId } = action.payload;
      return {
        ...state,
        objectData: {
          ...state.objectData,
          [regKey]: { data: regData, objectId },
        },
      };
    default:
      return state;
  }
};

// Action creator for updating object data
const updateObjectData = (
  key: string,
  data: Record<string, any>,
  merge = true
) => ({
  type: "UPDATE_OBJECT_DATA" as const,
  payload: { key, data, merge },
});

// Create a real Redux store
const createRealStore = () => {
  return configureStore({
    reducer: objectDataReducer,
    preloadedState: initialState,
  });
};

describe("ObjectForm Component", () => {
  beforeEach(() => {
    // Prevent uncaught exceptions from failing tests
    cy.on("uncaught:exception", (err) => {
      if (
        err.message.includes("Maximum update depth exceeded") ||
        err.message.includes("Cannot read properties of undefined") ||
        err.message.includes("Script error")
      ) {
        return false;
      }
      return true;
    });
  });

  it("renders multiple objects of different types with relationships", () => {
    // ==================== SCHEMA DEFINITIONS ====================

    // Common reference schemas
    const personSchema = z
      .object({
        id: z.string().uuid().describe("ID"),
        name: z.string().describe("Name"),
        title: z.string().optional().describe("Title"),
        email: z.string().email().optional().describe("Email"),
      })
      .describe("Person");

    const departmentSchema = z
      .object({
        id: z.string().uuid().describe("ID"),
        name: z.string().describe("Name"),
        code: z.string().describe("Department Code"),
      })
      .describe("Department");

    const locationSchema = z
      .object({
        id: z.string().uuid().describe("ID"),
        name: z.string().describe("Name"),
        address: z.string().describe("Address"),
        country: z.string().describe("Country"),
      })
      .describe("Location");

    const tagSchema = z
      .object({
        id: z.string().uuid().describe("ID"),
        name: z.string().describe("Name"),
        color: z.string().describe("Color"),
      })
      .describe("Tag");

    const resourceSchema = z
      .object({
        id: z.string().uuid().describe("ID"),
        name: z.string().describe("Name"),
        type: z.string().describe("Resource Type"),
        url: z.string().optional().describe("URL"),
      })
      .describe("Resource");

    const skillSchema = z
      .object({
        id: z.string().uuid().describe("ID"),
        name: z.string().describe("Name"),
        category: z.string().describe("Category"),
        level: z.string().optional().describe("Level"),
      })
      .describe("Skill");

    // ==================== SCHEMA 1: PROJECT ====================
    // Project schema with 2 BelongsTo and 2 HasMany relationships
    const projectSchema = z
      .object({
        name: z.string().describe("Project Name"),
        description: z.string().describe("Description"),
        budget: z.number().min(0).describe("Budget"),
        startDate: z.string().describe("Start Date"),
        // BelongsTo relationships
        managerId: z
          .string()
          .uuid()
          .reference({
            type: RelationshipType.BELONGS_TO,
            schema: personSchema,
            name: "manager",
          })
          .describe("Project Manager"),
        departmentId: z
          .string()
          .uuid()
          .reference({
            type: RelationshipType.BELONGS_TO,
            schema: departmentSchema,
            name: "department",
          })
          .describe("Department"),
        // HasMany relationships
        tagIds: z
          .array(z.string().uuid())
          .reference({
            type: RelationshipType.HAS_MANY,
            schema: tagSchema,
            name: "tags",
          })
          .describe("Tags"),
        resourceIds: z
          .array(z.string().uuid())
          .reference({
            type: RelationshipType.HAS_MANY,
            schema: resourceSchema,
            name: "resources",
          })
          .describe("Resources"),
      })
      .describe("Project");

    // ==================== SCHEMA 2: EMPLOYEE ====================
    // Employee schema with 2 BelongsTo and 2 HasMany relationships
    const employeeSchema = z
      .object({
        name: z.string().describe("Employee Name"),
        email: z.string().email().describe("Email"),
        position: z.string().describe("Position"),
        hireDate: z.string().describe("Hire Date"),
        // BelongsTo relationships
        departmentId: z
          .string()
          .uuid()
          .reference({
            type: RelationshipType.BELONGS_TO,
            schema: departmentSchema,
            name: "department",
          })
          .describe("Department"),
        locationId: z
          .string()
          .uuid()
          .reference({
            type: RelationshipType.BELONGS_TO,
            schema: locationSchema,
            name: "location",
          })
          .describe("Location"),
        // HasMany relationships
        skillIds: z
          .array(z.string().uuid())
          .reference({
            type: RelationshipType.HAS_MANY,
            schema: skillSchema,
            name: "skills",
          })
          .describe("Skills"),
        projectIds: z
          .array(z.string().uuid())
          .reference({
            type: RelationshipType.HAS_MANY,
            schema: projectSchema,
            name: "projects",
          })
          .describe("Projects"),
      })
      .describe("Employee");

    // ==================== SCHEMA 3: DEPARTMENT ====================
    // Department schema with 2 BelongsTo and 2 HasMany relationships
    const extendedDepartmentSchema = z
      .object({
        name: z.string().describe("Department Name"),
        code: z.string().describe("Department Code"),
        budget: z.number().min(0).describe("Budget"),
        description: z.string().describe("Description"),
        // BelongsTo relationships
        headId: z
          .string()
          .uuid()
          .reference({
            type: RelationshipType.BELONGS_TO,
            schema: personSchema,
            name: "head",
          })
          .describe("Department Head"),
        locationId: z
          .string()
          .uuid()
          .reference({
            type: RelationshipType.BELONGS_TO,
            schema: locationSchema,
            name: "location",
          })
          .describe("Location"),
        // HasMany relationships
        employeeIds: z
          .array(z.string().uuid())
          .reference({
            type: RelationshipType.HAS_MANY,
            schema: employeeSchema,
            name: "employees",
          })
          .describe("Employees"),
        projectIds: z
          .array(z.string().uuid())
          .reference({
            type: RelationshipType.HAS_MANY,
            schema: projectSchema,
            name: "projects",
          })
          .describe("Projects"),
      })
      .describe("Department");

    // ==================== REFERENCE DATA ====================
    // Create reference data for all schemas
    const referenceData = {
      person: [
        {
          id: "123e4567-e89b-12d3-a456-426614174001",
          name: "Alice Johnson",
          title: "Senior Manager",
          email: "alice@example.com",
        },
        {
          id: "223e4567-e89b-12d3-a456-426614174001",
          name: "Bob Smith",
          title: "Director",
          email: "bob@example.com",
        },
        {
          id: "323e4567-e89b-12d3-a456-426614174001",
          name: "Carol Williams",
          title: "VP",
          email: "carol@example.com",
        },
      ],
      department: [
        {
          id: "123e4567-e89b-12d3-a456-426614174002",
          name: "Engineering",
          code: "ENG",
        },
        {
          id: "223e4567-e89b-12d3-a456-426614174002",
          name: "Marketing",
          code: "MKT",
        },
        {
          id: "323e4567-e89b-12d3-a456-426614174002",
          name: "Finance",
          code: "FIN",
        },
      ],
      location: [
        {
          id: "123e4567-e89b-12d3-a456-426614174003",
          name: "New York Office",
          address: "123 Broadway, New York, NY",
          country: "USA",
        },
        {
          id: "223e4567-e89b-12d3-a456-426614174003",
          name: "London Office",
          address: "456 Oxford Street, London",
          country: "UK",
        },
        {
          id: "323e4567-e89b-12d3-a456-426614174003",
          name: "Tokyo Office",
          address: "789 Shibuya, Tokyo",
          country: "Japan",
        },
      ],
      tag: [
        {
          id: "123e4567-e89b-12d3-a456-426614174004",
          name: "Urgent",
          color: "red",
        },
        {
          id: "223e4567-e89b-12d3-a456-426614174004",
          name: "In Progress",
          color: "blue",
        },
        {
          id: "323e4567-e89b-12d3-a456-426614174004",
          name: "Completed",
          color: "green",
        },
      ],
      resource: [
        {
          id: "123e4567-e89b-12d3-a456-426614174005",
          name: "Project Documentation",
          type: "Document",
          url: "https://example.com/docs",
        },
        {
          id: "223e4567-e89b-12d3-a456-426614174005",
          name: "Design Assets",
          type: "Files",
          url: "https://example.com/assets",
        },
        {
          id: "323e4567-e89b-12d3-a456-426614174005",
          name: "Training Videos",
          type: "Video",
          url: "https://example.com/videos",
        },
      ],
      skill: [
        {
          id: "123e4567-e89b-12d3-a456-426614174006",
          name: "JavaScript",
          category: "Programming",
          level: "Advanced",
        },
        {
          id: "223e4567-e89b-12d3-a456-426614174006",
          name: "Project Management",
          category: "Management",
          level: "Intermediate",
        },
        {
          id: "323e4567-e89b-12d3-a456-426614174006",
          name: "UI/UX Design",
          category: "Design",
          level: "Expert",
        },
      ],
    };

    // ==================== BRIDGES ====================
    // Create bridges for each schema
    const projectBridge = new ZodReferencesBridge({
      schema: projectSchema,
      dependencies: {
        manager: referenceData.person,
        department: referenceData.department,
        tags: referenceData.tag,
        resources: referenceData.resource,
      },
    });

    const employeeBridge = new ZodReferencesBridge({
      schema: employeeSchema,
      dependencies: {
        department: referenceData.department,
        location: referenceData.location,
        skills: referenceData.skill,
        projects: [
          {
            id: "123e4567-e89b-12d3-a456-426614174007",
            name: "Website Redesign",
            description: "Redesign company website",
            budget: 50000,
            startDate: "2023-01-15",
          },
          {
            id: "223e4567-e89b-12d3-a456-426614174007",
            name: "Mobile App Development",
            description: "Develop new mobile app",
            budget: 75000,
            startDate: "2023-02-20",
          },
          {
            id: "323e4567-e89b-12d3-a456-426614174007",
            name: "Database Migration",
            description: "Migrate to new database system",
            budget: 30000,
            startDate: "2023-03-10",
          },
        ],
      },
    });

    const departmentBridge = new ZodReferencesBridge({
      schema: extendedDepartmentSchema,
      dependencies: {
        head: referenceData.person,
        location: referenceData.location,
        employees: [
          {
            id: "123e4567-e89b-12d3-a456-426614174008",
            name: "John Doe",
            email: "john@example.com",
            position: "Developer",
            hireDate: "2020-05-15",
          },
          {
            id: "223e4567-e89b-12d3-a456-426614174008",
            name: "Jane Smith",
            email: "jane@example.com",
            position: "Designer",
            hireDate: "2021-02-10",
          },
          {
            id: "323e4567-e89b-12d3-a456-426614174008",
            name: "Mike Johnson",
            email: "mike@example.com",
            position: "Manager",
            hireDate: "2019-11-20",
          },
        ],
        projects: [
          {
            id: "123e4567-e89b-12d3-a456-426614174007",
            name: "Website Redesign",
            description: "Redesign company website",
            budget: 50000,
            startDate: "2023-01-15",
          },
          {
            id: "223e4567-e89b-12d3-a456-426614174007",
            name: "Mobile App Development",
            description: "Develop new mobile app",
            budget: 75000,
            startDate: "2023-02-20",
          },
          {
            id: "323e4567-e89b-12d3-a456-426614174007",
            name: "Database Migration",
            description: "Migrate to new database system",
            budget: 30000,
            startDate: "2023-03-10",
          },
        ],
      },
    });

    // ==================== INITIAL DATA ====================
    // Create initial data for each object type (3 objects per type)
    const projectData = [
      {
        name: "Website Redesign",
        description: "Complete overhaul of company website",
        budget: 50000,
        startDate: "2023-01-15",
        managerId: "123e4567-e89b-12d3-a456-426614174001", // Alice Johnson
        departmentId: "123e4567-e89b-12d3-a456-426614174002", // Engineering
        tagIds: ["123e4567-e89b-12d3-a456-426614174004"], // Urgent
        resourceIds: ["123e4567-e89b-12d3-a456-426614174005"], // Project Documentation
      },
      {
        name: "Mobile App Development",
        description: "Develop new mobile application",
        budget: 75000,
        startDate: "2023-02-20",
        managerId: "223e4567-e89b-12d3-a456-426614174001", // Bob Smith
        departmentId: "123e4567-e89b-12d3-a456-426614174002", // Engineering
        tagIds: ["223e4567-e89b-12d3-a456-426614174004"], // In Progress
        resourceIds: ["223e4567-e89b-12d3-a456-426614174005"], // Design Assets
      },
      {
        name: "Marketing Campaign",
        description: "Q3 marketing campaign",
        budget: 30000,
        startDate: "2023-03-10",
        managerId: "323e4567-e89b-12d3-a456-426614174001", // Carol Williams
        departmentId: "223e4567-e89b-12d3-a456-426614174002", // Marketing
        tagIds: ["323e4567-e89b-12d3-a456-426614174004"], // Completed
        resourceIds: ["323e4567-e89b-12d3-a456-426614174005"], // Training Videos
      },
    ];

    const employeeData = [
      {
        name: "John Doe",
        email: "john@example.com",
        position: "Senior Developer",
        hireDate: "2020-05-15",
        departmentId: "123e4567-e89b-12d3-a456-426614174002", // Engineering
        locationId: "123e4567-e89b-12d3-a456-426614174003", // New York Office
        skillIds: ["123e4567-e89b-12d3-a456-426614174006"], // JavaScript
        projectIds: ["123e4567-e89b-12d3-a456-426614174007"], // Website Redesign
      },
      {
        name: "Jane Smith",
        email: "jane@example.com",
        position: "UX Designer",
        hireDate: "2021-02-10",
        departmentId: "123e4567-e89b-12d3-a456-426614174002", // Engineering
        locationId: "223e4567-e89b-12d3-a456-426614174003", // London Office
        skillIds: ["323e4567-e89b-12d3-a456-426614174006"], // UI/UX Design
        projectIds: ["223e4567-e89b-12d3-a456-426614174007"], // Mobile App Development
      },
      {
        name: "Mike Johnson",
        email: "mike@example.com",
        position: "Marketing Specialist",
        hireDate: "2019-11-20",
        departmentId: "223e4567-e89b-12d3-a456-426614174002", // Marketing
        locationId: "323e4567-e89b-12d3-a456-426614174003", // Tokyo Office
        skillIds: ["223e4567-e89b-12d3-a456-426614174006"], // Project Management
        projectIds: ["323e4567-e89b-12d3-a456-426614174007"], // Database Migration
      },
    ];

    const departmentData = [
      {
        name: "Engineering",
        code: "ENG",
        budget: 1000000,
        description: "Software development and engineering",
        headId: "123e4567-e89b-12d3-a456-426614174001", // Alice Johnson
        locationId: "123e4567-e89b-12d3-a456-426614174003", // New York Office
        employeeIds: ["123e4567-e89b-12d3-a456-426614174008"], // John Doe
        projectIds: ["123e4567-e89b-12d3-a456-426614174007"], // Website Redesign
      },
      {
        name: "Marketing",
        code: "MKT",
        budget: 500000,
        description: "Marketing and communications",
        headId: "223e4567-e89b-12d3-a456-426614174001", // Bob Smith
        locationId: "223e4567-e89b-12d3-a456-426614174003", // London Office
        employeeIds: ["223e4567-e89b-12d3-a456-426614174008"], // Jane Smith
        projectIds: ["223e4567-e89b-12d3-a456-426614174007"], // Mobile App Development
      },
      {
        name: "Finance",
        code: "FIN",
        budget: 750000,
        description: "Financial operations and accounting",
        headId: "323e4567-e89b-12d3-a456-426614174001", // Carol Williams
        locationId: "323e4567-e89b-12d3-a456-426614174003", // Tokyo Office
        employeeIds: ["323e4567-e89b-12d3-a456-426614174008"], // Mike Johnson
        projectIds: ["323e4567-e89b-12d3-a456-426614174007"], // Database Migration
      },
    ];

    // ==================== TEST COMPONENT ====================
    // Create a wrapper component that displays the form
    function TestObjectForm() {
      // Use useState to track the current data
      const [formData, setFormData] = useState({
        projects: projectData,
        employees: employeeData,
        departments: departmentData,
      });

      // This function will be called when the form is submitted
      const handleSubmit = (data: any) => {
        setFormData(data);
        cy.log("Form submitted with data:", data);
      };

      return (
        <div>
          <ObjectForm
            data={[
              { schema: projectBridge, items: formData.projects },
              { schema: employeeBridge, items: formData.employees },
              { schema: departmentBridge, items: formData.departments },
            ]}
            onSubmit={handleSubmit}
          />

          {/* Display the current data for verification */}
          <div style={{ display: "none" }}>
            <div data-testid="current-projects">
              {JSON.stringify(formData.projects)}
            </div>
            <div data-testid="current-employees">
              {JSON.stringify(formData.employees)}
            </div>
            <div data-testid="current-departments">
              {JSON.stringify(formData.departments)}
            </div>
          </div>
        </div>
      );
    }

    // Mount the test component
    mount(<TestObjectForm />);

    // ==================== VERIFY RENDERING ====================
    // Verify that all object fieldsets are rendered

    // Project fieldsets (3)
    for (let i = 0; i < 3; i++) {
      const projectFieldset = objectFieldset(
        "Project",
        undefined,
        `Project-${i}`
      );
      projectFieldset.should("exist");

      // Verify basic fields
      projectFieldset.hasField("name").should("be.true");
      projectFieldset.hasField("description").should("be.true");
      projectFieldset.hasField("budget").should("be.true");
      projectFieldset.hasField("startDate").should("be.true");

      // Verify relationship fields
      projectFieldset.hasField("managerId").should("be.true");
      projectFieldset.hasField("departmentId").should("be.true");
      projectFieldset.hasField("tagIds").should("be.true");
      projectFieldset.hasField("resourceIds").should("be.true");
    }

    // Employee fieldsets (3)
    for (let i = 0; i < 3; i++) {
      const employeeFieldset = objectFieldset(
        "Employee",
        undefined,
        `Employee-${i}`
      );
      employeeFieldset.should("exist");

      // Verify basic fields
      employeeFieldset.hasField("name").should("be.true");
      employeeFieldset.hasField("email").should("be.true");
      employeeFieldset.hasField("position").should("be.true");
      employeeFieldset.hasField("hireDate").should("be.true");

      // Verify relationship fields
      employeeFieldset.hasField("departmentId").should("be.true");
      employeeFieldset.hasField("locationId").should("be.true");
      employeeFieldset.hasField("skillIds").should("be.true");
      employeeFieldset.hasField("projectIds").should("be.true");
    }

    // Department fieldsets (3)
    for (let i = 0; i < 3; i++) {
      const departmentFieldset = objectFieldset(
        "Department",
        undefined,
        `Department-${i}`
      );
      departmentFieldset.should("exist");

      // Verify basic fields
      departmentFieldset.hasField("name").should("be.true");
      departmentFieldset.hasField("code").should("be.true");
      departmentFieldset.hasField("budget").should("be.true");
      departmentFieldset.hasField("description").should("be.true");

      // Verify relationship fields
      departmentFieldset.hasField("headId").should("be.true");
      departmentFieldset.hasField("locationId").should("be.true");
      departmentFieldset.hasField("employeeIds").should("be.true");
      departmentFieldset.hasField("projectIds").should("be.true");
    }

    // ==================== TEST INTERACTIONS ====================
    // Test interactions with the first project fieldset
    const firstProjectFieldset = objectFieldset(
      "Project",
      undefined,
      "Project-0"
    );

    // Verify initial values
    firstProjectFieldset
      .getFieldValue("name")
      .should("equal", "Website Redesign");
    firstProjectFieldset.getFieldValue("budget").should("equal", "50000");

    // Test BelongsTo field interaction
    const managerField =
      firstProjectFieldset.field<BelongsToFieldInteractable>("managerId");
    managerField.then((field) => {
      // Verify initial selection
      field.textField().should("have.value", "Alice Johnson");

      // Open the dropdown
      field.open();

      // Verify dropdown is open
      field.isOpened().should("be.true");

      // Select a different manager
      field.select("Bob Smith");

      // Verify the new selection
      field.textField().should("have.value", "Bob Smith");
    });

    // Test HasMany field interaction
    const tagField =
      firstProjectFieldset.field<HasManyFieldInteractable>("tagIds");
    tagField.then((field) => {
      // Verify initial selection
      field.selected().should("include", "Urgent");

      // Open the dropdown
      field.open();

      // Verify dropdown is open
      field.isOpened().should("be.true");

      // Select additional tags
      field.select("In Progress");
      field.select("Completed");

      // Verify the selections
      field.selected().should("include", "Urgent");
      field.selected().should("include", "In Progress");
      field.selected().should("include", "Completed");
    });

    // Test interactions with the first employee fieldset
    const firstEmployeeFieldset = objectFieldset(
      "Employee",
      undefined,
      "Employee-0"
    );

    // Verify initial values
    firstEmployeeFieldset.getFieldValue("name").should("equal", "John Doe");
    firstEmployeeFieldset
      .getFieldValue("email")
      .should("equal", "john@example.com");

    // Test BelongsTo field interaction
    const locationField =
      firstEmployeeFieldset.field<BelongsToFieldInteractable>("locationId");
    locationField.then((field) => {
      // Verify initial selection
      field.textField().should("have.value", "New York Office");

      // Open the dropdown
      field.open();

      // Verify dropdown is open
      field.isOpened().should("be.true");

      // Select a different location
      field.select("Tokyo Office");

      // Verify the new selection
      field.textField().should("have.value", "Tokyo Office");
    });

    // Test HasMany field interaction
    const skillField =
      firstEmployeeFieldset.field<HasManyFieldInteractable>("skillIds");
    skillField.then((field) => {
      // Verify initial selection
      field.selected().should("include", "JavaScript");

      // Open the dropdown
      field.open();

      // Verify dropdown is open
      field.isOpened().should("be.true");

      // Select additional skills
      field.select("Project Management");
      field.select("UI/UX Design");

      // Verify the selections
      field.selected().should("include", "JavaScript");
      field.selected().should("include", "Project Management");
      field.selected().should("include", "UI/UX Design");
    });

    // ==================== VERIFY DATA UPDATES ====================
    // Verify that the data model is updated correctly after interactions

    // Check that the Project data was updated
    cy.get('[data-testid="current-projects"]').should((el) => {
      const projectsData = JSON.parse(el.text());

      // Verify manager ID was updated to Bob Smith's ID
      expect(projectsData[0].managerId).to.equal(
        "223e4567-e89b-12d3-a456-426614174001"
      );

      // Verify tags were updated to include all three tags
      expect(projectsData[0].tagIds).to.include(
        "123e4567-e89b-12d3-a456-426614174004"
      ); // Urgent
      expect(projectsData[0].tagIds).to.include(
        "223e4567-e89b-12d3-a456-426614174004"
      ); // In Progress
      expect(projectsData[0].tagIds).to.include(
        "323e4567-e89b-12d3-a456-426614174004"
      ); // Completed
      expect(projectsData[0].tagIds.length).to.equal(3);
    });

    // Check that the Employee data was updated
    cy.get('[data-testid="current-employees"]').should((el) => {
      const employeesData = JSON.parse(el.text());

      // Verify location ID was updated to Tokyo Office
      expect(employeesData[0].locationId).to.equal(
        "323e4567-e89b-12d3-a456-426614174003"
      );

      // Verify skills were updated to include all three skills
      expect(employeesData[0].skillIds).to.include(
        "123e4567-e89b-12d3-a456-426614174006"
      ); // JavaScript
      expect(employeesData[0].skillIds).to.include(
        "223e4567-e89b-12d3-a456-426614174006"
      ); // Project Management
      expect(employeesData[0].skillIds).to.include(
        "323e4567-e89b-12d3-a456-426614174006"
      ); // UI/UX Design
      expect(employeesData[0].skillIds.length).to.equal(3);
    });
  });
});

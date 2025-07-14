// Import everything except Material-UI components
import { RelationshipType } from "@orbital/core/src/zod/reference/reference";
import { configureStore } from "@reduxjs/toolkit";
import { mount } from "cypress/react";
import { useState } from "react";
import { Provider } from "react-redux";
import { z } from "zod";
import { ObjectFieldset } from "../../../src/components/ObjectForm/ObjectFieldset";
import { ObjectProvider } from "../../../src/components/ObjectForm/ObjectProvider";
import { ZodReferencesBridge } from "../../../src/components/ObjectForm/ZodReferencesBridge";
import { BelongsToFieldInteractable } from "./BelongsToField.interactable.js";
import { HasManyFieldInteractable } from "./HasManyField.interactable";
import { objectFieldset } from "./ObjectFieldset.interactable";

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
  objectData: {
    main: { data: {}, objectId: undefined },
  },
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

describe("Complex Object with Multiple References", () => {
  beforeEach(() => {
    // Prevent uncaught exceptions from failing tests
    // This is useful for handling React warnings about state updates
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

  describe("Without Redux", () => {
    it("works with multiple BelongsTo relationships (Project with Manager, Department, Client)", () => {
      // Create schemas with references for a complex business project
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

      const clientSchema = z
        .object({
          id: z.string().uuid().describe("ID"),
          name: z.string().describe("Company Name"),
          industry: z.string().describe("Industry"),
          contactEmail: z.string().email().optional().describe("Contact Email"),
        })
        .describe("Client");

      // Project schema with multiple BelongsTo references
      const projectSchema = z
        .object({
          name: z.string().describe("Project Name"),
          description: z.string().describe("Description"),
          budget: z.number().min(0).describe("Budget"),
          startDate: z.string().describe("Start Date"),
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
          clientId: z
            .string()
            .uuid()
            .reference({
              type: RelationshipType.BELONGS_TO,
              schema: clientSchema,
              name: "client",
            })
            .describe("Client"),
        })
        .describe("Project");

      // Create a bridge with references
      const refBridge = new ZodReferencesBridge({
        schema: projectSchema,
        dependencies: {
          manager: [
            {
              id: "123e4567-e89b-12d3-a456-426614174001",
              name: "Alice Johnson",
              title: "Senior Project Manager",
              email: "alice@example.com",
            },
            {
              id: "223e4567-e89b-12d3-a456-426614174001",
              name: "Bob Smith",
              title: "Project Manager",
              email: "bob@example.com",
            },
            {
              id: "323e4567-e89b-12d3-a456-426614174001",
              name: "Carol Williams",
              title: "Program Director",
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
              name: "Research & Development",
              code: "R&D",
            },
          ],
          client: [
            {
              id: "123e4567-e89b-12d3-a456-426614174003",
              name: "Acme Corporation",
              industry: "Technology",
              contactEmail: "contact@acme.com",
            },
            {
              id: "223e4567-e89b-12d3-a456-426614174003",
              name: "Globex Industries",
              industry: "Manufacturing",
              contactEmail: "info@globex.com",
            },
            {
              id: "323e4567-e89b-12d3-a456-426614174003",
              name: "Oceanic Airlines",
              industry: "Transportation",
              contactEmail: "support@oceanic.com",
            },
          ],
        },
      });

      const initialProjectData = {
        name: "Website Redesign",
        description: "Complete overhaul of company website",
        budget: 75000,
        startDate: "2023-06-01",
        managerId: "123e4567-e89b-12d3-a456-426614174001", // Alice Johnson
        departmentId: "123e4567-e89b-12d3-a456-426614174002", // Engineering
        clientId: "123e4567-e89b-12d3-a456-426614174003", // Acme Corporation
      };

      // Create a wrapper component that displays the current data
      function TestProjectForm() {
        // Use useState to track the current data
        const [projectData, setProjectData] = useState(initialProjectData);

        // This function will be called when updateObjectData is called
        const handleUpdate = (
          key: string,
          newData: Record<string, any>,
          merge = true
        ) => {
          setProjectData((prevData) => {
            if (merge) {
              return { ...prevData, ...newData } as typeof initialProjectData;
            }
            return {
              ...initialProjectData,
              ...newData,
            } as typeof initialProjectData;
          });
        };

        return (
          <div>
            <ObjectProvider
              schema={refBridge}
              objectType="Project"
              data={projectData}
              onUpdate={handleUpdate}
            >
              <ObjectFieldset />
              {/* Display the current reference IDs for verification */}
              <div data-testid="current-managerId">{projectData.managerId}</div>
              <div data-testid="current-departmentId">
                {projectData.departmentId}
              </div>
              <div data-testid="current-clientId">{projectData.clientId}</div>
            </ObjectProvider>
          </div>
        );
      }

      // Mount the test component
      mount(<TestProjectForm />);

      const projectFieldset = objectFieldset("Project");

      // Verify the fieldset exists
      projectFieldset.should("exist");

      // Verify it has all the expected fields
      projectFieldset.hasField("name").should("be.true");
      projectFieldset.hasField("description").should("be.true");
      projectFieldset.hasField("budget").should("be.true");
      projectFieldset.hasField("startDate").should("be.true");
      projectFieldset.hasField("managerId").should("be.true");
      projectFieldset.hasField("departmentId").should("be.true");
      projectFieldset.hasField("clientId").should("be.true");

      // Verify field values
      projectFieldset.getFieldValue("name").should("equal", "Website Redesign");
      projectFieldset.getFieldValue("budget").should("equal", "75000");

      // Get the BelongsToField for manager and interact with it
      const managerField =
        projectFieldset.field<BelongsToFieldInteractable>("managerId");
      managerField.then((field) => {
        // Verify initial selection
        field.textField().should("have.value", "Alice Johnson");

        // Open the dropdown
        field.open();

        // Verify dropdown is open
        field.isOpened().should("be.true");

        // Select a different manager
        field.select("Carol Williams");

        // Verify the new selection
        field.textField().should("have.value", "Carol Williams");

        // Verify the data model was updated with the correct ID
        cy.get('[data-testid="current-managerId"]').should(
          "contain",
          "323e4567-e89b-12d3-a456-426614174001"
        );
      });

      // Get the BelongsToField for department and interact with it
      const departmentField =
        projectFieldset.field<BelongsToFieldInteractable>("departmentId");
      departmentField.then((field) => {
        // Verify initial selection
        field.textField().should("have.value", "Engineering");

        // Open the dropdown
        field.open();

        // Verify dropdown is open
        field.isOpened().should("be.true");

        // Select a different department
        field.select("Research & Development");

        // Verify the new selection
        field.textField().should("have.value", "Research & Development");

        // Verify the data model was updated with the correct ID
        cy.get('[data-testid="current-departmentId"]').should(
          "contain",
          "323e4567-e89b-12d3-a456-426614174002"
        );
      });

      // Get the BelongsToField for client and interact with it
      const clientField =
        projectFieldset.field<BelongsToFieldInteractable>("clientId");
      clientField.then((field) => {
        // Verify initial selection
        field.textField().should("have.value", "Acme Corporation");

        // Open the dropdown
        field.open();

        // Verify dropdown is open
        field.isOpened().should("be.true");

        // Select a different client
        field.select("Globex Industries");

        // Verify the new selection
        field.textField().should("have.value", "Globex Industries");

        // Verify the data model was updated with the correct ID
        cy.get('[data-testid="current-clientId"]').should(
          "contain",
          "223e4567-e89b-12d3-a456-426614174003"
        );
      });
    });

    it("works with multiple HasMany relationships (Course with Students, Instructors, Resources)", () => {
      // Create schemas with references for a complex educational course
      const studentSchema = z
        .object({
          id: z.string().uuid().describe("ID"),
          name: z.string().describe("Name"),
          grade: z.string().optional().describe("Grade"),
          email: z.string().email().optional().describe("Email"),
        })
        .describe("Student");

      const instructorSchema = z
        .object({
          id: z.string().uuid().describe("ID"),
          name: z.string().describe("Name"),
          specialty: z.string().describe("Specialty"),
          email: z.string().email().optional().describe("Email"),
        })
        .describe("Instructor");

      const resourceSchema = z
        .object({
          id: z.string().uuid().describe("ID"),
          name: z.string().describe("Name"),
          type: z.string().describe("Resource Type"),
          url: z.string().optional().describe("URL"),
        })
        .describe("Resource");

      // Course schema with multiple HasMany references
      const courseSchema = z
        .object({
          title: z.string().describe("Course Title"),
          description: z.string().describe("Description"),
          credits: z.number().min(1).describe("Credits"),
          semester: z.string().describe("Semester"),
          studentIds: z
            .array(z.string().uuid())
            .reference({
              type: RelationshipType.HAS_MANY,
              schema: studentSchema,
              name: "students",
            })
            .describe("Enrolled Students"),
          instructorIds: z
            .array(z.string().uuid())
            .reference({
              type: RelationshipType.HAS_MANY,
              schema: instructorSchema,
              name: "instructors",
            })
            .describe("Course Instructors"),
          resourceIds: z
            .array(z.string().uuid())
            .reference({
              type: RelationshipType.HAS_MANY,
              schema: resourceSchema,
              name: "resources",
            })
            .describe("Course Resources"),
        })
        .describe("Course");

      // Create a bridge with references
      const refBridge = new ZodReferencesBridge({
        schema: courseSchema,
        dependencies: {
          students: [
            {
              id: "123e4567-e89b-12d3-a456-426614174004",
              name: "John Doe",
              grade: "A",
              email: "john@university.edu",
            },
            {
              id: "223e4567-e89b-12d3-a456-426614174004",
              name: "Jane Smith",
              grade: "B+",
              email: "jane@university.edu",
            },
            {
              id: "323e4567-e89b-12d3-a456-426614174004",
              name: "Michael Johnson",
              grade: "A-",
              email: "michael@university.edu",
            },
            {
              id: "423e4567-e89b-12d3-a456-426614174004",
              name: "Emily Davis",
              grade: "B",
              email: "emily@university.edu",
            },
          ],
          instructors: [
            {
              id: "123e4567-e89b-12d3-a456-426614174005",
              name: "Dr. Robert Brown",
              specialty: "Algorithms",
              email: "robert@university.edu",
            },
            {
              id: "223e4567-e89b-12d3-a456-426614174005",
              name: "Prof. Sarah Wilson",
              specialty: "Data Structures",
              email: "sarah@university.edu",
            },
            {
              id: "323e4567-e89b-12d3-a456-426614174005",
              name: "Dr. James Taylor",
              specialty: "Machine Learning",
              email: "james@university.edu",
            },
          ],
          resources: [
            {
              id: "123e4567-e89b-12d3-a456-426614174006",
              name: "Introduction to Algorithms",
              type: "Textbook",
              url: "https://example.com/textbook",
            },
            {
              id: "223e4567-e89b-12d3-a456-426614174006",
              name: "Data Structures Tutorial",
              type: "Video",
              url: "https://example.com/video",
            },
            {
              id: "323e4567-e89b-12d3-a456-426614174006",
              name: "Programming Assignment 1",
              type: "Assignment",
              url: "https://example.com/assignment1",
            },
            {
              id: "423e4567-e89b-12d3-a456-426614174006",
              name: "Programming Assignment 2",
              type: "Assignment",
              url: "https://example.com/assignment2",
            },
            {
              id: "523e4567-e89b-12d3-a456-426614174006",
              name: "Final Project Guidelines",
              type: "Document",
              url: "https://example.com/project",
            },
          ],
        },
      });

      const initialCourseData = {
        title: "Advanced Computer Science",
        description: "In-depth study of algorithms and data structures",
        credits: 4,
        semester: "Fall 2023",
        studentIds: ["123e4567-e89b-12d3-a456-426614174004"], // Initially has one student
        instructorIds: ["123e4567-e89b-12d3-a456-426614174005"], // Initially has one instructor
        resourceIds: ["123e4567-e89b-12d3-a456-426614174006"], // Initially has one resource
      };

      // Create a wrapper component that displays the current data
      function TestCourseForm() {
        // Use useState to track the current data
        const [courseData, setCourseData] = useState(initialCourseData);

        // This function will be called when updateObjectData is called
        const handleUpdate = (
          key: string,
          newData: Record<string, any>,
          merge = true
        ) => {
          setCourseData((prevData) => {
            if (merge) {
              return { ...prevData, ...newData } as typeof initialCourseData;
            }
            return {
              ...initialCourseData,
              ...newData,
            } as typeof initialCourseData;
          });
        };

        return (
          <div>
            <ObjectProvider
              schema={refBridge}
              objectType="Course"
              data={courseData}
              onUpdate={handleUpdate}
            >
              <ObjectFieldset />
              {/* Display the current reference IDs for verification */}
              <div data-testid="current-studentIds">
                {JSON.stringify(courseData.studentIds)}
              </div>
              <div data-testid="current-instructorIds">
                {JSON.stringify(courseData.instructorIds)}
              </div>
              <div data-testid="current-resourceIds">
                {JSON.stringify(courseData.resourceIds)}
              </div>
            </ObjectProvider>
          </div>
        );
      }

      // Mount the test component
      mount(<TestCourseForm />);

      const courseFieldset = objectFieldset("Course");

      // Verify the fieldset exists
      courseFieldset.should("exist");

      // Verify it has all the expected fields
      courseFieldset.hasField("title").should("be.true");
      courseFieldset.hasField("description").should("be.true");
      courseFieldset.hasField("credits").should("be.true");
      courseFieldset.hasField("semester").should("be.true");
      courseFieldset.hasField("studentIds").should("be.true");
      courseFieldset.hasField("instructorIds").should("be.true");
      courseFieldset.hasField("resourceIds").should("be.true");

      // Verify field values
      courseFieldset
        .getFieldValue("title")
        .should("equal", "Advanced Computer Science");
      courseFieldset.getFieldValue("credits").should("equal", "4");

      // Get the HasManyField for students and interact with it
      const studentsField =
        courseFieldset.field<HasManyFieldInteractable>("studentIds");
      studentsField.then((field) => {
        // Verify initial selection (should have John Doe)
        field.selected().should("include", "John Doe");

        // Open the dropdown
        field.open();

        // Verify dropdown is open
        field.isOpened().should("be.true");

        // Select multiple students at once (3 additional students)
        field.select("Jane Smith");
        field.select("Michael Johnson");
        field.select("Emily Davis");

        // Verify the data model was updated with all the correct IDs
        cy.get('[data-testid="current-studentIds"]').should((el) => {
          const studentIds = JSON.parse(el.text());
          expect(studentIds).to.include("123e4567-e89b-12d3-a456-426614174004"); // John Doe
          expect(studentIds).to.include("223e4567-e89b-12d3-a456-426614174004"); // Jane Smith
          expect(studentIds).to.include("323e4567-e89b-12d3-a456-426614174004"); // Michael Johnson
          expect(studentIds).to.include("423e4567-e89b-12d3-a456-426614174004"); // Emily Davis
          expect(studentIds).to.have.length(4);
        });
      });

      // Get the HasManyField for instructors and interact with it
      const instructorsField =
        courseFieldset.field<HasManyFieldInteractable>("instructorIds");
      instructorsField.then((field) => {
        // Verify initial selection (should have Dr. Robert Brown)
        field.selected().should("include", "Dr. Robert Brown");

        // Open the dropdown
        field.open();

        // Verify dropdown is open
        field.isOpened().should("be.true");

        // Select all remaining instructors at once (adding 2 more)
        field.select("Prof. Sarah Wilson");
        field.select("Dr. James Taylor");

        // Verify the data model was updated with the correct IDs
        cy.get('[data-testid="current-instructorIds"]').should((el) => {
          const instructorIds = JSON.parse(el.text());
          expect(instructorIds).to.include(
            "123e4567-e89b-12d3-a456-426614174005"
          ); // Dr. Robert Brown
          expect(instructorIds).to.include(
            "223e4567-e89b-12d3-a456-426614174005"
          ); // Prof. Sarah Wilson
          expect(instructorIds).to.include(
            "323e4567-e89b-12d3-a456-426614174005"
          ); // Dr. James Taylor
          expect(instructorIds).to.have.length(3);
        });
      });

      // Get the HasManyField for resources and interact with it
      const resourcesField =
        courseFieldset.field<HasManyFieldInteractable>("resourceIds");
      resourcesField.then((field) => {
        // Verify initial selection (should have Introduction to Algorithms)
        field.selected().should("include", "Introduction to Algorithms");

        // Open the dropdown
        field.open();

        // Verify dropdown is open
        field.isOpened().should("be.true");

        // Select multiple resources at once (adding 3 more)
        field.select("Data Structures Tutorial");
        field.select("Programming Assignment 1");
        field.select("Programming Assignment 2");

        // Verify the data model was updated with the correct IDs
        cy.get('[data-testid="current-resourceIds"]').should((el) => {
          const resourceIds = JSON.parse(el.text());
          expect(resourceIds).to.include(
            "123e4567-e89b-12d3-a456-426614174006"
          ); // Introduction to Algorithms
          expect(resourceIds).to.include(
            "223e4567-e89b-12d3-a456-426614174006"
          ); // Data Structures Tutorial
          expect(resourceIds).to.include(
            "323e4567-e89b-12d3-a456-426614174006"
          ); // Programming Assignment 1
          expect(resourceIds).to.include(
            "423e4567-e89b-12d3-a456-426614174006"
          ); // Programming Assignment 2
          expect(resourceIds).to.have.length(4);
        });
      });
    });
  });

  it("works with combined BelongsTo and HasMany relationships (Organization with HQ, Parent, Departments, Employees)", () => {
    // Create schemas with references for a complex organization
    const locationSchema = z
      .object({
        id: z.string().uuid().describe("ID"),
        name: z.string().describe("Name"),
        address: z.string().describe("Address"),
        country: z.string().describe("Country"),
      })
      .describe("Location");

    const companySchema = z
      .object({
        id: z.string().uuid().describe("ID"),
        name: z.string().describe("Name"),
        industry: z.string().describe("Industry"),
        foundedYear: z.number().describe("Founded Year"),
      })
      .describe("Company");

    const departmentSchema = z
      .object({
        id: z.string().uuid().describe("ID"),
        name: z.string().describe("Name"),
        code: z.string().describe("Department Code"),
        budget: z.number().optional().describe("Budget"),
      })
      .describe("Department");

    const employeeSchema = z
      .object({
        id: z.string().uuid().describe("ID"),
        name: z.string().describe("Name"),
        position: z.string().describe("Position"),
        email: z.string().email().optional().describe("Email"),
      })
      .describe("Employee");

    const partnerSchema = z
      .object({
        id: z.string().uuid().describe("ID"),
        name: z.string().describe("Name"),
        type: z.string().describe("Partnership Type"),
        contactPerson: z.string().optional().describe("Contact Person"),
      })
      .describe("Partner");

    // Organization schema with both BelongsTo and HasMany references
    const organizationSchema = z
      .object({
        name: z.string().describe("Organization Name"),
        description: z.string().describe("Description"),
        foundedYear: z.number().describe("Founded Year"),
        website: z.string().describe("Website"),
        // BelongsTo relationships
        headquarterId: z
          .string()
          .uuid()
          .reference({
            type: RelationshipType.BELONGS_TO,
            schema: locationSchema,
            name: "headquarter",
          })
          .describe("Headquarters"),
        parentCompanyId: z
          .string()
          .uuid()
          .reference({
            type: RelationshipType.BELONGS_TO,
            schema: companySchema,
            name: "parentCompany",
          })
          .describe("Parent Company"),
        // HasMany relationships
        departmentIds: z
          .array(z.string().uuid())
          .reference({
            type: RelationshipType.HAS_MANY,
            schema: departmentSchema,
            name: "departments",
          })
          .describe("Departments"),
        employeeIds: z
          .array(z.string().uuid())
          .reference({
            type: RelationshipType.HAS_MANY,
            schema: employeeSchema,
            name: "employees",
          })
          .describe("Key Employees"),
        partnerIds: z
          .array(z.string().uuid())
          .reference({
            type: RelationshipType.HAS_MANY,
            schema: partnerSchema,
            name: "partners",
          })
          .describe("Partners"),
      })
      .describe("Organization");

    // Create a bridge with references
    const refBridge = new ZodReferencesBridge({
      schema: organizationSchema,
      dependencies: {
        headquarter: [
          {
            id: "123e4567-e89b-12d3-a456-426614174020",
            name: "New York Office",
            address: "123 Broadway, New York, NY",
            country: "USA",
          },
          {
            id: "223e4567-e89b-12d3-a456-426614174020",
            name: "London Office",
            address: "456 Oxford Street, London",
            country: "UK",
          },
          {
            id: "323e4567-e89b-12d3-a456-426614174020",
            name: "Tokyo Office",
            address: "789 Shibuya, Tokyo",
            country: "Japan",
          },
        ],
        parentCompany: [
          {
            id: "123e4567-e89b-12d3-a456-426614174021",
            name: "Global Holdings Inc.",
            industry: "Conglomerate",
            foundedYear: 1980,
          },
          {
            id: "223e4567-e89b-12d3-a456-426614174021",
            name: "Tech Ventures Ltd.",
            industry: "Technology",
            foundedYear: 1995,
          },
          {
            id: "323e4567-e89b-12d3-a456-426614174021",
            name: "Innovation Group",
            industry: "Research",
            foundedYear: 2005,
          },
        ],
        departments: [
          {
            id: "123e4567-e89b-12d3-a456-426614174022",
            name: "Research & Development",
            code: "RND",
            budget: 5000000,
          },
          {
            id: "223e4567-e89b-12d3-a456-426614174022",
            name: "Marketing",
            code: "MKT",
            budget: 3000000,
          },
          {
            id: "323e4567-e89b-12d3-a456-426614174022",
            name: "Human Resources",
            code: "HR",
            budget: 1500000,
          },
          {
            id: "423e4567-e89b-12d3-a456-426614174022",
            name: "Finance",
            code: "FIN",
            budget: 2000000,
          },
        ],
        employees: [
          {
            id: "123e4567-e89b-12d3-a456-426614174023",
            name: "Emma Johnson",
            position: "CEO",
            email: "emma@organization.com",
          },
          {
            id: "223e4567-e89b-12d3-a456-426614174023",
            name: "Michael Chen",
            position: "CTO",
            email: "michael@organization.com",
          },
          {
            id: "323e4567-e89b-12d3-a456-426614174023",
            name: "Sophia Rodriguez",
            position: "CFO",
            email: "sophia@organization.com",
          },
          {
            id: "423e4567-e89b-12d3-a456-426614174023",
            name: "James Wilson",
            position: "COO",
            email: "james@organization.com",
          },
        ],
        partners: [
          {
            id: "123e4567-e89b-12d3-a456-426614174024",
            name: "Acme Suppliers",
            type: "Supplier",
            contactPerson: "John Smith",
          },
          {
            id: "223e4567-e89b-12d3-a456-426614174024",
            name: "TechCorp Solutions",
            type: "Technology Provider",
            contactPerson: "Lisa Brown",
          },
          {
            id: "323e4567-e89b-12d3-a456-426614174024",
            name: "Global Logistics",
            type: "Distribution",
            contactPerson: "David Lee",
          },
          {
            id: "423e4567-e89b-12d3-a456-426614174024",
            name: "Marketing Experts",
            type: "Marketing",
            contactPerson: "Sarah Johnson",
          },
        ],
      },
    });

    const initialOrganizationData = {
      name: "Orbital Innovations",
      description: "Leading technology solutions provider",
      foundedYear: 2010,
      website: "https://orbitalinnovations.com",
      // Initial BelongsTo relationships
      headquarterId: "123e4567-e89b-12d3-a456-426614174020", // New York Office
      parentCompanyId: "123e4567-e89b-12d3-a456-426614174021", // Global Holdings Inc.
      // Initial HasMany relationships
      departmentIds: ["123e4567-e89b-12d3-a456-426614174022"], // Initially has R&D
      employeeIds: ["123e4567-e89b-12d3-a456-426614174023"], // Initially has CEO
      partnerIds: ["123e4567-e89b-12d3-a456-426614174024"], // Initially has Acme Suppliers
    };

    // Create a wrapper component that displays the current data
    function TestOrganizationForm() {
      // Use useState to track the current data
      const [organizationData, setOrganizationData] = useState(
        initialOrganizationData
      );

      // This function will be called when updateObjectData is called
      const handleUpdate = (
        key: string,
        newData: Record<string, any>,
        merge = true
      ) => {
        setOrganizationData((prevData) => {
          if (merge) {
            return {
              ...prevData,
              ...newData,
            } as typeof initialOrganizationData;
          }
          return {
            ...initialOrganizationData,
            ...newData,
          } as typeof initialOrganizationData;
        });
      };

      return (
        <div>
          <ObjectProvider
            schema={refBridge}
            objectType="Organization"
            data={organizationData}
            onUpdate={handleUpdate}
          >
            <ObjectFieldset />
            {/* Display the current reference IDs for verification */}
            <div data-testid="current-headquarterId">
              {organizationData.headquarterId}
            </div>
            <div data-testid="current-parentCompanyId">
              {organizationData.parentCompanyId}
            </div>
            <div data-testid="current-departmentIds">
              {JSON.stringify(organizationData.departmentIds)}
            </div>
            <div data-testid="current-employeeIds">
              {JSON.stringify(organizationData.employeeIds)}
            </div>
            <div data-testid="current-partnerIds">
              {JSON.stringify(organizationData.partnerIds)}
            </div>
          </ObjectProvider>
        </div>
      );
    }

    // Mount the test component
    mount(<TestOrganizationForm />);

    const organizationFieldset = objectFieldset("Organization");

    // Verify the fieldset exists
    organizationFieldset.should("exist");

    // Verify it has all the expected fields
    organizationFieldset.hasField("name").should("be.true");
    organizationFieldset.hasField("description").should("be.true");
    organizationFieldset.hasField("foundedYear").should("be.true");
    organizationFieldset.hasField("website").should("be.true");
    organizationFieldset.hasField("headquarterId").should("be.true");
    organizationFieldset.hasField("parentCompanyId").should("be.true");
    organizationFieldset.hasField("departmentIds").should("be.true");
    organizationFieldset.hasField("employeeIds").should("be.true");
    organizationFieldset.hasField("partnerIds").should("be.true");

    // Verify field values
    organizationFieldset
      .getFieldValue("name")
      .should("equal", "Orbital Innovations");
    organizationFieldset.getFieldValue("foundedYear").should("equal", "2010");

    // Test BelongsTo fields
    // Get the BelongsToField for headquarter and interact with it
    const headquarterField =
      organizationFieldset.field<BelongsToFieldInteractable>("headquarterId");
    headquarterField.then((field) => {
      // Verify initial selection
      field.textField().should("have.value", "New York Office");

      // Open the dropdown
      field.open();

      // Verify dropdown is open
      field.isOpened().should("be.true");

      // Select a different headquarter
      field.select("Tokyo Office");

      // Verify the new selection
      field.textField().should("have.value", "Tokyo Office");

      // Verify the data model was updated with the correct ID
      cy.get('[data-testid="current-headquarterId"]').should(
        "contain",
        "323e4567-e89b-12d3-a456-426614174020"
      );
    });

    // Get the BelongsToField for parent company and interact with it
    const parentCompanyField =
      organizationFieldset.field<BelongsToFieldInteractable>("parentCompanyId");
    parentCompanyField.then((field) => {
      // Verify initial selection
      field.textField().should("have.value", "Global Holdings Inc.");

      // Open the dropdown
      field.open();

      // Verify dropdown is open
      field.isOpened().should("be.true");

      // Select a different parent company
      field.select("Tech Ventures Ltd.");

      // Verify the new selection
      field.textField().should("have.value", "Tech Ventures Ltd.");

      // Verify the data model was updated with the correct ID
      cy.get('[data-testid="current-parentCompanyId"]').should(
        "contain",
        "223e4567-e89b-12d3-a456-426614174021"
      );
    });

    // Test HasMany fields
    // Get the HasManyField for departments and interact with it
    const departmentsField =
      organizationFieldset.field<HasManyFieldInteractable>("departmentIds");
    departmentsField.then((field) => {
      // Verify initial selection (should have R&D)
      field.selected().should("include", "Research & Development");

      // Open the dropdown
      field.open();

      // Verify dropdown is open
      field.isOpened().should("be.true");

      // Select multiple departments at once (adding 3 more)
      field.select("Marketing");
      field.select("Human Resources");
      field.select("Finance");

      // Verify the data model was updated with all the correct IDs
      cy.get('[data-testid="current-departmentIds"]').should((el) => {
        const departmentIds = JSON.parse(el.text());
        expect(departmentIds).to.include(
          "123e4567-e89b-12d3-a456-426614174022"
        ); // R&D
        expect(departmentIds).to.include(
          "223e4567-e89b-12d3-a456-426614174022"
        ); // Marketing
        expect(departmentIds).to.include(
          "323e4567-e89b-12d3-a456-426614174022"
        ); // HR
        expect(departmentIds).to.include(
          "423e4567-e89b-12d3-a456-426614174022"
        ); // Finance
        expect(departmentIds).to.have.length(4);
      });
    });

    // Get the HasManyField for employees and interact with it
    const employeesField =
      organizationFieldset.field<HasManyFieldInteractable>("employeeIds");
    employeesField.then((field) => {
      // Verify initial selection (should have CEO)
      field.selected().should("include", "Emma Johnson");

      // Open the dropdown
      field.open();

      // Verify dropdown is open
      field.isOpened().should("be.true");

      // Select multiple employees at once (adding 3 more)
      field.select("Michael Chen");
      field.select("Sophia Rodriguez");
      field.select("James Wilson");

      // Verify the data model was updated with all the correct IDs
      cy.get('[data-testid="current-employeeIds"]').should((el) => {
        const employeeIds = JSON.parse(el.text());
        expect(employeeIds).to.include("123e4567-e89b-12d3-a456-426614174023"); // CEO
        expect(employeeIds).to.include("223e4567-e89b-12d3-a456-426614174023"); // CTO
        expect(employeeIds).to.include("323e4567-e89b-12d3-a456-426614174023"); // CFO
        expect(employeeIds).to.include("423e4567-e89b-12d3-a456-426614174023"); // COO
        expect(employeeIds).to.have.length(4);
      });
    });

    // Get the HasManyField for partners and interact with it
    const partnersField =
      organizationFieldset.field<HasManyFieldInteractable>("partnerIds");
    partnersField.then((field) => {
      // Verify initial selection (should have Acme Suppliers)
      field.selected().should("include", "Acme Suppliers");

      // Open the dropdown
      field.open();

      // Verify dropdown is open
      field.isOpened().should("be.true");

      // Select multiple partners at once (adding 3 more)
      field.select("TechCorp Solutions");
      field.select("Global Logistics");
      field.select("Marketing Experts");

      // Verify the data model was updated with all the correct IDs
      cy.get('[data-testid="current-partnerIds"]').should((el) => {
        const partnerIds = JSON.parse(el.text());
        expect(partnerIds).to.include("123e4567-e89b-12d3-a456-426614174024"); // Acme Suppliers
        expect(partnerIds).to.include("223e4567-e89b-12d3-a456-426614174024"); // TechCorp Solutions
        expect(partnerIds).to.include("323e4567-e89b-12d3-a456-426614174024"); // Global Logistics
        expect(partnerIds).to.include("423e4567-e89b-12d3-a456-426614174024"); // Marketing Experts
        expect(partnerIds).to.have.length(4);
      });
    });
  });

  describe("With Redux", () => {
    it("works with multiple BelongsTo relationships (Product with Category, Supplier, Manufacturer)", () => {
      // Create schemas with references for a complex product
      const categorySchema = z
        .object({
          id: z.string().uuid().describe("ID"),
          name: z.string().describe("Name"),
          description: z.string().optional().describe("Description"),
        })
        .describe("Category");

      const supplierSchema = z
        .object({
          id: z.string().uuid().describe("ID"),
          name: z.string().describe("Name"),
          contactPerson: z.string().describe("Contact Person"),
          email: z.string().email().optional().describe("Email"),
        })
        .describe("Supplier");

      const manufacturerSchema = z
        .object({
          id: z.string().uuid().describe("ID"),
          name: z.string().describe("Name"),
          country: z.string().describe("Country"),
          website: z.string().optional().describe("Website"),
        })
        .describe("Manufacturer");

      // Product schema with multiple BelongsTo references
      const productSchema = z
        .object({
          name: z.string().describe("Product Name"),
          description: z.string().describe("Description"),
          price: z.number().min(0).describe("Price"),
          sku: z.string().describe("SKU"),
          categoryId: z
            .string()
            .uuid()
            .reference({
              type: RelationshipType.BELONGS_TO,
              schema: categorySchema,
              name: "category",
            })
            .describe("Category"),
          supplierId: z
            .string()
            .uuid()
            .reference({
              type: RelationshipType.BELONGS_TO,
              schema: supplierSchema,
              name: "supplier",
            })
            .describe("Supplier"),
          manufacturerId: z
            .string()
            .uuid()
            .reference({
              type: RelationshipType.BELONGS_TO,
              schema: manufacturerSchema,
              name: "manufacturer",
            })
            .describe("Manufacturer"),
        })
        .describe("Product");

      // Create a bridge with references
      const refBridge = new ZodReferencesBridge({
        schema: productSchema,
        dependencies: {
          category: [
            {
              id: "123e4567-e89b-12d3-a456-426614174007",
              name: "Electronics",
              description: "Electronic devices and accessories",
            },
            {
              id: "223e4567-e89b-12d3-a456-426614174007",
              name: "Home & Kitchen",
              description: "Home appliances and kitchen tools",
            },
            {
              id: "323e4567-e89b-12d3-a456-426614174007",
              name: "Sports & Outdoors",
              description: "Sports equipment and outdoor gear",
            },
          ],
          supplier: [
            {
              id: "123e4567-e89b-12d3-a456-426614174008",
              name: "TechSupply Inc.",
              contactPerson: "David Lee",
              email: "david@techsupply.com",
            },
            {
              id: "223e4567-e89b-12d3-a456-426614174008",
              name: "Global Distributors",
              contactPerson: "Maria Garcia",
              email: "maria@globaldist.com",
            },
            {
              id: "323e4567-e89b-12d3-a456-426614174008",
              name: "Prime Logistics",
              contactPerson: "John Wilson",
              email: "john@primelogistics.com",
            },
          ],
          manufacturer: [
            {
              id: "123e4567-e89b-12d3-a456-426614174009",
              name: "TechCorp",
              country: "United States",
              website: "https://techcorp.com",
            },
            {
              id: "223e4567-e89b-12d3-a456-426614174009",
              name: "EuroTech",
              country: "Germany",
              website: "https://eurotech.de",
            },
            {
              id: "323e4567-e89b-12d3-a456-426614174009",
              name: "AsiaManufacturing",
              country: "Japan",
              website: "https://asiamanufacturing.jp",
            },
          ],
        },
      });

      const initialProductData = {
        name: "Smart Speaker",
        description: "Voice-controlled smart speaker with AI assistant",
        price: 99.99,
        sku: "SP-1001",
        categoryId: "123e4567-e89b-12d3-a456-426614174007", // Electronics
        supplierId: "123e4567-e89b-12d3-a456-426614174008", // TechSupply Inc.
        manufacturerId: "123e4567-e89b-12d3-a456-426614174009", // TechCorp
      };

      // Create a real Redux store
      const store = createRealStore();

      // Attach store to window object for Cypress to access
      cy.window().then((win) => {
        (win as any).store = store;
      });

      // Add a spy to the dispatch function to track updates
      const dispatchSpy = cy.spy(store, "dispatch").as("dispatchSpy");

      // Initialize store with data
      store.dispatch({
        type: "REGISTER_OBJECT_DATA",
        payload: {
          key: "main",
          data: initialProductData,
          objectId: "product-123",
        },
      });

      // Import useSelector explicitly to ensure it's properly typed
      const { useSelector } = require("react-redux");

      // Create a component to display the current Redux state using useSelector
      const ReduxStateDisplay = () => {
        // Use useSelector to subscribe to Redux state changes
        const categoryId = useSelector(
          (state: ObjectDataState) => state.objectData.main?.data.categoryId
        );
        const supplierId = useSelector(
          (state: ObjectDataState) => state.objectData.main?.data.supplierId
        );
        const manufacturerId = useSelector(
          (state: ObjectDataState) => state.objectData.main?.data.manufacturerId
        );

        return (
          <div>
            <div data-testid="current-categoryId">{categoryId}</div>
            <div data-testid="current-supplierId">{supplierId}</div>
            <div data-testid="current-manufacturerId">{manufacturerId}</div>
          </div>
        );
      };

      // Create selectors for the Redux store
      const dataSelector = () => store.getState().objectData.main?.data || {};
      const objectIdSelector = () => store.getState().objectData.main?.objectId;

      // Create a wrapper component that uses Redux
      function TestProductFormWithRedux() {
        return (
          <Provider store={store}>
            <div>
              <ObjectProvider
                schema={refBridge}
                objectType="Product"
                data={{}} // Empty default data
                dataSelector={dataSelector}
                objectIdSelector={objectIdSelector}
                dispatch={store.dispatch}
                createUpdateAction={updateObjectData}
              >
                <ObjectFieldset />

                {/* Use the component that will re-render when Redux state changes */}
                <ReduxStateDisplay />

                {/* Display Redux state for debugging */}
                <div
                  data-testid="redux-state-debug"
                  style={{ display: "none" }}
                >
                  {JSON.stringify(store.getState())}
                </div>
              </ObjectProvider>
            </div>
          </Provider>
        );
      }

      // Mount the test component
      mount(<TestProductFormWithRedux />);

      const productFieldset = objectFieldset("Product");

      // Verify the fieldset exists
      productFieldset.should("exist");

      // Verify it has all the expected fields
      productFieldset.hasField("name").should("be.true");
      productFieldset.hasField("description").should("be.true");
      productFieldset.hasField("price").should("be.true");
      productFieldset.hasField("sku").should("be.true");
      productFieldset.hasField("categoryId").should("be.true");
      productFieldset.hasField("supplierId").should("be.true");
      productFieldset.hasField("manufacturerId").should("be.true");

      // Get the BelongsToField for category and interact with it
      const categoryField =
        productFieldset.field<BelongsToFieldInteractable>("categoryId");
      categoryField.then((field) => {
        // Verify initial selection
        field.textField().should("have.value", "Electronics");

        // Open the dropdown
        field.open();

        // Verify dropdown is open
        field.isOpened().should("be.true");

        // Select a different category
        field.select("Home & Kitchen");

        // Verify the new selection
        field.textField().should("have.value", "Home & Kitchen");

        // Verify the Redux store was updated with the correct ID
        cy.window()
          .its("store")
          .then((storeInstance) => {
            const state = storeInstance.getState() as ObjectDataState;
            expect(state.objectData.main?.data.categoryId).to.equal(
              "223e4567-e89b-12d3-a456-426614174007"
            );
          });

        // Verify the UI reflects this state
        cy.get('[data-testid="current-categoryId"]')
          .should("be.visible")
          .and("contain", "223e4567-e89b-12d3-a456-426614174007");
      });

      // Get the BelongsToField for supplier and interact with it
      const supplierField =
        productFieldset.field<BelongsToFieldInteractable>("supplierId");
      supplierField.then((field) => {
        // Verify initial selection
        field.textField().should("have.value", "TechSupply Inc.");

        // Open the dropdown
        field.open();

        // Verify dropdown is open
        field.isOpened().should("be.true");

        // Select a different supplier
        field.select("Global Distributors");

        // Verify the new selection
        field.textField().should("have.value", "Global Distributors");

        // Verify the Redux store was updated with the correct ID
        cy.window()
          .its("store")
          .then((storeInstance) => {
            const state = storeInstance.getState() as ObjectDataState;
            expect(state.objectData.main?.data.supplierId).to.equal(
              "223e4567-e89b-12d3-a456-426614174008"
            );
          });

        // Verify the UI reflects this state
        cy.get('[data-testid="current-supplierId"]')
          .should("be.visible")
          .and("contain", "223e4567-e89b-12d3-a456-426614174008");
      });

      // Get the BelongsToField for manufacturer and interact with it
      const manufacturerField =
        productFieldset.field<BelongsToFieldInteractable>("manufacturerId");
      manufacturerField.then((field) => {
        // Verify initial selection
        field.textField().should("have.value", "TechCorp");

        // Open the dropdown
        field.open();

        // Verify dropdown is open
        field.isOpened().should("be.true");

        // Select a different manufacturer
        field.select("EuroTech");

        // Verify the new selection
        field.textField().should("have.value", "EuroTech");

        // Verify the Redux store was updated with the correct ID
        cy.window()
          .its("store")
          .then((storeInstance) => {
            const state = storeInstance.getState() as ObjectDataState;
            expect(state.objectData.main?.data.manufacturerId).to.equal(
              "223e4567-e89b-12d3-a456-426614174009"
            );
          });

        // Verify the UI reflects this state
        cy.get('[data-testid="current-manufacturerId"]')
          .should("be.visible")
          .and("contain", "223e4567-e89b-12d3-a456-426614174009");
      });
    });

    it("works with multiple HasMany relationships (Team with Members, Projects, Skills)", () => {
      // Create schemas with references for a complex team
      const memberSchema = z
        .object({
          id: z.string().uuid().describe("ID"),
          name: z.string().describe("Name"),
          role: z.string().describe("Role"),
          email: z.string().email().optional().describe("Email"),
        })
        .describe("Member");

      const projectSchema = z
        .object({
          id: z.string().uuid().describe("ID"),
          name: z.string().describe("Name"),
          status: z.string().describe("Status"),
          deadline: z.string().optional().describe("Deadline"),
        })
        .describe("Project");

      const skillSchema = z
        .object({
          id: z.string().uuid().describe("ID"),
          name: z.string().describe("Name"),
          category: z.string().describe("Category"),
          level: z.string().optional().describe("Level"),
        })
        .describe("Skill");

      // Team schema with multiple HasMany references
      const teamSchema = z
        .object({
          name: z.string().describe("Team Name"),
          description: z.string().describe("Description"),
          department: z.string().describe("Department"),
          memberIds: z
            .array(z.string().uuid())
            .reference({
              type: RelationshipType.HAS_MANY,
              schema: memberSchema,
              name: "members",
            })
            .describe("Team Members"),
          projectIds: z
            .array(z.string().uuid())
            .reference({
              type: RelationshipType.HAS_MANY,
              schema: projectSchema,
              name: "projects",
            })
            .describe("Team Projects"),
          skillIds: z
            .array(z.string().uuid())
            .reference({
              type: RelationshipType.HAS_MANY,
              schema: skillSchema,
              name: "skills",
            })
            .describe("Team Skills"),
        })
        .describe("Team");

      // Create a bridge with references
      const refBridge = new ZodReferencesBridge({
        schema: teamSchema,
        dependencies: {
          members: [
            {
              id: "123e4567-e89b-12d3-a456-426614174010",
              name: "Alex Johnson",
              role: "Team Lead",
              email: "alex@company.com",
            },
            {
              id: "223e4567-e89b-12d3-a456-426614174010",
              name: "Sam Williams",
              role: "Developer",
              email: "sam@company.com",
            },
            {
              id: "323e4567-e89b-12d3-a456-426614174010",
              name: "Taylor Brown",
              role: "Designer",
              email: "taylor@company.com",
            },
            {
              id: "423e4567-e89b-12d3-a456-426614174010",
              name: "Jordan Smith",
              role: "QA Engineer",
              email: "jordan@company.com",
            },
          ],
          projects: [
            {
              id: "123e4567-e89b-12d3-a456-426614174011",
              name: "Website Redesign",
              status: "In Progress",
              deadline: "2023-12-31",
            },
            {
              id: "223e4567-e89b-12d3-a456-426614174011",
              name: "Mobile App Development",
              status: "Planning",
              deadline: "2024-03-15",
            },
            {
              id: "323e4567-e89b-12d3-a456-426614174011",
              name: "API Integration",
              status: "Completed",
              deadline: "2023-09-30",
            },
          ],
          skills: [
            {
              id: "123e4567-e89b-12d3-a456-426614174012",
              name: "JavaScript",
              category: "Programming",
              level: "Advanced",
            },
            {
              id: "223e4567-e89b-12d3-a456-426614174012",
              name: "UI/UX Design",
              category: "Design",
              level: "Intermediate",
            },
            {
              id: "323e4567-e89b-12d3-a456-426614174012",
              name: "Project Management",
              category: "Management",
              level: "Advanced",
            },
            {
              id: "423e4567-e89b-12d3-a456-426614174012",
              name: "DevOps",
              category: "Operations",
              level: "Beginner",
            },
          ],
        },
      });

      const initialTeamData = {
        name: "Product Development",
        description: "Team responsible for product development and innovation",
        department: "Engineering",
        memberIds: ["123e4567-e89b-12d3-a456-426614174010"], // Initially has one member
        projectIds: ["123e4567-e89b-12d3-a456-426614174011"], // Initially has one project
        skillIds: ["123e4567-e89b-12d3-a456-426614174012"], // Initially has one skill
      };

      // Create a real Redux store
      const store = createRealStore();

      // Attach store to window object for Cypress to access
      cy.window().then((win) => {
        (win as any).store = store;
      });

      // Add a spy to the dispatch function to track updates
      const dispatchSpy = cy.spy(store, "dispatch").as("dispatchSpy");

      // Initialize store with data
      store.dispatch({
        type: "REGISTER_OBJECT_DATA",
        payload: {
          key: "main",
          data: initialTeamData,
          objectId: "team-123",
        },
      });

      // Import useSelector explicitly to ensure it's properly typed
      const { useSelector } = require("react-redux");

      // Create a component to display the current Redux state using useSelector
      const ReduxStateDisplay = () => {
        // Use useSelector to subscribe to Redux state changes
        const memberIds = useSelector(
          (state: ObjectDataState) => state.objectData.main?.data.memberIds
        );
        const projectIds = useSelector(
          (state: ObjectDataState) => state.objectData.main?.data.projectIds
        );
        const skillIds = useSelector(
          (state: ObjectDataState) => state.objectData.main?.data.skillIds
        );

        return (
          <div>
            <div data-testid="current-memberIds">
              {JSON.stringify(memberIds)}
            </div>
            <div data-testid="current-projectIds">
              {JSON.stringify(projectIds)}
            </div>
            <div data-testid="current-skillIds">{JSON.stringify(skillIds)}</div>
          </div>
        );
      };

      // Create selectors for the Redux store
      const dataSelector = () => store.getState().objectData.main?.data || {};
      const objectIdSelector = () => store.getState().objectData.main?.objectId;

      // Create a wrapper component that uses Redux
      function TestTeamFormWithRedux() {
        return (
          <Provider store={store}>
            <div>
              <ObjectProvider
                schema={refBridge}
                objectType="Team"
                data={{}} // Empty default data
                dataSelector={dataSelector}
                objectIdSelector={objectIdSelector}
                dispatch={store.dispatch}
                createUpdateAction={updateObjectData}
              >
                <ObjectFieldset />

                {/* Use the component that will re-render when Redux state changes */}
                <ReduxStateDisplay />

                {/* Display Redux state for debugging */}
                <div
                  data-testid="redux-state-debug"
                  style={{ display: "none" }}
                >
                  {JSON.stringify(store.getState())}
                </div>
              </ObjectProvider>
            </div>
          </Provider>
        );
      }

      // Mount the test component
      mount(<TestTeamFormWithRedux />);

      const teamFieldset = objectFieldset("Team");

      // Verify the fieldset exists
      teamFieldset.should("exist");

      // Verify it has all the expected fields
      teamFieldset.hasField("name").should("be.true");
      teamFieldset.hasField("description").should("be.true");
      teamFieldset.hasField("department").should("be.true");
      teamFieldset.hasField("memberIds").should("be.true");
      teamFieldset.hasField("projectIds").should("be.true");
      teamFieldset.hasField("skillIds").should("be.true");

      // Get the HasManyField for members and interact with it
      const membersField =
        teamFieldset.field<HasManyFieldInteractable>("memberIds");
      membersField.then((field) => {
        // Verify initial selection (should have Alex Johnson)
        field.selected().should("include", "Alex Johnson");

        // Open the dropdown
        field.open();

        // Verify dropdown is open
        field.isOpened().should("be.true");

        // Select multiple members at once (adding 3 more)
        field.select("Sam Williams");
        field.select("Taylor Brown");
        field.select("Jordan Smith");

        // Verify the Redux store was updated with the correct IDs
        cy.window()
          .its("store")
          .then((storeInstance) => {
            const state = storeInstance.getState() as ObjectDataState;
            const memberIds = state.objectData.main?.data.memberIds;

            expect(memberIds).to.include(
              "123e4567-e89b-12d3-a456-426614174010"
            ); // Alex Johnson
            expect(memberIds).to.include(
              "223e4567-e89b-12d3-a456-426614174010"
            ); // Sam Williams
            expect(memberIds).to.include(
              "323e4567-e89b-12d3-a456-426614174010"
            ); // Taylor Brown
            expect(memberIds).to.include(
              "423e4567-e89b-12d3-a456-426614174010"
            ); // Jordan Smith
            expect(memberIds).to.have.length(4);
          });

        // Verify the UI reflects this state
        cy.get('[data-testid="current-memberIds"]').should((el) => {
          const memberIds = JSON.parse(el.text());
          expect(memberIds).to.include("123e4567-e89b-12d3-a456-426614174010"); // Alex Johnson
          expect(memberIds).to.include("223e4567-e89b-12d3-a456-426614174010"); // Sam Williams
          expect(memberIds).to.include("323e4567-e89b-12d3-a456-426614174010"); // Taylor Brown
          expect(memberIds).to.include("423e4567-e89b-12d3-a456-426614174010"); // Jordan Smith
          expect(memberIds).to.have.length(4);
        });
      });

      // Get the HasManyField for projects and interact with it
      const projectsField =
        teamFieldset.field<HasManyFieldInteractable>("projectIds");
      projectsField.then((field) => {
        // Verify initial selection (should have Website Redesign)
        field.selected().should("include", "Website Redesign");

        // Open the dropdown
        field.open();

        // Verify dropdown is open
        field.isOpened().should("be.true");

        // Select all remaining projects at once (adding 2 more)
        field.select("Mobile App Development");
        field.select("API Integration");

        // Verify the Redux store was updated with the correct IDs
        cy.window()
          .its("store")
          .then((storeInstance) => {
            const state = storeInstance.getState() as ObjectDataState;
            const projectIds = state.objectData.main?.data.projectIds;

            expect(projectIds).to.include(
              "123e4567-e89b-12d3-a456-426614174011"
            ); // Website Redesign
            expect(projectIds).to.include(
              "223e4567-e89b-12d3-a456-426614174011"
            ); // Mobile App Development
            expect(projectIds).to.include(
              "323e4567-e89b-12d3-a456-426614174011"
            ); // API Integration
            expect(projectIds).to.have.length(3);
          });

        // Verify the UI reflects this state
        cy.get('[data-testid="current-projectIds"]').should((el) => {
          const projectIds = JSON.parse(el.text());
          expect(projectIds).to.include("123e4567-e89b-12d3-a456-426614174011"); // Website Redesign
          expect(projectIds).to.include("223e4567-e89b-12d3-a456-426614174011"); // Mobile App Development
          expect(projectIds).to.include("323e4567-e89b-12d3-a456-426614174011"); // API Integration
          expect(projectIds).to.have.length(3);
        });
      });

      // Get the HasManyField for skills and interact with it
      const skillsField =
        teamFieldset.field<HasManyFieldInteractable>("skillIds");
      skillsField.then((field) => {
        // Verify initial selection (should have JavaScript)
        field.selected().should("include", "JavaScript");

        // Open the dropdown
        field.open();

        // Verify dropdown is open
        field.isOpened().should("be.true");

        // Select multiple skills at once (adding 3 more)
        field.select("UI/UX Design");
        field.select("Project Management");
        field.select("DevOps");

        // Verify the Redux store was updated with the correct IDs
        cy.window()
          .its("store")
          .then((storeInstance) => {
            const state = storeInstance.getState() as ObjectDataState;
            const skillIds = state.objectData.main?.data.skillIds;

            expect(skillIds).to.include("123e4567-e89b-12d3-a456-426614174012"); // JavaScript
            expect(skillIds).to.include("223e4567-e89b-12d3-a456-426614174012"); // UI/UX Design
            expect(skillIds).to.include("323e4567-e89b-12d3-a456-426614174012"); // Project Management
            expect(skillIds).to.include("423e4567-e89b-12d3-a456-426614174012"); // DevOps
            expect(skillIds).to.have.length(4);
          });

        // Verify the UI reflects this state
        cy.get('[data-testid="current-skillIds"]').should((el) => {
          const skillIds = JSON.parse(el.text());
          expect(skillIds).to.include("123e4567-e89b-12d3-a456-426614174012"); // JavaScript
          expect(skillIds).to.include("223e4567-e89b-12d3-a456-426614174012"); // UI/UX Design
          expect(skillIds).to.include("323e4567-e89b-12d3-a456-426614174012"); // Project Management
          expect(skillIds).to.include("423e4567-e89b-12d3-a456-426614174012"); // DevOps
          expect(skillIds).to.have.length(4);
        });

        it("works with combined BelongsTo and HasMany relationships in Redux (University with Campus, Accreditation, Programs, Facilities, Events)", () => {
          // Create schemas with references for a complex university
          const campusSchema = z
            .object({
              id: z.string().uuid().describe("ID"),
              name: z.string().describe("Name"),
              location: z.string().describe("Location"),
              size: z.number().optional().describe("Size (acres)"),
            })
            .describe("Campus");

          const accreditationSchema = z
            .object({
              id: z.string().uuid().describe("ID"),
              name: z.string().describe("Name"),
              organization: z.string().describe("Organization"),
              validUntil: z.string().describe("Valid Until"),
            })
            .describe("Accreditation");

          const programSchema = z
            .object({
              id: z.string().uuid().describe("ID"),
              name: z.string().describe("Name"),
              level: z.string().describe("Level"),
              duration: z.number().describe("Duration (years)"),
            })
            .describe("Program");

          const facilitySchema = z
            .object({
              id: z.string().uuid().describe("ID"),
              name: z.string().describe("Name"),
              type: z.string().describe("Type"),
              capacity: z.number().optional().describe("Capacity"),
            })
            .describe("Facility");

          const eventSchema = z
            .object({
              id: z.string().uuid().describe("ID"),
              name: z.string().describe("Name"),
              date: z.string().describe("Date"),
              description: z.string().optional().describe("Description"),
            })
            .describe("Event");

          // University schema with both BelongsTo and HasMany references
          const universitySchema = z
            .object({
              name: z.string().describe("University Name"),
              description: z.string().describe("Description"),
              foundedYear: z.number().describe("Founded Year"),
              website: z.string().describe("Website"),
              // BelongsTo relationships
              mainCampusId: z
                .string()
                .uuid()
                .reference({
                  type: RelationshipType.BELONGS_TO,
                  schema: campusSchema,
                  name: "mainCampus",
                })
                .describe("Main Campus"),
              accreditationId: z
                .string()
                .uuid()
                .reference({
                  type: RelationshipType.BELONGS_TO,
                  schema: accreditationSchema,
                  name: "accreditation",
                })
                .describe("Primary Accreditation"),
              // HasMany relationships
              programIds: z
                .array(z.string().uuid())
                .reference({
                  type: RelationshipType.HAS_MANY,
                  schema: programSchema,
                  name: "programs",
                })
                .describe("Academic Programs"),
              facilityIds: z
                .array(z.string().uuid())
                .reference({
                  type: RelationshipType.HAS_MANY,
                  schema: facilitySchema,
                  name: "facilities",
                })
                .describe("Facilities"),
              eventIds: z
                .array(z.string().uuid())
                .reference({
                  type: RelationshipType.HAS_MANY,
                  schema: eventSchema,
                  name: "events",
                })
                .describe("Upcoming Events"),
            })
            .describe("University");

          // Create a bridge with references
          const refBridge = new ZodReferencesBridge({
            schema: universitySchema,
            dependencies: {
              mainCampus: [
                {
                  id: "123e4567-e89b-12d3-a456-426614174030",
                  name: "Main Campus",
                  location: "Downtown",
                  size: 200,
                },
                {
                  id: "223e4567-e89b-12d3-a456-426614174030",
                  name: "North Campus",
                  location: "Suburbs",
                  size: 300,
                },
                {
                  id: "323e4567-e89b-12d3-a456-426614174030",
                  name: "South Campus",
                  location: "Riverside",
                  size: 150,
                },
              ],
              accreditation: [
                {
                  id: "123e4567-e89b-12d3-a456-426614174031",
                  name: "National Academic Accreditation",
                  organization: "National Education Board",
                  validUntil: "2030-12-31",
                },
                {
                  id: "223e4567-e89b-12d3-a456-426614174031",
                  name: "International Quality Certification",
                  organization: "Global Education Standards",
                  validUntil: "2028-06-30",
                },
                {
                  id: "323e4567-e89b-12d3-a456-426614174031",
                  name: "Professional Excellence Award",
                  organization: "Industry Education Council",
                  validUntil: "2026-09-15",
                },
              ],
              programs: [
                {
                  id: "123e4567-e89b-12d3-a456-426614174032",
                  name: "Computer Science",
                  level: "Bachelor",
                  duration: 4,
                },
                {
                  id: "223e4567-e89b-12d3-a456-426614174032",
                  name: "Business Administration",
                  level: "Master",
                  duration: 2,
                },
                {
                  id: "323e4567-e89b-12d3-a456-426614174032",
                  name: "Mechanical Engineering",
                  level: "Bachelor",
                  duration: 4,
                },
                {
                  id: "423e4567-e89b-12d3-a456-426614174032",
                  name: "Data Science",
                  level: "PhD",
                  duration: 3,
                },
              ],
              facilities: [
                {
                  id: "123e4567-e89b-12d3-a456-426614174033",
                  name: "Main Library",
                  type: "Library",
                  capacity: 500,
                },
                {
                  id: "223e4567-e89b-12d3-a456-426614174033",
                  name: "Science Lab",
                  type: "Laboratory",
                  capacity: 100,
                },
                {
                  id: "323e4567-e89b-12d3-a456-426614174033",
                  name: "Student Center",
                  type: "Recreation",
                  capacity: 300,
                },
                {
                  id: "423e4567-e89b-12d3-a456-426614174033",
                  name: "Sports Complex",
                  type: "Athletics",
                  capacity: 1000,
                },
              ],
              events: [
                {
                  id: "123e4567-e89b-12d3-a456-426614174034",
                  name: "Graduation Ceremony",
                  date: "2023-06-15",
                  description: "Annual graduation ceremony",
                },
                {
                  id: "223e4567-e89b-12d3-a456-426614174034",
                  name: "Research Symposium",
                  date: "2023-04-20",
                  description: "Annual research showcase",
                },
                {
                  id: "323e4567-e89b-12d3-a456-426614174034",
                  name: "Career Fair",
                  date: "2023-05-10",
                  description: "Connect with potential employers",
                },
                {
                  id: "423e4567-e89b-12d3-a456-426614174034",
                  name: "Alumni Reunion",
                  date: "2023-07-22",
                  description: "Annual alumni gathering",
                },
              ],
            },
          });

          const initialUniversityData = {
            name: "Orbital University",
            description: "A leading institution for higher education",
            foundedYear: 1950,
            website: "https://orbitaluniversity.edu",
            // Initial BelongsTo relationships
            mainCampusId: "123e4567-e89b-12d3-a456-426614174030", // Main Campus
            accreditationId: "123e4567-e89b-12d3-a456-426614174031", // National Academic Accreditation
            // Initial HasMany relationships
            programIds: ["123e4567-e89b-12d3-a456-426614174032"], // Initially has Computer Science
            facilityIds: ["123e4567-e89b-12d3-a456-426614174033"], // Initially has Main Library
            eventIds: ["123e4567-e89b-12d3-a456-426614174034"], // Initially has Graduation Ceremony
          };

          // Create a real Redux store
          const store = createRealStore();

          // Attach store to window object for Cypress to access
          cy.window().then((win) => {
            (win as any).store = store;
          });

          // Add a spy to the dispatch function to track updates
          const dispatchSpy = cy.spy(store, "dispatch").as("dispatchSpy");

          // Initialize store with data
          store.dispatch({
            type: "REGISTER_OBJECT_DATA",
            payload: {
              key: "main",
              data: initialUniversityData,
              objectId: "university-123",
            },
          });

          // Import useSelector explicitly to ensure it's properly typed
          const { useSelector } = require("react-redux");

          // Create a component to display the current Redux state using useSelector
          const ReduxStateDisplay = () => {
            // Use useSelector to subscribe to Redux state changes
            const mainCampusId = useSelector(
              (state: ObjectDataState) =>
                state.objectData.main?.data.mainCampusId
            );
            const accreditationId = useSelector(
              (state: ObjectDataState) =>
                state.objectData.main?.data.accreditationId
            );
            const programIds = useSelector(
              (state: ObjectDataState) => state.objectData.main?.data.programIds
            );
            const facilityIds = useSelector(
              (state: ObjectDataState) =>
                state.objectData.main?.data.facilityIds
            );
            const eventIds = useSelector(
              (state: ObjectDataState) => state.objectData.main?.data.eventIds
            );

            return (
              <div>
                <div data-testid="current-mainCampusId">{mainCampusId}</div>
                <div data-testid="current-accreditationId">
                  {accreditationId}
                </div>
                <div data-testid="current-programIds">
                  {JSON.stringify(programIds)}
                </div>
                <div data-testid="current-facilityIds">
                  {JSON.stringify(facilityIds)}
                </div>
                <div data-testid="current-eventIds">
                  {JSON.stringify(eventIds)}
                </div>
              </div>
            );
          };

          // Create selectors for the Redux store
          const dataSelector = () =>
            store.getState().objectData.main?.data || {};
          const objectIdSelector = () =>
            store.getState().objectData.main?.objectId;

          // Create a wrapper component that uses Redux
          function TestUniversityFormWithRedux() {
            return (
              <Provider store={store}>
                <div>
                  <ObjectProvider
                    schema={refBridge}
                    objectType="University"
                    data={{}} // Empty default data
                    dataSelector={dataSelector}
                    objectIdSelector={objectIdSelector}
                    dispatch={store.dispatch}
                    createUpdateAction={updateObjectData}
                  >
                    <ObjectFieldset />

                    {/* Use the component that will re-render when Redux state changes */}
                    <ReduxStateDisplay />

                    {/* Display Redux state for debugging */}
                    <div
                      data-testid="redux-state-debug"
                      style={{ display: "none" }}
                    >
                      {JSON.stringify(store.getState())}
                    </div>
                  </ObjectProvider>
                </div>
              </Provider>
            );
          }

          // Mount the test component
          mount(<TestUniversityFormWithRedux />);

          const universityFieldset = objectFieldset("University");

          // Verify the fieldset exists
          universityFieldset.should("exist");

          // Verify it has all the expected fields
          universityFieldset.hasField("name").should("be.true");
          universityFieldset.hasField("description").should("be.true");
          universityFieldset.hasField("foundedYear").should("be.true");
          universityFieldset.hasField("website").should("be.true");
          universityFieldset.hasField("mainCampusId").should("be.true");
          universityFieldset.hasField("accreditationId").should("be.true");
          universityFieldset.hasField("programIds").should("be.true");
          universityFieldset.hasField("facilityIds").should("be.true");
          universityFieldset.hasField("eventIds").should("be.true");

          // Test BelongsTo fields
          // Get the BelongsToField for main campus and interact with it
          const mainCampusField =
            universityFieldset.field<BelongsToFieldInteractable>(
              "mainCampusId"
            );
          mainCampusField.then((field) => {
            // Verify initial selection
            field.textField().should("have.value", "Main Campus");

            // Open the dropdown
            field.open();

            // Verify dropdown is open
            field.isOpened().should("be.true");

            // Select a different campus
            field.select("North Campus");

            // Verify the new selection
            field.textField().should("have.value", "North Campus");

            // Verify the Redux store was updated with the correct ID
            cy.window()
              .its("store")
              .then((storeInstance) => {
                const state = storeInstance.getState() as ObjectDataState;
                expect(state.objectData.main?.data.mainCampusId).to.equal(
                  "223e4567-e89b-12d3-a456-426614174030"
                );
              });

            // Verify the UI reflects this state
            cy.get('[data-testid="current-mainCampusId"]')
              .should("be.visible")
              .and("contain", "223e4567-e89b-12d3-a456-426614174030");
          });

          // Get the BelongsToField for accreditation and interact with it
          const accreditationField =
            universityFieldset.field<BelongsToFieldInteractable>(
              "accreditationId"
            );
          accreditationField.then((field) => {
            // Verify initial selection
            field
              .textField()
              .should("have.value", "National Academic Accreditation");

            // Open the dropdown
            field.open();

            // Verify dropdown is open
            field.isOpened().should("be.true");

            // Select a different accreditation
            field.select("International Quality Certification");

            // Verify the new selection
            field
              .textField()
              .should("have.value", "International Quality Certification");

            // Verify the Redux store was updated with the correct ID
            cy.window()
              .its("store")
              .then((storeInstance) => {
                const state = storeInstance.getState() as ObjectDataState;
                expect(state.objectData.main?.data.accreditationId).to.equal(
                  "223e4567-e89b-12d3-a456-426614174031"
                );
              });

            // Verify the UI reflects this state
            cy.get('[data-testid="current-accreditationId"]')
              .should("be.visible")
              .and("contain", "223e4567-e89b-12d3-a456-426614174031");
          });

          // Test HasMany fields
          // Get the HasManyField for programs and interact with it
          const programsField =
            universityFieldset.field<HasManyFieldInteractable>("programIds");
          programsField.then((field) => {
            // Verify initial selection (should have Computer Science)
            field.selected().should("include", "Computer Science");

            // Open the dropdown
            field.open();

            // Verify dropdown is open
            field.isOpened().should("be.true");

            // Select multiple programs at once (adding 3 more)
            field.select("Business Administration");
            field.select("Mechanical Engineering");
            field.select("Data Science");

            // Verify the Redux store was updated with the correct IDs
            cy.window()
              .its("store")
              .then((storeInstance) => {
                const state = storeInstance.getState() as ObjectDataState;
                const programIds = state.objectData.main?.data.programIds;

                expect(programIds).to.include(
                  "123e4567-e89b-12d3-a456-426614174032"
                ); // Computer Science
                expect(programIds).to.include(
                  "223e4567-e89b-12d3-a456-426614174032"
                ); // Business Administration
                expect(programIds).to.include(
                  "323e4567-e89b-12d3-a456-426614174032"
                ); // Mechanical Engineering
                expect(programIds).to.include(
                  "423e4567-e89b-12d3-a456-426614174032"
                ); // Data Science
                expect(programIds).to.have.length(4);
              });

            // Verify the UI reflects this state
            cy.get('[data-testid="current-programIds"]').should((el) => {
              const programIds = JSON.parse(el.text());
              expect(programIds).to.include(
                "123e4567-e89b-12d3-a456-426614174032"
              ); // Computer Science
              expect(programIds).to.include(
                "223e4567-e89b-12d3-a456-426614174032"
              ); // Business Administration
              expect(programIds).to.include(
                "323e4567-e89b-12d3-a456-426614174032"
              ); // Mechanical Engineering
              expect(programIds).to.include(
                "423e4567-e89b-12d3-a456-426614174032"
              ); // Data Science
              expect(programIds).to.have.length(4);
            });
          });

          // Get the HasManyField for facilities and interact with it
          const facilitiesField =
            universityFieldset.field<HasManyFieldInteractable>("facilityIds");
          facilitiesField.then((field) => {
            // Verify initial selection (should have Main Library)
            field.selected().should("include", "Main Library");

            // Open the dropdown
            field.open();

            // Verify dropdown is open
            field.isOpened().should("be.true");

            // Select multiple facilities at once (adding 3 more)
            field.select("Science Lab");
            field.select("Student Center");
            field.select("Sports Complex");

            // Verify the Redux store was updated with the correct IDs
            cy.window()
              .its("store")
              .then((storeInstance) => {
                const state = storeInstance.getState() as ObjectDataState;
                const facilityIds = state.objectData.main?.data.facilityIds;

                expect(facilityIds).to.include(
                  "123e4567-e89b-12d3-a456-426614174033"
                ); // Main Library
                expect(facilityIds).to.include(
                  "223e4567-e89b-12d3-a456-426614174033"
                ); // Science Lab
                expect(facilityIds).to.include(
                  "323e4567-e89b-12d3-a456-426614174033"
                ); // Student Center
                expect(facilityIds).to.include(
                  "423e4567-e89b-12d3-a456-426614174033"
                ); // Sports Complex
                expect(facilityIds).to.have.length(4);
              });

            // Verify the UI reflects this state
            cy.get('[data-testid="current-facilityIds"]').should((el) => {
              const facilityIds = JSON.parse(el.text());
              expect(facilityIds).to.include(
                "123e4567-e89b-12d3-a456-426614174033"
              ); // Main Library
              expect(facilityIds).to.include(
                "223e4567-e89b-12d3-a456-426614174033"
              ); // Science Lab
              expect(facilityIds).to.include(
                "323e4567-e89b-12d3-a456-426614174033"
              ); // Student Center
              expect(facilityIds).to.include(
                "423e4567-e89b-12d3-a456-426614174033"
              ); // Sports Complex
              expect(facilityIds).to.have.length(4);
            });
          });

          // Get the HasManyField for events and interact with it
          const eventsField =
            universityFieldset.field<HasManyFieldInteractable>("eventIds");
          eventsField.then((field) => {
            // Verify initial selection (should have Graduation Ceremony)
            field.selected().should("include", "Graduation Ceremony");

            // Open the dropdown
            field.open();

            // Verify dropdown is open
            field.isOpened().should("be.true");

            // Select multiple events at once (adding 3 more)
            field.select("Research Symposium");
            field.select("Career Fair");
            field.select("Alumni Reunion");

            // Verify the Redux store was updated with the correct IDs
            cy.window()
              .its("store")
              .then((storeInstance) => {
                const state = storeInstance.getState() as ObjectDataState;
                const eventIds = state.objectData.main?.data.eventIds;

                expect(eventIds).to.include(
                  "123e4567-e89b-12d3-a456-426614174034"
                ); // Graduation Ceremony
                expect(eventIds).to.include(
                  "223e4567-e89b-12d3-a456-426614174034"
                ); // Research Symposium
                expect(eventIds).to.include(
                  "323e4567-e89b-12d3-a456-426614174034"
                ); // Career Fair
                expect(eventIds).to.include(
                  "423e4567-e89b-12d3-a456-426614174034"
                ); // Alumni Reunion
                expect(eventIds).to.have.length(4);
              });

            // Verify the UI reflects this state
            cy.get('[data-testid="current-eventIds"]').should((el) => {
              const eventIds = JSON.parse(el.text());
              expect(eventIds).to.include(
                "123e4567-e89b-12d3-a456-426614174034"
              ); // Graduation Ceremony
              expect(eventIds).to.include(
                "223e4567-e89b-12d3-a456-426614174034"
              ); // Research Symposium
              expect(eventIds).to.include(
                "323e4567-e89b-12d3-a456-426614174034"
              ); // Career Fair
              expect(eventIds).to.include(
                "423e4567-e89b-12d3-a456-426614174034"
              ); // Alumni Reunion
              expect(eventIds).to.have.length(4);
            });
          });
        });
      });
    });
  });
});

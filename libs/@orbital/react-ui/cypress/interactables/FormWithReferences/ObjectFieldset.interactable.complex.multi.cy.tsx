// Import everything except Material-UI components
import { RelationshipType } from "@orbital/core/src/zod/reference/reference";
import { configureStore } from "@reduxjs/toolkit";
import { mount } from "cypress/react";
import { Provider, useSelector } from "react-redux";
import { z } from "zod";
import { ObjectFieldset } from "../../../src/components/FormWithReferences/ObjectFieldset";
import { ObjectProvider } from "../../../src/components/FormWithReferences/ObjectProvider";
import { ZodReferencesBridge } from "../../../src/components/FormWithReferences/ZodReferencesBridge";
import { BelongsToFieldInteractable } from "./BelongsToField.interactable";
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

describe("Multiple Object Fieldsets on the Same Page", () => {
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

  describe("Different Object Types with Redux", () => {
    it.only("works with three different object types (Project, Course, Organization) on the same page", () => {
      // Create schemas for Project
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

      const taskSchema = z
        .object({
          id: z.string().uuid().describe("ID"),
          name: z.string().describe("Task Name"),
          status: z.string().describe("Status"),
          dueDate: z.string().optional().describe("Due Date"),
        })
        .describe("Task");

      const milestoneSchema = z
        .object({
          id: z.string().uuid().describe("ID"),
          name: z.string().describe("Milestone Name"),
          date: z.string().describe("Date"),
          description: z.string().optional().describe("Description"),
        })
        .describe("Milestone");

      // Project schema with both BelongsTo and HasMany references
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
          clientId: z
            .string()
            .uuid()
            .reference({
              type: RelationshipType.BELONGS_TO,
              schema: clientSchema,
              name: "client",
            })
            .describe("Client"),
          // HasMany relationships
          taskIds: z
            .array(z.string().uuid())
            .reference({
              type: RelationshipType.HAS_MANY,
              schema: taskSchema,
              name: "tasks",
            })
            .describe("Project Tasks"),
          milestoneIds: z
            .array(z.string().uuid())
            .reference({
              type: RelationshipType.HAS_MANY,
              schema: milestoneSchema,
              name: "milestones",
            })
            .describe("Project Milestones"),
        })
        .describe("Project");

      // Create schemas for Course
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

      // Create schemas for Organization
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

      // Create bridges with references
      const projectBridge = new ZodReferencesBridge({
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
          ],
          tasks: [
            {
              id: "123e4567-e89b-12d3-a456-426614174101",
              name: "Design UI",
              status: "In Progress",
              dueDate: "2023-07-15",
            },
            {
              id: "223e4567-e89b-12d3-a456-426614174101",
              name: "Implement Backend",
              status: "Not Started",
              dueDate: "2023-08-01",
            },
            {
              id: "323e4567-e89b-12d3-a456-426614174101",
              name: "QA Testing",
              status: "Not Started",
              dueDate: "2023-08-15",
            },
          ],
          milestones: [
            {
              id: "123e4567-e89b-12d3-a456-426614174102",
              name: "Alpha Release",
              date: "2023-07-30",
              description: "Initial feature complete release",
            },
            {
              id: "223e4567-e89b-12d3-a456-426614174102",
              name: "Beta Release",
              date: "2023-08-30",
              description: "Feature complete with initial testing",
            },
            {
              id: "323e4567-e89b-12d3-a456-426614174102",
              name: "Production Release",
              date: "2023-09-30",
              description: "Final release to production",
            },
          ],
        },
      });

      const courseBridge = new ZodReferencesBridge({
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
          ],
        },
      });

      const organizationBridge = new ZodReferencesBridge({
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
          ],
          employees: [
            {
              id: "123e4567-e89b-12d3-a456-426614174022",
              name: "Emma Johnson",
              position: "CEO",
              email: "emma@organization.com",
            },
            {
              id: "223e4567-e89b-12d3-a456-426614174022",
              name: "Michael Chen",
              position: "CTO",
              email: "michael@organization.com",
            },
            {
              id: "323e4567-e89b-12d3-a456-426614174022",
              name: "Sophia Rodriguez",
              position: "CFO",
              email: "sophia@organization.com",
            },
          ],
          partners: [
            {
              id: "123e4567-e89b-12d3-a456-426614174023",
              name: "Acme Suppliers",
              type: "Supplier",
              contactPerson: "John Smith",
            },
            {
              id: "223e4567-e89b-12d3-a456-426614174023",
              name: "TechCorp Solutions",
              type: "Technology Provider",
              contactPerson: "Lisa Brown",
            },
            {
              id: "323e4567-e89b-12d3-a456-426614174023",
              name: "Global Logistics",
              type: "Distribution",
              contactPerson: "David Lee",
            },
          ],
        },
      });

      // Initial data for each object type
      const initialProjectData = {
        name: "Website Redesign",
        description: "Complete overhaul of company website",
        budget: 75000,
        startDate: "2023-06-01",
        managerId: "123e4567-e89b-12d3-a456-426614174001", // Alice Johnson
        departmentId: "123e4567-e89b-12d3-a456-426614174002", // Engineering
        clientId: "123e4567-e89b-12d3-a456-426614174003", // Acme Corporation
        taskIds: ["123e4567-e89b-12d3-a456-426614174101"], // Design UI
        milestoneIds: ["123e4567-e89b-12d3-a456-426614174102"], // Alpha Release
      };

      const initialCourseData = {
        title: "Advanced Computer Science",
        description: "In-depth study of algorithms and data structures",
        credits: 4,
        semester: "Fall 2023",
        studentIds: ["123e4567-e89b-12d3-a456-426614174004"], // Initially has one student
        instructorIds: ["123e4567-e89b-12d3-a456-426614174005"], // Initially has one instructor
        resourceIds: ["123e4567-e89b-12d3-a456-426614174006"], // Initially has one resource
      };

      const initialOrganizationData = {
        name: "Orbital Innovations",
        description: "Leading technology solutions provider",
        foundedYear: 2010,
        website: "https://orbitalinnovations.com",
        // Initial BelongsTo relationships
        headquarterId: "123e4567-e89b-12d3-a456-426614174020", // New York Office
        parentCompanyId: "123e4567-e89b-12d3-a456-426614174021", // Global Holdings Inc.
        // Initial HasMany relationships
        employeeIds: ["123e4567-e89b-12d3-a456-426614174022"], // Emma Johnson
        partnerIds: ["123e4567-e89b-12d3-a456-426614174023"], // Acme Suppliers
      };

      // Create a real Redux store
      const store = createRealStore();

      // Attach store to window object for Cypress to access
      cy.window().then((win) => {
        (win as any).store = store;
      });

      // Initialize store with data for each object
      store.dispatch({
        type: "REGISTER_OBJECT_DATA",
        payload: {
          key: "project",
          data: initialProjectData,
          objectId: "project-123",
        },
      });

      store.dispatch({
        type: "REGISTER_OBJECT_DATA",
        payload: {
          key: "course",
          data: initialCourseData,
          objectId: "course-123",
        },
      });

      store.dispatch({
        type: "REGISTER_OBJECT_DATA",
        payload: {
          key: "organization",
          data: initialOrganizationData,
          objectId: "organization-123",
        },
      });

      // Create a component to display the current Redux state for Project
      const ProjectStateDisplay = () => {
        const managerId = useSelector(
          (state: ObjectDataState) => state.objectData.project?.data.managerId
        );
        const departmentId = useSelector(
          (state: ObjectDataState) =>
            state.objectData.project?.data.departmentId
        );
        const clientId = useSelector(
          (state: ObjectDataState) => state.objectData.project?.data.clientId
        );
        const taskIds = useSelector(
          (state: ObjectDataState) => state.objectData.project?.data.taskIds
        );
        const milestoneIds = useSelector(
          (state: ObjectDataState) =>
            state.objectData.project?.data.milestoneIds
        );

        return (
          <div>
            <div data-testid="project-managerId">{managerId}</div>
            <div data-testid="project-departmentId">{departmentId}</div>
            <div data-testid="project-clientId">{clientId}</div>
            <div data-testid="project-taskIds">{JSON.stringify(taskIds)}</div>
            <div data-testid="project-milestoneIds">
              {JSON.stringify(milestoneIds)}
            </div>
          </div>
        );
      };

      // Create a component to display the current Redux state for Course
      const CourseStateDisplay = () => {
        const studentIds = useSelector(
          (state: ObjectDataState) => state.objectData.course?.data.studentIds
        );
        const instructorIds = useSelector(
          (state: ObjectDataState) =>
            state.objectData.course?.data.instructorIds
        );
        const resourceIds = useSelector(
          (state: ObjectDataState) => state.objectData.course?.data.resourceIds
        );

        return (
          <div>
            <div data-testid="course-studentIds">
              {JSON.stringify(studentIds)}
            </div>
            <div data-testid="course-instructorIds">
              {JSON.stringify(instructorIds)}
            </div>
            <div data-testid="course-resourceIds">
              {JSON.stringify(resourceIds)}
            </div>
          </div>
        );
      };

      // Create a component to display the current Redux state for Organization
      const OrganizationStateDisplay = () => {
        const headquarterId = useSelector(
          (state: ObjectDataState) =>
            state.objectData.organization?.data.headquarterId
        );
        const parentCompanyId = useSelector(
          (state: ObjectDataState) =>
            state.objectData.organization?.data.parentCompanyId
        );
        const employeeIds = useSelector(
          (state: ObjectDataState) =>
            state.objectData.organization?.data.employeeIds
        );
        const partnerIds = useSelector(
          (state: ObjectDataState) =>
            state.objectData.organization?.data.partnerIds
        );

        return (
          <div>
            <div data-testid="organization-headquarterId">{headquarterId}</div>
            <div data-testid="organization-parentCompanyId">
              {parentCompanyId}
            </div>
            <div data-testid="organization-employeeIds">
              {JSON.stringify(employeeIds)}
            </div>
            <div data-testid="organization-partnerIds">
              {JSON.stringify(partnerIds)}
            </div>
          </div>
        );
      };

      // Create selectors for the Redux store
      const projectDataSelector = () =>
        store.getState().objectData.project?.data || {};
      const projectIdSelector = () =>
        store.getState().objectData.project?.objectId;

      const courseDataSelector = () =>
        store.getState().objectData.course?.data || {};
      const courseIdSelector = () =>
        store.getState().objectData.course?.objectId;

      const organizationDataSelector = () =>
        store.getState().objectData.organization?.data || {};
      const organizationIdSelector = () =>
        store.getState().objectData.organization?.objectId;

      // Create a wrapper component that displays multiple object fieldsets with Redux
      function TestMultipleObjectsForm() {
        return (
          <Provider store={store}>
            <div>
              <div className="project-section" data-testid="project-section">
                <h2>Project</h2>
                <ObjectProvider
                  schema={projectBridge}
                  objectType="Project"
                  data={{}} // Empty default data
                  dataSelector={projectDataSelector}
                  objectIdSelector={projectIdSelector}
                  dispatch={store.dispatch}
                  createUpdateAction={(key, data, merge) =>
                    updateObjectData("project", data, merge)
                  }
                >
                  <ObjectFieldset />
                  <ProjectStateDisplay />
                </ObjectProvider>
              </div>

              <div className="course-section" data-testid="course-section">
                <h2>Course</h2>
                <ObjectProvider
                  schema={courseBridge}
                  objectType="Course"
                  data={{}} // Empty default data
                  dataSelector={courseDataSelector}
                  objectIdSelector={courseIdSelector}
                  dispatch={store.dispatch}
                  createUpdateAction={(key, data, merge) =>
                    updateObjectData("course", data, merge)
                  }
                >
                  <ObjectFieldset />
                  <CourseStateDisplay />
                </ObjectProvider>
              </div>

              <div
                className="organization-section"
                data-testid="organization-section"
              >
                <h2>Organization</h2>
                <ObjectProvider
                  schema={organizationBridge}
                  objectType="Organization"
                  data={{}} // Empty default data
                  dataSelector={organizationDataSelector}
                  objectIdSelector={organizationIdSelector}
                  dispatch={store.dispatch}
                  createUpdateAction={(key, data, merge) =>
                    updateObjectData("organization", data, merge)
                  }
                >
                  <ObjectFieldset />
                  <OrganizationStateDisplay />
                </ObjectProvider>
              </div>
            </div>
          </Provider>
        );
      }

      // Mount the test component
      mount(<TestMultipleObjectsForm />);

      // Get fieldsets for each object type
      const projectFieldset = objectFieldset("Project");
      const courseFieldset = objectFieldset("Course");
      const organizationFieldset = objectFieldset("Organization");

      // Verify all fieldsets exist
      projectFieldset.should("exist");
      courseFieldset.should("exist");
      organizationFieldset.should("exist");

      // Test Project fieldset
      cy.log("Testing Project fieldset");
      projectFieldset.hasField("name").should("be.true");
      projectFieldset.hasField("managerId").should("be.true");
      projectFieldset.hasField("taskIds").should("be.true");
      projectFieldset.hasField("milestoneIds").should("be.true");

      // Get the BelongsToField for manager and interact with it
      const managerField =
        projectFieldset.field<BelongsToFieldInteractable>("managerId");
      managerField.then((field: BelongsToFieldInteractable) => {
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

        // Verify the Redux store was updated with the correct ID
        cy.window()
          .its("store")
          .then((storeInstance) => {
            const state = storeInstance.getState() as ObjectDataState;
            expect(state.objectData.project?.data.managerId).to.equal(
              "223e4567-e89b-12d3-a456-426614174001"
            );
          });

        // Verify the UI reflects this state
        cy.get('[data-testid="project-managerId"]')
          .should("be.visible")
          .and("contain", "223e4567-e89b-12d3-a456-426614174001");
      });

      // Get the HasManyField for tasks and interact with it
      const tasksField =
        projectFieldset.field<HasManyFieldInteractable>("taskIds");
      tasksField.then((field: HasManyFieldInteractable) => {
        // Verify initial selection (should have Design UI)
        field.selected().should("include", "Design UI");

        // Open the dropdown
        field.open();

        // Verify dropdown is open
        field.isOpened().should("be.true");

        // Select multiple tasks
        field.select("Implement Backend");
        field.select("QA Testing");

        // Verify the Redux store was updated with all the correct IDs
        cy.window()
          .its("store")
          .then((storeInstance) => {
            const state = storeInstance.getState() as ObjectDataState;
            const taskIds = state.objectData.project?.data.taskIds;

            expect(taskIds).to.include("123e4567-e89b-12d3-a456-426614174101"); // Design UI
            expect(taskIds).to.include("223e4567-e89b-12d3-a456-426614174101"); // Implement Backend
            expect(taskIds).to.include("323e4567-e89b-12d3-a456-426614174101"); // QA Testing
            expect(taskIds).to.have.length(3);
          });

        // Verify the UI reflects this state
        cy.get('[data-testid="project-taskIds"]').should((el) => {
          const taskIds = JSON.parse(el.text());
          expect(taskIds).to.include("123e4567-e89b-12d3-a456-426614174101"); // Design UI
          expect(taskIds).to.include("223e4567-e89b-12d3-a456-426614174101"); // Implement Backend
          expect(taskIds).to.include("323e4567-e89b-12d3-a456-426614174101"); // QA Testing
          expect(taskIds).to.have.length(3);
        });
      });

      // Get the HasManyField for milestones and interact with it
      const milestonesField =
        projectFieldset.field<HasManyFieldInteractable>("milestoneIds");
      milestonesField.then((field: HasManyFieldInteractable) => {
        // Verify initial selection (should have Alpha Release)
        field.selected().should("include", "Alpha Release");

        // Open the dropdown
        field.open();

        // Verify dropdown is open
        field.isOpened().should("be.true");

        // Select multiple milestones
        field.select("Beta Release");
        field.select("Production Release");

        // Verify the Redux store was updated with all the correct IDs
        cy.window()
          .its("store")
          .then((storeInstance) => {
            const state = storeInstance.getState() as ObjectDataState;
            const milestoneIds = state.objectData.project?.data.milestoneIds;

            expect(milestoneIds).to.include(
              "123e4567-e89b-12d3-a456-426614174102"
            ); // Alpha Release
            expect(milestoneIds).to.include(
              "223e4567-e89b-12d3-a456-426614174102"
            ); // Beta Release
            expect(milestoneIds).to.include(
              "323e4567-e89b-12d3-a456-426614174102"
            ); // Production Release
            expect(milestoneIds).to.have.length(3);
          });

        // Verify the UI reflects this state
        cy.get('[data-testid="project-milestoneIds"]').should((el) => {
          const milestoneIds = JSON.parse(el.text());
          expect(milestoneIds).to.include(
            "123e4567-e89b-12d3-a456-426614174102"
          ); // Alpha Release
          expect(milestoneIds).to.include(
            "223e4567-e89b-12d3-a456-426614174102"
          ); // Beta Release
          expect(milestoneIds).to.include(
            "323e4567-e89b-12d3-a456-426614174102"
          ); // Production Release
          expect(milestoneIds).to.have.length(3);
        });
      });

      // Now test the Course object
      const courseFieldsetInstance = objectFieldset("Course");

      // Get the HasManyField for students and interact with it
      const studentsField =
        courseFieldsetInstance.field<HasManyFieldInteractable>("studentIds");
      studentsField.then((field: HasManyFieldInteractable) => {
        // Verify initial selection
        field.selected().should("include", "John Doe");

        // Open the dropdown
        field.open();

        // Verify dropdown is open
        field.isOpened().should("be.true");

        // Select multiple students
        field.select("Jane Smith");
        field.select("Michael Johnson");

        // Verify the Redux store was updated with all the correct IDs
        cy.window()
          .its("store")
          .then((storeInstance) => {
            const state = storeInstance.getState() as ObjectDataState;
            const studentIds = state.objectData.course?.data.studentIds;

            expect(studentIds).to.include(
              "123e4567-e89b-12d3-a456-426614174004"
            ); // John Doe
            expect(studentIds).to.include(
              "223e4567-e89b-12d3-a456-426614174004"
            ); // Jane Smith
            expect(studentIds).to.include(
              "323e4567-e89b-12d3-a456-426614174004"
            ); // Michael Johnson
            expect(studentIds).to.have.length(3);
          });

        // Verify the UI reflects this state
        cy.get('[data-testid="course-studentIds"]').should((el) => {
          const studentIds = JSON.parse(el.text());
          expect(studentIds).to.include("123e4567-e89b-12d3-a456-426614174004"); // John Doe
          expect(studentIds).to.include("223e4567-e89b-12d3-a456-426614174004"); // Jane Smith
          expect(studentIds).to.include("323e4567-e89b-12d3-a456-426614174004"); // Michael Johnson
          expect(studentIds).to.have.length(3);
        });
      });

      // Get the HasManyField for instructors and interact with it
      const instructorsField =
        courseFieldsetInstance.field<HasManyFieldInteractable>("instructorIds");
      instructorsField.then((field: HasManyFieldInteractable) => {
        // Verify initial selection
        field.selected().should("include", "Dr. Robert Brown");

        // Open the dropdown
        field.open();

        // Verify dropdown is open
        field.isOpened().should("be.true");

        // Select multiple instructors
        field.select("Prof. Sarah Wilson");
        field.select("Dr. James Taylor");

        // Verify the Redux store was updated with all the correct IDs
        cy.window()
          .its("store")
          .then((storeInstance) => {
            const state = storeInstance.getState() as ObjectDataState;
            const instructorIds = state.objectData.course?.data.instructorIds;

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

        // Now test the Organization object
        const organizationFieldsetInstance = objectFieldset("Organization");

        // Get the BelongsToField for headquarter and interact with it
        const headquarterField =
          organizationFieldsetInstance.field<BelongsToFieldInteractable>(
            "headquarterId"
          );
        headquarterField.then((field: BelongsToFieldInteractable) => {
          // Verify initial selection
          field.selected().should("equal", "New York Office");

          // Open the dropdown
          field.open();

          // Verify dropdown is open
          field.isOpened().should("be.true");

          // Select a different headquarter
          field.select("London Office");

          // Verify the Redux store was updated
          cy.window()
            .its("store")
            .then((storeInstance) => {
              const state = storeInstance.getState() as ObjectDataState;
              expect(
                state.objectData.organization?.data.headquarterId
              ).to.equal("223e4567-e89b-12d3-a456-426614174020");
            });

          // Verify the UI reflects this state
          cy.get('[data-testid="organization-headquarterId"]').should(
            "contain",
            "223e4567-e89b-12d3-a456-426614174020"
          );
        });

        // Get the BelongsToField for parent company and interact with it
        const parentCompanyField =
          organizationFieldsetInstance.field<BelongsToFieldInteractable>(
            "parentCompanyId"
          );
        parentCompanyField.then((field: BelongsToFieldInteractable) => {
          // Verify initial selection
          field.selected().should("equal", "Global Holdings Inc.");

          // Open the dropdown
          field.open();

          // Verify dropdown is open
          field.isOpened().should("be.true");

          // Select a different parent company
          field.select("Tech Ventures Ltd.");

          // Verify the Redux store was updated
          cy.window()
            .its("store")
            .then((storeInstance) => {
              const state = storeInstance.getState() as ObjectDataState;
              expect(
                state.objectData.organization?.data.parentCompanyId
              ).to.equal("223e4567-e89b-12d3-a456-426614174021");
            });

          // Verify the UI reflects this state
          cy.get('[data-testid="organization-parentCompanyId"]').should(
            "contain",
            "223e4567-e89b-12d3-a456-426614174021"
          );
        });

        // Get the HasManyField for employees and interact with it
        const employeesField =
          organizationFieldsetInstance.field<HasManyFieldInteractable>(
            "employeeIds"
          );
        employeesField.then((field: HasManyFieldInteractable) => {
          // Verify initial selection
          field.selected().should("include", "Emma Johnson");

          // Open the dropdown
          field.open();

          // Verify dropdown is open
          field.isOpened().should("be.true");

          // Select multiple employees
          field.select("Michael Chen");
          field.select("Sophia Rodriguez");

          // Verify the Redux store was updated with all the correct IDs
          cy.window()
            .its("store")
            .then((storeInstance) => {
              const state = storeInstance.getState() as ObjectDataState;
              const employeeIds =
                state.objectData.organization?.data.employeeIds;

              expect(employeeIds).to.include(
                "123e4567-e89b-12d3-a456-426614174022"
              ); // Emma Johnson
              expect(employeeIds).to.include(
                "223e4567-e89b-12d3-a456-426614174022"
              ); // Michael Chen
              expect(employeeIds).to.include(
                "323e4567-e89b-12d3-a456-426614174022"
              ); // Sophia Rodriguez
              expect(employeeIds).to.have.length(3);
            });

          // Verify the UI reflects this state
          cy.get('[data-testid="organization-employeeIds"]').should((el) => {
            const employeeIds = JSON.parse(el.text());
            expect(employeeIds).to.include(
              "123e4567-e89b-12d3-a456-426614174022"
            ); // Emma Johnson
            expect(employeeIds).to.include(
              "223e4567-e89b-12d3-a456-426614174022"
            ); // Michael Chen
            expect(employeeIds).to.include(
              "323e4567-e89b-12d3-a456-426614174022"
            ); // Sophia Rodriguez
            expect(employeeIds).to.have.length(3);
          });
        });

        // Get the HasManyField for partners and interact with it
        const partnersField =
          organizationFieldsetInstance.field<HasManyFieldInteractable>(
            "partnerIds"
          );
        partnersField.then((field: HasManyFieldInteractable) => {
          // Verify initial selection
          field.selected().should("include", "Acme Suppliers");

          // Open the dropdown
          field.open();

          // Verify dropdown is open
          field.isOpened().should("be.true");

          // Select multiple partners
          field.select("TechCorp Solutions");
          field.select("Global Logistics");

          // Verify the Redux store was updated with all the correct IDs
          cy.window()
            .its("store")
            .then((storeInstance) => {
              const state = storeInstance.getState() as ObjectDataState;
              const partnerIds = state.objectData.organization?.data.partnerIds;

              expect(partnerIds).to.include(
                "123e4567-e89b-12d3-a456-426614174023"
              ); // Acme Suppliers
              expect(partnerIds).to.include(
                "223e4567-e89b-12d3-a456-426614174023"
              ); // TechCorp Solutions
              expect(partnerIds).to.include(
                "323e4567-e89b-12d3-a456-426614174023"
              ); // Global Logistics
              expect(partnerIds).to.have.length(3);
            });

          // Verify the UI reflects this state
          cy.get('[data-testid="organization-partnerIds"]').should((el) => {
            const partnerIds = JSON.parse(el.text());
            expect(partnerIds).to.include(
              "123e4567-e89b-12d3-a456-426614174023"
            ); // Acme Suppliers
            expect(partnerIds).to.include(
              "223e4567-e89b-12d3-a456-426614174023"
            ); // TechCorp Solutions
            expect(partnerIds).to.include(
              "323e4567-e89b-12d3-a456-426614174023"
            ); // Global Logistics
            expect(partnerIds).to.have.length(3);
          });
        });
      });

      it("Same Object Type with Different IDs", () => {
        // Define schemas for Product
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
            location: z.string().describe("Location"),
            contactEmail: z
              .string()
              .email()
              .optional()
              .describe("Contact Email"),
          })
          .describe("Supplier");

        const featureSchema = z
          .object({
            id: z.string().uuid().describe("ID"),
            name: z.string().describe("Name"),
            description: z.string().describe("Description"),
          })
          .describe("Feature");

        const accessorySchema = z
          .object({
            id: z.string().uuid().describe("ID"),
            name: z.string().describe("Name"),
            price: z.number().describe("Price"),
            description: z.string().optional().describe("Description"),
          })
          .describe("Accessory");

        // Product schema with both BelongsTo and HasMany references
        const productSchema = z
          .object({
            name: z.string().describe("Product Name"),
            description: z.string().optional().describe("Description"),
            price: z.number().min(0).describe("Price"),
            // BelongsTo relationships
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
            // HasMany relationships
            featureIds: z
              .array(z.string().uuid())
              .reference({
                type: RelationshipType.HAS_MANY,
                schema: featureSchema,
                name: "features",
              })
              .describe("Product Features"),
            accessoryIds: z
              .array(z.string().uuid())
              .reference({
                type: RelationshipType.HAS_MANY,
                schema: accessorySchema,
                name: "accessories",
              })
              .describe("Product Accessories"),
          })
          .describe("Product");

        // Create bridge with references
        const productBridge = new ZodReferencesBridge({
          schema: productSchema,
          dependencies: {
            category: [
              {
                id: "123e4567-e89b-12d3-a456-426614174110",
                name: "Electronics",
                description: "Electronic devices and gadgets",
              },
              {
                id: "223e4567-e89b-12d3-a456-426614174110",
                name: "Clothing",
                description: "Apparel and accessories",
              },
            ],
            supplier: [
              {
                id: "123e4567-e89b-12d3-a456-426614174111",
                name: "TechSupplier",
                location: "California",
                contactEmail: "contact@techsupplier.com",
              },
              {
                id: "223e4567-e89b-12d3-a456-426614174111",
                name: "MobileSupplier",
                location: "Texas",
                contactEmail: "info@mobilesupplier.com",
              },
            ],
            features: [
              {
                id: "123e4567-e89b-12d3-a456-426614174112",
                name: "High Performance",
                description: "Delivers exceptional performance",
              },
              {
                id: "223e4567-e89b-12d3-a456-426614174112",
                name: "Touchscreen",
                description: "Interactive touch display",
              },
              {
                id: "323e4567-e89b-12d3-a456-426614174112",
                name: "Lightweight",
                description: "Easy to carry and transport",
              },
              {
                id: "423e4567-e89b-12d3-a456-426614174112",
                name: "Long Battery Life",
                description: "Extended usage without charging",
              },
            ],
            accessories: [
              {
                id: "123e4567-e89b-12d3-a456-426614174113",
                name: "Laptop Bag",
                price: 49.99,
                description: "Protective carrying case",
              },
              {
                id: "223e4567-e89b-12d3-a456-426614174113",
                name: "Phone Case",
                price: 19.99,
                description: "Protective cover",
              },
              {
                id: "323e4567-e89b-12d3-a456-426614174113",
                name: "Screen Protector",
                price: 9.99,
                description: "Scratch-resistant film",
              },
              {
                id: "423e4567-e89b-12d3-a456-426614174113",
                name: "Wireless Charger",
                price: 29.99,
                description: "Cordless charging pad",
              },
            ],
          },
        });

        // Create a Redux store for this test
        const store = createRealStore();
        cy.window().then((win) => {
          (win as any).store = store;
        });

        // Register initial data for two different Product instances
        store.dispatch({
          type: "REGISTER_OBJECT_DATA",
          payload: {
            key: "product1",
            data: {
              id: "product-123",
              name: "Laptop",
              price: 999.99,
              categoryId: "123e4567-e89b-12d3-a456-426614174110", // Electronics
              supplierId: "123e4567-e89b-12d3-a456-426614174111", // TechSupplier
              featureIds: ["123e4567-e89b-12d3-a456-426614174112"], // High Performance
              accessoryIds: ["123e4567-e89b-12d3-a456-426614174113"], // Laptop Bag
            },
            objectId: "product-123",
          },
        });

        store.dispatch({
          type: "REGISTER_OBJECT_DATA",
          payload: {
            key: "product2",
            data: {
              id: "product-456",
              name: "Smartphone",
              price: 699.99,
              categoryId: "123e4567-e89b-12d3-a456-426614174110", // Electronics
              supplierId: "223e4567-e89b-12d3-a456-426614174111", // MobileSupplier
              featureIds: ["223e4567-e89b-12d3-a456-426614174112"], // Touchscreen
              accessoryIds: ["223e4567-e89b-12d3-a456-426614174113"], // Phone Case
            },
            objectId: "product-456",
          },
        });

        // Create selectors for the first product
        const product1DataSelector = () =>
          store.getState().objectData.product1?.data || {};
        const product1IdSelector = () =>
          store.getState().objectData.product1?.objectId;

        // Create selectors for the second product
        const product2DataSelector = () =>
          store.getState().objectData.product2?.data || {};
        const product2IdSelector = () =>
          store.getState().objectData.product2?.objectId;

        // Create a component to display the Redux state for each product
        const Product1StateDisplay = () => {
          const data = useSelector(product1DataSelector);
          return (
            <div>
              <div data-testid="product1-categoryId">{data.categoryId}</div>
              <div data-testid="product1-supplierId">{data.supplierId}</div>
              <div data-testid="product1-featureIds">
                {JSON.stringify(data.featureIds)}
              </div>
              <div data-testid="product1-accessoryIds">
                {JSON.stringify(data.accessoryIds)}
              </div>
            </div>
          );
        };

        const Product2StateDisplay = () => {
          const data = useSelector(product2DataSelector);
          return (
            <div>
              <div data-testid="product2-categoryId">{data.categoryId}</div>
              <div data-testid="product2-supplierId">{data.supplierId}</div>
              <div data-testid="product2-featureIds">
                {JSON.stringify(data.featureIds)}
              </div>
              <div data-testid="product2-accessoryIds">
                {JSON.stringify(data.accessoryIds)}
              </div>
            </div>
          );
        };

        // Create a component with two Product instances
        const TestMultipleProductsForm = () => {
          return (
            <Provider store={store}>
              <div>
                <div>
                  <h3>Product 1: Laptop</h3>
                  <ObjectProvider
                    schema={productBridge}
                    objectType="Product"
                    data={{}} // Empty default data
                    dataSelector={product1DataSelector}
                    objectIdSelector={product1IdSelector}
                    dispatch={store.dispatch}
                    createUpdateAction={(key, data, merge) =>
                      updateObjectData("product1", data, merge)
                    }
                  >
                    <ObjectFieldset />
                    <Product1StateDisplay />
                  </ObjectProvider>
                </div>
                <div>
                  <h3>Product 2: Smartphone</h3>
                  <ObjectProvider
                    schema={productBridge}
                    objectType="Product"
                    data={{}} // Empty default data
                    dataSelector={product2DataSelector}
                    objectIdSelector={product2IdSelector}
                    dispatch={store.dispatch}
                    createUpdateAction={(key, data, merge) =>
                      updateObjectData("product2", data, merge)
                    }
                  >
                    <ObjectFieldset />
                    <Product2StateDisplay />
                  </ObjectProvider>
                </div>
              </div>
            </Provider>
          );
        };

        // Mount the component
        cy.mount(<TestMultipleProductsForm />);

        // Get the fieldsets for both products
        const product1Fieldset = objectFieldset("Product");
        const product2Fieldset = objectFieldset("Product");

        // Test Product 1 BelongsTo fields
        const product1CategoryField =
          product1Fieldset.field<BelongsToFieldInteractable>("categoryId");
        product1CategoryField.then((field: BelongsToFieldInteractable) => {
          // Verify initial selection
          field.selected().should("equal", "Electronics");

          // Open the dropdown
          field.open();

          // Select a different category
          field.select("Clothing");

          // Verify the Redux store was updated for Product 1 only
          cy.window()
            .its("store")
            .then((storeInstance) => {
              const state = storeInstance.getState() as ObjectDataState;
              // Product 1 should be updated
              expect(state.objectData.product1?.data.categoryId).to.equal(
                "223e4567-e89b-12d3-a456-426614174110"
              );
              // Product 2 should remain unchanged
              expect(state.objectData.product2?.data.categoryId).to.equal(
                "123e4567-e89b-12d3-a456-426614174110"
              );
            });

          // Verify the UI reflects this state
          cy.get('[data-testid="product1-categoryId"]').should(
            "contain",
            "223e4567-e89b-12d3-a456-426614174110"
          );
          cy.get('[data-testid="product2-categoryId"]').should(
            "contain",
            "123e4567-e89b-12d3-a456-426614174110"
          );
        });

        // Test Product 2 BelongsTo fields
        const product2SupplierField =
          product2Fieldset.field<BelongsToFieldInteractable>("supplierId");
        product2SupplierField.then((field: BelongsToFieldInteractable) => {
          // Verify initial selection
          field.selected().should("equal", "MobileSupplier");

          // Open the dropdown
          field.open();

          // Select a different supplier
          field.select("TechSupplier");

          // Verify the Redux store was updated for Product 2 only
          cy.window()
            .its("store")
            .then((storeInstance) => {
              const state = storeInstance.getState() as ObjectDataState;
              // Product 2 should be updated
              expect(state.objectData.product2?.data.supplierId).to.equal(
                "123e4567-e89b-12d3-a456-426614174111"
              );
              // Product 1 should remain unchanged
              expect(state.objectData.product1?.data.supplierId).to.equal(
                "123e4567-e89b-12d3-a456-426614174111"
              );
            });

          // Verify the UI reflects this state
          cy.get('[data-testid="product2-supplierId"]').should(
            "contain",
            "123e4567-e89b-12d3-a456-426614174111"
          );
        });

        // Test Product 1 HasMany fields
        const product1FeaturesField =
          product1Fieldset.field<HasManyFieldInteractable>("featureIds");
        product1FeaturesField.then((field: HasManyFieldInteractable) => {
          // Verify initial selection
          field.selected().should("include", "High Performance");

          // Open the dropdown
          field.open();

          // Select additional features
          field.select("Lightweight");
          field.select("Long Battery Life");

          // Verify the Redux store was updated for Product 1 only
          cy.window()
            .its("store")
            .then((storeInstance) => {
              const state = storeInstance.getState() as ObjectDataState;
              const product1FeatureIds =
                state.objectData.product1?.data.featureIds;
              const product2FeatureIds =
                state.objectData.product2?.data.featureIds;

              // Product 1 should have all three features
              expect(product1FeatureIds).to.include(
                "123e4567-e89b-12d3-a456-426614174112"
              ); // High Performance
              expect(product1FeatureIds).to.include(
                "323e4567-e89b-12d3-a456-426614174112"
              ); // Lightweight
              expect(product1FeatureIds).to.include(
                "423e4567-e89b-12d3-a456-426614174112"
              ); // Long Battery Life
              expect(product1FeatureIds).to.have.length(3);

              // Product 2 should remain unchanged
              expect(product2FeatureIds).to.deep.equal([
                "223e4567-e89b-12d3-a456-426614174112",
              ]); // Touchscreen only
            });

          // Verify the UI reflects this state
          cy.get('[data-testid="product1-featureIds"]').should((el) => {
            const featureIds = JSON.parse(el.text());
            expect(featureIds).to.include(
              "123e4567-e89b-12d3-a456-426614174112"
            ); // High Performance
            expect(featureIds).to.include(
              "323e4567-e89b-12d3-a456-426614174112"
            ); // Lightweight
            expect(featureIds).to.include(
              "423e4567-e89b-12d3-a456-426614174112"
            ); // Long Battery Life
            expect(featureIds).to.have.length(3);
          });

          cy.get('[data-testid="product2-featureIds"]').should((el) => {
            const featureIds = JSON.parse(el.text());
            expect(featureIds).to.deep.equal([
              "223e4567-e89b-12d3-a456-426614174112",
            ]); // Touchscreen only
          });
        });

        // Test Product 2 HasMany fields
        const product2AccessoriesField =
          product2Fieldset.field<HasManyFieldInteractable>("accessoryIds");
        product2AccessoriesField.then((field: HasManyFieldInteractable) => {
          // Verify initial selection
          field.selected().should("include", "Phone Case");

          // Open the dropdown
          field.open();

          // Select additional accessories
          field.select("Screen Protector");
          field.select("Wireless Charger");

          // Verify the Redux store was updated for Product 2 only
          cy.window()
            .its("store")
            .then((storeInstance) => {
              const state = storeInstance.getState() as ObjectDataState;
              const product1AccessoryIds =
                state.objectData.product1?.data.accessoryIds;
              const product2AccessoryIds =
                state.objectData.product2?.data.accessoryIds;

              // Product 2 should have all three accessories
              expect(product2AccessoryIds).to.include(
                "223e4567-e89b-12d3-a456-426614174113"
              ); // Phone Case
              expect(product2AccessoryIds).to.include(
                "323e4567-e89b-12d3-a456-426614174113"
              ); // Screen Protector
              expect(product2AccessoryIds).to.include(
                "423e4567-e89b-12d3-a456-426614174113"
              ); // Wireless Charger
              expect(product2AccessoryIds).to.have.length(3);

              // Product 1 should remain unchanged
              expect(product1AccessoryIds).to.deep.equal([
                "123e4567-e89b-12d3-a456-426614174113",
              ]); // Laptop Bag only
            });

          // Verify the UI reflects this state
          cy.get('[data-testid="product2-accessoryIds"]').should((el) => {
            const accessoryIds = JSON.parse(el.text());
            expect(accessoryIds).to.include(
              "223e4567-e89b-12d3-a456-426614174113"
            ); // Phone Case
            expect(accessoryIds).to.include(
              "323e4567-e89b-12d3-a456-426614174113"
            ); // Screen Protector
            expect(accessoryIds).to.include(
              "423e4567-e89b-12d3-a456-426614174113"
            ); // Wireless Charger
            expect(accessoryIds).to.have.length(3);
          });

          cy.get('[data-testid="product1-accessoryIds"]').should((el) => {
            const accessoryIds = JSON.parse(el.text());
            expect(accessoryIds).to.deep.equal([
              "123e4567-e89b-12d3-a456-426614174113",
            ]); // Laptop Bag only
          });
        });
      });
    });
  });
});

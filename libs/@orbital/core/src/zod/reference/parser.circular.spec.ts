import { z } from "zod";
import { parseWithReferences } from "./parser";
import { RelationshipType } from "./reference";

describe("parseWithReferences with circular references", () => {
  // Create schemas with circular references
  const PersonSchema = z
    .object({
      _id: z.string(),
      name: z.string(),
      // Will be defined later to create circular reference
      friendIds: z.array(z.string()),
    })
    .describe("A person with name");

  // Add circular reference - people can be friends with other people
  PersonSchema.shape.friendIds = z.array(z.string()).reference({
    schema: PersonSchema,
    type: RelationshipType.MANY_TO_MANY,
  });

  // Create a more complex circular reference scenario
  const DepartmentSchema = z
    .object({
      _id: z.string(),
      name: z.string(),
      managerId: z.string().optional(),
    })
    .describe("A department with name");

  const EmployeeSchema = z
    .object({
      _id: z.string(),
      name: z.string(),
      departmentId: z.string().reference({
        schema: DepartmentSchema,
      }),
    })
    .describe("An employee with name");

  // Add circular reference - department manager is an employee
  DepartmentSchema.shape.managerId = z
    .string()
    .reference({
      schema: EmployeeSchema,
    })
    .optional();

  // Test data
  const testPeople = [
    { _id: "person1", name: "Alice" },
    { _id: "person2", name: "Bob" },
    { _id: "person3", name: "Charlie" },
  ];

  const testDepartments = [
    { _id: "dept1", name: "Engineering", managerId: "emp1" },
    { _id: "dept2", name: "Marketing", managerId: "emp2" },
  ];

  const testEmployees = [
    { _id: "emp1", name: "Dave", departmentId: "dept1" },
    { _id: "emp2", name: "Eve", departmentId: "dept2" },
    { _id: "emp3", name: "Frank", departmentId: "dept1" },
  ];

  it("should handle direct circular references without stack overflow", () => {
    // Create a person with friends
    const person = {
      _id: "person4",
      name: "David",
      friendIds: ["person1", "person2", "nonexistent"],
    };

    const result = parseWithReferences(PersonSchema, person, {
      dependencies: {
        person: testPeople,
      },
    });

    // Should fail validation because "nonexistent" friend doesn't exist
    expect(result.success).toBe(false);
    expect(result.error?.issues.length).toBe(1);
    expect(result.error?.issues[0].path).toEqual(["friendIds", 2]);
  });

  it("should handle nested circular references without stack overflow", () => {
    // Create a complex object with department and employees
    const organization = {
      departments: [
        { _id: "dept1", name: "Engineering", managerId: "emp1" },
        { _id: "dept2", name: "Marketing", managerId: "nonexistent" }, // Invalid manager
      ],
      employees: [
        { _id: "emp1", name: "Dave", departmentId: "dept1" },
        { _id: "emp2", name: "Eve", departmentId: "nonexistent" }, // Invalid department
      ],
    };

    // Create a schema for the organization
    const OrganizationSchema = z.object({
      departments: z.array(DepartmentSchema),
      employees: z.array(EmployeeSchema),
    });

    const result = parseWithReferences(OrganizationSchema, organization, {
      dependencies: {
        department: testDepartments,
        employee: testEmployees,
      },
    });

    // Should fail validation with two issues
    expect(result.success).toBe(false);
    expect(result.error?.issues.length).toBe(2);

    // Check that both issues are detected
    const paths = result.error?.issues.map((issue) => issue.path.join("."));
    expect(paths).toContain("departments.1.managerId");
    expect(paths).toContain("employees.1.departmentId");
  });

  it("should handle deeply nested circular references", () => {
    // Create a schema with multiple levels of nesting and circular references
    const TeamSchema = z
      .object({
        _id: z.string(),
        name: z.string(),
        leaderId: z.string().reference({
          schema: EmployeeSchema,
        }),
        departmentId: z.string().reference({
          schema: DepartmentSchema,
        }),
        memberIds: z.array(z.string()).reference({
          schema: EmployeeSchema,
          type: RelationshipType.MANY_TO_MANY,
        }),
      })
      .describe("A team with name");

    // Create a project schema that references teams
    const ProjectSchema = z
      .object({
        _id: z.string(),
        name: z.string(),
        teamId: z.string().reference({
          schema: TeamSchema,
        }),
        // Employees can work on multiple projects
        contributorIds: z.array(z.string()).reference({
          schema: EmployeeSchema,
          type: RelationshipType.MANY_TO_MANY,
        }),
      })
      .describe("A project with name");

    // Add projects to employees to create another circular reference
    const EmployeeWithProjectsSchema = EmployeeSchema.extend({
      projectIds: z
        .array(z.string())
        .reference({
          schema: ProjectSchema,
          type: RelationshipType.MANY_TO_MANY,
        })
        .optional(),
    });

    const testTeams = [
      {
        _id: "team1",
        name: "Frontend",
        leaderId: "emp1",
        departmentId: "dept1",
        memberIds: ["emp1", "emp3"],
      },
      {
        _id: "team2",
        name: "Backend",
        leaderId: "emp2",
        departmentId: "dept1",
        memberIds: ["emp2"],
      },
    ];

    const testProjects = [
      {
        _id: "proj1",
        name: "Website Redesign",
        teamId: "team1",
        contributorIds: ["emp1", "emp3"],
      },
      {
        _id: "proj2",
        name: "API Development",
        teamId: "team2",
        contributorIds: ["emp2"],
      },
    ];

    // Create a complex object with circular references at multiple levels
    const complexData = {
      _id: "emp4",
      name: "Grace",
      departmentId: "dept1",
      projectIds: ["proj1", "nonexistent"], // One valid, one invalid
    };

    const result = parseWithReferences(
      EmployeeWithProjectsSchema,
      complexData,
      {
        dependencies: {
          department: testDepartments,
          employee: testEmployees,
          team: testTeams,
          project: testProjects,
        },
      }
    );

    // Should fail validation because of the nonexistent project
    expect(result.success).toBe(false);
    expect(result.error?.issues.length).toBe(1);
    expect(result.error?.issues[0].path).toEqual(["projectIds", 1]);
  });

  it("should handle maximum recursion depth", () => {
    // Create a schema with self-reference
    const NodeSchema = z
      .object({
        _id: z.string(),
        name: z.string(),
        childId: z.string().optional(),
      })
      .describe("A node with name");

    // Add self-reference
    NodeSchema.shape.childId = z
      .string()
      .reference({
        schema: NodeSchema,
      })
      .optional();

    // Create a deeply nested chain of nodes
    const deeplyNested = {
      _id: "node1",
      name: "Root",
      childId: "node2",
    };

    // Create test nodes with a valid chain
    const testNodes = [
      { _id: "node1", name: "Root", childId: "node2" },
      { _id: "node2", name: "Level 1", childId: "node3" },
      { _id: "node3", name: "Level 2", childId: "node4" },
      { _id: "node4", name: "Level 3", childId: "node5" },
      { _id: "node5", name: "Level 4", childId: "node1" }, // Circular back to root
    ];

    // Test with a low max depth to trigger the depth limit
    const result = parseWithReferences(NodeSchema, deeplyNested, {
      dependencies: {
        node: testNodes,
      },
      maxDepth: 3, // Set a low max depth to trigger the limit
    });

    // Should fail due to max depth
    expect(result.success).toBe(false);
    expect(result.error?.issues[0].message).toContain(
      "Maximum recursion depth exceeded"
    );
  });
});

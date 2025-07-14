import { mount } from "cypress/react";
import { z } from "zod";
import { ObjectSchemaProvider, useObjectSchema } from "./ObjectSchemaContext";
import { ZodReferencesBridge } from "./ZodReferencesBridge";

// Test component that uses the useObjectSchema hook
const SchemaConsumer = ({ id = "" }: { id?: string }) => {
  const { schema, objectType } = useObjectSchema();

  return (
    <div>
      <div data-testid={`schema-object-type${id ? `-${id}` : ""}`}>
        {objectType || "Not found"}
      </div>
      <div data-testid={`schema-available${id ? `-${id}` : ""}`}>
        {schema ? "Available" : "Not available"}
      </div>
    </div>
  );
};

// Test component that will throw an error when used outside provider
const ErrorComponent = () => {
  try {
    useObjectSchema();
    return <div>This should not render</div>;
  } catch (error) {
    return <div data-testid="error-message">{(error as Error).message}</div>;
  }
};

describe("ObjectSchemaContext", () => {
  beforeEach(() => {
    // Disable uncaught exception handling
    cy.on("uncaught:exception", () => false);
  });

  it("should provide the schema and object type", () => {
    // Create a test schema
    const userSchema = z.object({
      name: z.string(),
      email: z.string().email(),
    });

    const bridge = new ZodReferencesBridge({
      schema: userSchema,
    });

    // Mount the provider with a consumer
    mount(
      <ObjectSchemaProvider schema={bridge} objectType="User">
        <SchemaConsumer />
      </ObjectSchemaProvider>
    );

    // Verify the object type is correctly provided
    cy.get("[data-testid='schema-object-type']").should("contain.text", "User");
    cy.get("[data-testid='schema-available']").should(
      "contain.text",
      "Available"
    );
  });

  it("should infer object type from schema when not provided", () => {
    // Create a test schema with a description that matches the expected pattern
    const userSchema = z
      .object({
        name: z.string(),
        email: z.string().email(),
      })
      .describe("A User");

    const bridge = new ZodReferencesBridge({
      schema: userSchema,
    });

    // Mount the provider with a consumer
    mount(
      <ObjectSchemaProvider schema={bridge}>
        <SchemaConsumer />
      </ObjectSchemaProvider>
    );

    // Verify the object type is correctly inferred
    cy.get("[data-testid='schema-object-type']").should("contain.text", "User");
  });

  it("should throw an error when useObjectSchema is used outside provider", () => {
    // Mount the component without a provider
    mount(<ErrorComponent />);

    // Verify the error message
    cy.get("[data-testid='error-message']").should(
      "contain.text",
      "useObjectSchema must be used within an ObjectSchemaProvider"
    );
  });

  it("should support multiple sibling contexts with the same schema type", () => {
    // Create a test schema
    const userSchema = z.object({
      name: z.string(),
      email: z.string().email(),
    });

    const bridge = new ZodReferencesBridge({
      schema: userSchema,
    });

    // Mount multiple providers with the same schema type
    mount(
      <div>
        <div id="context-1">
          <ObjectSchemaProvider schema={bridge} objectType="User1">
            <SchemaConsumer id="1" />
          </ObjectSchemaProvider>
        </div>
        <div id="context-2">
          <ObjectSchemaProvider schema={bridge} objectType="User2">
            <SchemaConsumer id="2" />
          </ObjectSchemaProvider>
        </div>
      </div>
    );

    // Verify each context has its own object type
    cy.get("[data-testid='schema-object-type-1']").should(
      "contain.text",
      "User1"
    );
    cy.get("[data-testid='schema-available-1']").should(
      "contain.text",
      "Available"
    );

    cy.get("[data-testid='schema-object-type-2']").should(
      "contain.text",
      "User2"
    );
    cy.get("[data-testid='schema-available-2']").should(
      "contain.text",
      "Available"
    );
  });

  it("should support multiple sibling contexts with different schema types", () => {
    // Create two different schemas
    const userSchema = z.object({
      name: z.string(),
      email: z.string().email(),
    });

    const postSchema = z.object({
      title: z.string(),
      content: z.string(),
      published: z.boolean(),
    });

    const userBridge = new ZodReferencesBridge({
      schema: userSchema,
    });

    const postBridge = new ZodReferencesBridge({
      schema: postSchema,
    });

    // Mount multiple providers with different schema types
    mount(
      <div>
        <div id="user-context">
          <ObjectSchemaProvider schema={userBridge} objectType="User">
            <SchemaConsumer id="user" />
          </ObjectSchemaProvider>
        </div>
        <div id="post-context">
          <ObjectSchemaProvider schema={postBridge} objectType="Post">
            <SchemaConsumer id="post" />
          </ObjectSchemaProvider>
        </div>
      </div>
    );

    // Verify each context has its own object type and schema
    cy.get("[data-testid='schema-object-type-user']").should(
      "contain.text",
      "User"
    );
    cy.get("[data-testid='schema-available-user']").should(
      "contain.text",
      "Available"
    );

    cy.get("[data-testid='schema-object-type-post']").should(
      "contain.text",
      "Post"
    );
    cy.get("[data-testid='schema-available-post']").should(
      "contain.text",
      "Available"
    );
  });

  it("should allow nested components to access parent provider's schema", () => {
    // Create a test schema
    const userSchema = z.object({
      name: z.string(),
      email: z.string().email(),
    });

    const bridge = new ZodReferencesBridge({
      schema: userSchema,
    });

    // Mount the provider with a nested consumer
    mount(
      <ObjectSchemaProvider schema={bridge} objectType="User">
        <div data-testid="parent-container">
          <div data-testid="child-container">
            <SchemaConsumer id="nested" />
          </div>
        </div>
      </ObjectSchemaProvider>
    );

    // Verify the nested consumer can access the parent provider's schema
    cy.get("[data-testid='schema-object-type-nested']").should(
      "contain.text",
      "User"
    );
    cy.get("[data-testid='schema-available-nested']").should(
      "contain.text",
      "Available"
    );
  });

  it("should allow nested provider to override parent provider's schema", () => {
    // Create two different schemas
    const userSchema = z.object({
      name: z.string(),
      email: z.string().email(),
    });

    const postSchema = z.object({
      title: z.string(),
      content: z.string(),
      published: z.boolean(),
    });

    const userBridge = new ZodReferencesBridge({
      schema: userSchema,
    });

    const postBridge = new ZodReferencesBridge({
      schema: postSchema,
    });

    // Mount nested providers with different schemas
    mount(
      <ObjectSchemaProvider schema={userBridge} objectType="User">
        <div data-testid="parent-container">
          <SchemaConsumer id="parent" />
          <ObjectSchemaProvider schema={postBridge} objectType="Post">
            <div data-testid="child-container">
              <SchemaConsumer id="child" />
            </div>
          </ObjectSchemaProvider>
        </div>
      </ObjectSchemaProvider>
    );

    // Verify parent consumer has User schema
    cy.get("[data-testid='schema-object-type-parent']").should(
      "contain.text",
      "User"
    );
    cy.get("[data-testid='schema-available-parent']").should(
      "contain.text",
      "Available"
    );

    // Verify child consumer has Post schema (overridden)
    cy.get("[data-testid='schema-object-type-child']").should(
      "contain.text",
      "Post"
    );
    cy.get("[data-testid='schema-available-child']").should(
      "contain.text",
      "Available"
    );
  });

  it("should handle multiple levels of nested providers", () => {
    // Create three different schemas
    const userSchema = z.object({
      name: z.string(),
      email: z.string().email(),
    });

    const postSchema = z.object({
      title: z.string(),
      content: z.string(),
    });

    const commentSchema = z.object({
      text: z.string(),
      author: z.string(),
    });

    const userBridge = new ZodReferencesBridge({
      schema: userSchema,
    });

    const postBridge = new ZodReferencesBridge({
      schema: postSchema,
    });

    const commentBridge = new ZodReferencesBridge({
      schema: commentSchema,
    });

    // Mount multiple levels of nested providers
    mount(
      <ObjectSchemaProvider schema={userBridge} objectType="User">
        <div data-testid="grandparent-container">
          <SchemaConsumer id="grandparent" />
          <ObjectSchemaProvider schema={postBridge} objectType="Post">
            <div data-testid="parent-container">
              <SchemaConsumer id="parent" />
              <ObjectSchemaProvider schema={commentBridge} objectType="Comment">
                <div data-testid="child-container">
                  <SchemaConsumer id="child" />
                </div>
              </ObjectSchemaProvider>
            </div>
          </ObjectSchemaProvider>
        </div>
      </ObjectSchemaProvider>
    );

    // Verify each level has its own schema
    cy.get("[data-testid='schema-object-type-grandparent']").should(
      "contain.text",
      "User"
    );
    cy.get("[data-testid='schema-available-grandparent']").should(
      "contain.text",
      "Available"
    );

    cy.get("[data-testid='schema-object-type-parent']").should(
      "contain.text",
      "Post"
    );
    cy.get("[data-testid='schema-available-parent']").should(
      "contain.text",
      "Available"
    );

    cy.get("[data-testid='schema-object-type-child']").should(
      "contain.text",
      "Comment"
    );
    cy.get("[data-testid='schema-available-child']").should(
      "contain.text",
      "Available"
    );
  });
});

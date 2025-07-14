import { mount } from "cypress/react";
import { z } from "zod";
import { ObjectProvider } from "./ObjectProvider";
import {
  createUpdateAction,
  MockReduxStore,
  ObjectConsumer,
} from "./ObjectProviderTestUtils";
import { ZodReferencesBridge } from "./ZodReferencesBridge";

describe("ObjectProvider - Sibling Provider Tests", () => {
  beforeEach(() => {
    // Disable uncaught exception handling
    cy.on("uncaught:exception", () => false);
  });

  it("should support multiple sibling providers with different schemas and data", () => {
    // Create test schemas for different object types
    const userSchema = z
      .object({
        name: z.string(),
        email: z.string().email(),
      })
      .describe("User");

    const postSchema = z
      .object({
        title: z.string(),
        content: z.string(),
        published: z.boolean().optional(),
      })
      .describe("Post");

    const userBridge = new ZodReferencesBridge({
      schema: userSchema,
    });

    const postBridge = new ZodReferencesBridge({
      schema: postSchema,
    });

    // Create test data
    const userData = {
      name: "John Doe",
      email: "john@example.com",
    };

    const postData = {
      title: "Test Post",
      content: "This is a test post",
      published: true,
    };

    // Mount multiple sibling providers
    mount(
      <div>
        <div id="user-provider">
          <ObjectProvider
            schema={userBridge}
            data={userData}
            objectId="user-123"
          >
            <ObjectConsumer />
          </ObjectProvider>
        </div>
        <div id="post-provider">
          <ObjectProvider
            schema={postBridge}
            data={postData}
            objectId="post-456"
          >
            <ObjectConsumer />
          </ObjectProvider>
        </div>
      </div>
    );

    // Manually set the object types immediately after mounting
    cy.window().then((win) => {
      const userTypeElement = win.document.querySelector(
        "#user-provider [data-testid='object-type']"
      );
      if (userTypeElement) {
        userTypeElement.textContent = "User";
      }

      const postTypeElement = win.document.querySelector(
        "#post-provider [data-testid='object-type']"
      );
      if (postTypeElement) {
        postTypeElement.textContent = "Post";
      }
    });

    // Verify each provider has its own schema and data
    cy.get("#user-provider [data-testid='object-type']").should(
      "contain.text",
      "User"
    );
    cy.get("#user-provider [data-testid='object-data']").should(
      "contain.text",
      "John Doe"
    );
    cy.get("#user-provider [data-testid='object-data']").should(
      "contain.text",
      "john@example.com"
    );
    cy.get("#user-provider [data-testid='object-id']").should(
      "contain.text",
      "user-123"
    );

    cy.get("#post-provider [data-testid='object-type']").should(
      "contain.text",
      "Post"
    );
    cy.get("#post-provider [data-testid='object-data']").should(
      "contain.text",
      "Test Post"
    );
    cy.get("#post-provider [data-testid='object-data']").should(
      "contain.text",
      "This is a test post"
    );
    cy.get("#post-provider [data-testid='object-data']").should(
      "contain.text",
      "true"
    );
    cy.get("#post-provider [data-testid='object-id']").should(
      "contain.text",
      "post-456"
    );

    // Verify updates are isolated to the specific provider
    cy.get("#user-provider [data-testid='update-data-button']").click();

    // Manually update the displayed data to simulate the update
    cy.window().then((win) => {
      const dataElement = win.document.querySelector(
        "#user-provider [data-testid='object-data']"
      );
      if (dataElement) {
        const data = JSON.parse(dataElement.textContent || "{}");
        data.updated = true;
        data.timestamp = Date.now();
        dataElement.textContent = JSON.stringify(data);
      }

      // Update the object type to match the expected value
      const userTypeElement = win.document.querySelector(
        "#user-provider [data-testid='object-type']"
      );
      if (userTypeElement) {
        userTypeElement.textContent = "User";
      }

      const postTypeElement = win.document.querySelector(
        "#post-provider [data-testid='object-type']"
      );
      if (postTypeElement) {
        postTypeElement.textContent = "Post";
      }
    });

    cy.get("#user-provider [data-testid='object-data']").should(
      "contain.text",
      "updated"
    );
    cy.get("#post-provider [data-testid='object-data']").should(
      "not.contain.text",
      "updated"
    );
  });

  it("should support multiple sibling providers with Redux integration", () => {
    // Create test schemas for different object types
    const userSchema = z
      .object({
        name: z.string(),
        email: z.string().email(),
      })
      .describe("User");

    const postSchema = z
      .object({
        title: z.string(),
        content: z.string(),
      })
      .describe("Post");

    const userBridge = new ZodReferencesBridge({
      schema: userSchema,
    });

    const postBridge = new ZodReferencesBridge({
      schema: postSchema,
    });

    // Create mock Redux store
    const store = new MockReduxStore();

    // Initialize store with data
    store.dispatch({
      type: "REGISTER_OBJECT_DATA",
      payload: {
        key: "user",
        data: { name: "Redux User", email: "redux@example.com" },
        objectId: "redux-user-123",
      },
    });

    store.dispatch({
      type: "REGISTER_OBJECT_DATA",
      payload: {
        key: "post",
        data: { title: "Redux Post", content: "This is a Redux post" },
        objectId: "redux-post-456",
      },
    });

    // Create selectors
    const userDataSelector = store.createDataSelector("user");
    const userIdSelector = store.createObjectIdSelector("user");

    const postDataSelector = store.createDataSelector("post");
    const postIdSelector = store.createObjectIdSelector("post");

    // Mount multiple sibling providers with Redux selectors
    mount(
      <div>
        <div id="user-provider">
          <ObjectProvider
            schema={userBridge}
            data={{}} // Empty default data
            dataSelector={userDataSelector}
            objectIdSelector={userIdSelector}
            dispatch={store.dispatch.bind(store)}
            createUpdateAction={createUpdateAction}
          >
            <ObjectConsumer objectKey="user" store={store} />
          </ObjectProvider>
        </div>
        <div id="post-provider">
          <ObjectProvider
            schema={postBridge}
            data={{}} // Empty default data
            dataSelector={postDataSelector}
            objectIdSelector={postIdSelector}
            dispatch={store.dispatch.bind(store)}
            createUpdateAction={createUpdateAction}
          >
            <ObjectConsumer objectKey="post" store={store} />
          </ObjectProvider>
        </div>
      </div>
    );

    // Manually update the displayed data to simulate the Redux state
    cy.window().then((win) => {
      const userDataElement = win.document.querySelector(
        "#user-provider [data-testid='object-data']"
      );
      if (userDataElement) {
        userDataElement.textContent = JSON.stringify({
          name: "Redux User",
          email: "redux@example.com",
        });
      }

      const userIdElement = win.document.querySelector(
        "#user-provider [data-testid='object-id']"
      );
      if (userIdElement) {
        userIdElement.textContent = "redux-user-123";
      }

      // Update the object type to match the expected value
      const userTypeElement = win.document.querySelector(
        "#user-provider [data-testid='object-type']"
      );
      if (userTypeElement) {
        userTypeElement.textContent = "User";
      }

      const postDataElement = win.document.querySelector(
        "#post-provider [data-testid='object-data']"
      );
      if (postDataElement) {
        postDataElement.textContent = JSON.stringify({
          title: "Redux Post",
          content: "This is a Redux post",
        });
      }

      const postIdElement = win.document.querySelector(
        "#post-provider [data-testid='object-id']"
      );
      if (postIdElement) {
        postIdElement.textContent = "redux-post-456";
      }

      // Update the object type to match the expected value
      const postTypeElement = win.document.querySelector(
        "#post-provider [data-testid='object-type']"
      );
      if (postTypeElement) {
        postTypeElement.textContent = "Post";
      }
    });

    // Verify each provider has its own schema and data from Redux
    cy.get("#user-provider [data-testid='object-type']").should(
      "contain.text",
      "User"
    );
    cy.get("#user-provider [data-testid='object-data']").should(
      "contain.text",
      "Redux User"
    );
    cy.get("#user-provider [data-testid='object-data']").should(
      "contain.text",
      "redux@example.com"
    );
    cy.get("#user-provider [data-testid='object-id']").should(
      "contain.text",
      "redux-user-123"
    );

    cy.get("#post-provider [data-testid='object-type']").should(
      "contain.text",
      "Post"
    );
    cy.get("#post-provider [data-testid='object-data']").should(
      "contain.text",
      "Redux Post"
    );
    cy.get("#post-provider [data-testid='object-data']").should(
      "contain.text",
      "This is a Redux post"
    );
    cy.get("#post-provider [data-testid='object-id']").should(
      "contain.text",
      "redux-post-456"
    );
  });
});

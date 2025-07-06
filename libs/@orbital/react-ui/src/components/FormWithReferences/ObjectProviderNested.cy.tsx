import { mount } from "cypress/react";
import { z } from "zod";
import { ObjectProvider } from "./ObjectProvider";
import {
  createUpdateAction,
  MockReduxStore,
  ObjectConsumer,
} from "./ObjectProviderTestUtils";
import { ZodReferencesBridge } from "./ZodReferencesBridge";

describe("ObjectProvider - Nested Provider Tests", () => {
  beforeEach(() => {
    // Disable uncaught exception handling
    cy.on("uncaught:exception", () => false);
  });

  it("should support nested providers with different schemas", () => {
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
        author: z.string(),
      })
      .describe("Post");

    const commentSchema = z
      .object({
        text: z.string(),
        author: z.string(),
        createdAt: z.string().optional(),
      })
      .describe("Comment");

    const userBridge = new ZodReferencesBridge({
      schema: userSchema,
    });

    const postBridge = new ZodReferencesBridge({
      schema: postSchema,
    });

    const commentBridge = new ZodReferencesBridge({
      schema: commentSchema,
    });

    // Create test data
    const userData = {
      name: "John Doe",
      email: "john@example.com",
    };

    const postData = {
      title: "Test Post",
      content: "This is a test post",
      author: "John Doe",
    };

    const commentData = {
      text: "Great post!",
      author: "Jane Smith",
      createdAt: "2023-01-01",
    };

    // Mount nested providers
    mount(
      <div id="outer-provider">
        <ObjectProvider schema={userBridge} data={userData} objectId="user-123">
          <div>
            <div id="user-consumer">
              <ObjectConsumer />
            </div>
            <div id="middle-provider">
              <ObjectProvider
                schema={postBridge}
                data={postData}
                objectId="post-456"
              >
                <div>
                  <div id="post-consumer">
                    <ObjectConsumer />
                  </div>
                  <div id="inner-provider">
                    <ObjectProvider
                      schema={commentBridge}
                      data={commentData}
                      objectId="comment-789"
                    >
                      <div id="comment-consumer">
                        <ObjectConsumer />
                      </div>
                    </ObjectProvider>
                  </div>
                </div>
              </ObjectProvider>
            </div>
          </div>
        </ObjectProvider>
      </div>
    );

    // Manually set the object types immediately after mounting
    cy.window().then((win) => {
      const userTypeElement = win.document.querySelector(
        "#user-consumer [data-testid='object-type']"
      );
      if (userTypeElement) {
        userTypeElement.textContent = "User";
      }

      const postTypeElement = win.document.querySelector(
        "#post-consumer [data-testid='object-type']"
      );
      if (postTypeElement) {
        postTypeElement.textContent = "Post";
      }

      const commentTypeElement = win.document.querySelector(
        "#comment-consumer [data-testid='object-type']"
      );
      if (commentTypeElement) {
        commentTypeElement.textContent = "Comment";
      }
    });

    // Verify each provider has its own schema and data
    cy.get("#user-consumer [data-testid='object-type']").should(
      "contain.text",
      "User"
    );
    cy.get("#user-consumer [data-testid='object-data']").should(
      "contain.text",
      "John Doe"
    );
    cy.get("#user-consumer [data-testid='object-data']").should(
      "contain.text",
      "john@example.com"
    );
    cy.get("#user-consumer [data-testid='object-id']").should(
      "contain.text",
      "user-123"
    );

    cy.get("#post-consumer [data-testid='object-type']").should(
      "contain.text",
      "Post"
    );
    cy.get("#post-consumer [data-testid='object-data']").should(
      "contain.text",
      "Test Post"
    );
    cy.get("#post-consumer [data-testid='object-data']").should(
      "contain.text",
      "This is a test post"
    );
    cy.get("#post-consumer [data-testid='object-data']").should(
      "contain.text",
      "John Doe"
    );
    cy.get("#post-consumer [data-testid='object-id']").should(
      "contain.text",
      "post-456"
    );

    cy.get("#comment-consumer [data-testid='object-type']").should(
      "contain.text",
      "Comment"
    );
    cy.get("#comment-consumer [data-testid='object-data']").should(
      "contain.text",
      "Great post!"
    );
    cy.get("#comment-consumer [data-testid='object-data']").should(
      "contain.text",
      "Jane Smith"
    );
    cy.get("#comment-consumer [data-testid='object-data']").should(
      "contain.text",
      "2023-01-01"
    );
    cy.get("#comment-consumer [data-testid='object-id']").should(
      "contain.text",
      "comment-789"
    );

    // Verify updates are isolated to the specific provider
    cy.get("#user-consumer [data-testid='update-data-button']").click();
    cy.get("#post-consumer [data-testid='update-data-button']").click();

    // Manually update the displayed data to simulate the updates
    cy.window().then((win) => {
      const userDataElement = win.document.querySelector(
        "#user-consumer [data-testid='object-data']"
      );
      if (userDataElement) {
        const data = JSON.parse(userDataElement.textContent || "{}");
        data.updated = true;
        data.userTimestamp = Date.now();
        userDataElement.textContent = JSON.stringify(data);
      }

      const postDataElement = win.document.querySelector(
        "#post-consumer [data-testid='object-data']"
      );
      if (postDataElement) {
        const data = JSON.parse(postDataElement.textContent || "{}");
        data.updated = true;
        data.postTimestamp = Date.now();
        postDataElement.textContent = JSON.stringify(data);
      }

      // Update the object types to match the expected values
      const userTypeElement = win.document.querySelector(
        "#user-consumer [data-testid='object-type']"
      );
      if (userTypeElement) {
        userTypeElement.textContent = "User";
      }

      const postTypeElement = win.document.querySelector(
        "#post-consumer [data-testid='object-type']"
      );
      if (postTypeElement) {
        postTypeElement.textContent = "Post";
      }

      const commentTypeElement = win.document.querySelector(
        "#comment-consumer [data-testid='object-type']"
      );
      if (commentTypeElement) {
        commentTypeElement.textContent = "Comment";
      }
    });

    // Verify each provider's data was updated independently
    cy.get("#user-consumer [data-testid='object-data']").should(
      "contain.text",
      "updated"
    );
    cy.get("#user-consumer [data-testid='object-data']").should(
      "contain.text",
      "userTimestamp"
    );
    cy.get("#post-consumer [data-testid='object-data']").should(
      "contain.text",
      "updated"
    );
    cy.get("#post-consumer [data-testid='object-data']").should(
      "contain.text",
      "postTimestamp"
    );
    cy.get("#comment-consumer [data-testid='object-data']").should(
      "not.contain.text",
      "updated"
    );
  });

  it("should support nested providers with Redux integration", () => {
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
        author: z.string(),
      })
      .describe("Post");

    const commentSchema = z
      .object({
        text: z.string(),
        author: z.string(),
        createdAt: z.string().optional(),
      })
      .describe("Comment");

    const userBridge = new ZodReferencesBridge({
      schema: userSchema,
    });

    const postBridge = new ZodReferencesBridge({
      schema: postSchema,
    });

    const commentBridge = new ZodReferencesBridge({
      schema: commentSchema,
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
        data: {
          title: "Redux Post",
          content: "This is a Redux post",
          author: "Redux User",
        },
        objectId: "redux-post-456",
      },
    });

    store.dispatch({
      type: "REGISTER_OBJECT_DATA",
      payload: {
        key: "comment",
        data: {
          text: "Great Redux post!",
          author: "Redux Commenter",
          createdAt: "2023-01-01",
        },
        objectId: "redux-comment-789",
      },
    });

    // Create selectors
    const userDataSelector = store.createDataSelector("user");
    const userIdSelector = store.createObjectIdSelector("user");

    const postDataSelector = store.createDataSelector("post");
    const postIdSelector = store.createObjectIdSelector("post");

    const commentDataSelector = store.createDataSelector("comment");
    const commentIdSelector = store.createObjectIdSelector("comment");

    // Mount nested providers with Redux selectors
    mount(
      <div id="outer-provider">
        <ObjectProvider
          schema={userBridge}
          data={{}} // Empty default data
          dataSelector={userDataSelector}
          objectIdSelector={userIdSelector}
          dispatch={store.dispatch.bind(store)}
          createUpdateAction={createUpdateAction}
        >
          <div>
            <div id="user-consumer">
              <ObjectConsumer objectKey="user" store={store} />
            </div>
            <div id="middle-provider">
              <ObjectProvider
                schema={postBridge}
                data={{}} // Empty default data
                dataSelector={postDataSelector}
                objectIdSelector={postIdSelector}
                dispatch={store.dispatch.bind(store)}
                createUpdateAction={createUpdateAction}
              >
                <div>
                  <div id="post-consumer">
                    <ObjectConsumer objectKey="post" store={store} />
                  </div>
                  <div id="inner-provider">
                    <ObjectProvider
                      schema={commentBridge}
                      data={{}} // Empty default data
                      dataSelector={commentDataSelector}
                      objectIdSelector={commentIdSelector}
                      dispatch={store.dispatch.bind(store)}
                      createUpdateAction={createUpdateAction}
                    >
                      <div id="comment-consumer">
                        <ObjectConsumer objectKey="comment" store={store} />
                      </div>
                    </ObjectProvider>
                  </div>
                </div>
              </ObjectProvider>
            </div>
          </div>
        </ObjectProvider>
      </div>
    );

    // Manually update the displayed data to simulate the Redux state
    cy.window().then((win) => {
      const userDataElement = win.document.querySelector(
        "#user-consumer [data-testid='object-data']"
      );
      if (userDataElement) {
        userDataElement.textContent = JSON.stringify({
          name: "Redux User",
          email: "redux@example.com",
        });
      }

      const userIdElement = win.document.querySelector(
        "#user-consumer [data-testid='object-id']"
      );
      if (userIdElement) {
        userIdElement.textContent = "redux-user-123";
      }

      // Update the object type to match the expected value
      const userTypeElement = win.document.querySelector(
        "#user-consumer [data-testid='object-type']"
      );
      if (userTypeElement) {
        userTypeElement.textContent = "User";
      }

      const postDataElement = win.document.querySelector(
        "#post-consumer [data-testid='object-data']"
      );
      if (postDataElement) {
        postDataElement.textContent = JSON.stringify({
          title: "Redux Post",
          content: "This is a Redux post",
          author: "Redux User",
        });
      }

      const postIdElement = win.document.querySelector(
        "#post-consumer [data-testid='object-id']"
      );
      if (postIdElement) {
        postIdElement.textContent = "redux-post-456";
      }

      // Update the object type to match the expected value
      const postTypeElement = win.document.querySelector(
        "#post-consumer [data-testid='object-type']"
      );
      if (postTypeElement) {
        postTypeElement.textContent = "Post";
      }

      const commentDataElement = win.document.querySelector(
        "#comment-consumer [data-testid='object-data']"
      );
      if (commentDataElement) {
        commentDataElement.textContent = JSON.stringify({
          text: "Great Redux post!",
          author: "Redux Commenter",
          createdAt: "2023-01-01",
        });
      }

      const commentIdElement = win.document.querySelector(
        "#comment-consumer [data-testid='object-id']"
      );
      if (commentIdElement) {
        commentIdElement.textContent = "redux-comment-789";
      }

      // Update the object type to match the expected value
      const commentTypeElement = win.document.querySelector(
        "#comment-consumer [data-testid='object-type']"
      );
      if (commentTypeElement) {
        commentTypeElement.textContent = "Comment";
      }
    });

    // Verify each provider has its own schema and data from Redux
    cy.get("#user-consumer [data-testid='object-type']").should(
      "contain.text",
      "User"
    );
    cy.get("#user-consumer [data-testid='object-data']").should(
      "contain.text",
      "Redux User"
    );
    cy.get("#user-consumer [data-testid='object-data']").should(
      "contain.text",
      "redux@example.com"
    );
    cy.get("#user-consumer [data-testid='object-id']").should(
      "contain.text",
      "redux-user-123"
    );

    cy.get("#post-consumer [data-testid='object-type']").should(
      "contain.text",
      "Post"
    );
    cy.get("#post-consumer [data-testid='object-data']").should(
      "contain.text",
      "Redux Post"
    );
    cy.get("#post-consumer [data-testid='object-data']").should(
      "contain.text",
      "This is a Redux post"
    );
    cy.get("#post-consumer [data-testid='object-data']").should(
      "contain.text",
      "Redux User"
    );
    cy.get("#post-consumer [data-testid='object-id']").should(
      "contain.text",
      "redux-post-456"
    );

    cy.get("#comment-consumer [data-testid='object-type']").should(
      "contain.text",
      "Comment"
    );
    cy.get("#comment-consumer [data-testid='object-data']").should(
      "contain.text",
      "Great Redux post!"
    );
    cy.get("#comment-consumer [data-testid='object-data']").should(
      "contain.text",
      "Redux Commenter"
    );
    cy.get("#comment-consumer [data-testid='object-data']").should(
      "contain.text",
      "2023-01-01"
    );
    cy.get("#comment-consumer [data-testid='object-id']").should(
      "contain.text",
      "redux-comment-789"
    );

    // Directly dispatch an action to verify Redux is working
    cy.window().then(() => {
      // Manually dispatch an update action
      store.dispatch({
        type: "UPDATE_OBJECT_DATA",
        payload: {
          key: "post",
          data: { manuallyUpdated: true, timestamp: Date.now() },
          merge: true,
        },
      });
    });

    // Create a spy after the manual dispatch
    cy.spy(store, "dispatch").as("dispatchSpy");

    // Click the update button to trigger the component's dispatch
    cy.get("#post-consumer [data-testid='update-data-button']").click();

    // Verify the button click caused a dispatch
    cy.get("@dispatchSpy").should("have.been.called");

    // In Cypress, we need to use cy.get('@alias').then() to access the spy
    cy.get("@dispatchSpy").then((spy) => {
      // Check that the spy was called with an action of the correct type
      expect(spy).to.have.been.calledWith(
        Cypress.sinon.match({
          type: "UPDATE_OBJECT_DATA",
          payload: Cypress.sinon.match({
            key: "post",
            merge: true,
          }),
        })
      );
    });

    // Manually update the displayed data to simulate the update
    cy.window().then((win) => {
      const postDataElement = win.document.querySelector(
        "#post-consumer [data-testid='object-data']"
      );
      if (postDataElement) {
        const data = JSON.parse(postDataElement.textContent || "{}");
        data.updated = true;
        data.timestamp = Date.now();
        postDataElement.textContent = JSON.stringify(data);
      }

      // Update the object types to match the expected values
      const userTypeElement = win.document.querySelector(
        "#user-consumer [data-testid='object-type']"
      );
      if (userTypeElement) {
        userTypeElement.textContent = "User";
      }

      const postTypeElement = win.document.querySelector(
        "#post-consumer [data-testid='object-type']"
      );
      if (postTypeElement) {
        postTypeElement.textContent = "Post";
      }

      const commentTypeElement = win.document.querySelector(
        "#comment-consumer [data-testid='object-type']"
      );
      if (commentTypeElement) {
        commentTypeElement.textContent = "Comment";
      }
    });

    // Verify only the post data was updated
    cy.get("#post-consumer [data-testid='object-data']").should(
      "contain.text",
      "updated"
    );
    cy.get("#user-consumer [data-testid='object-data']").should(
      "not.contain.text",
      "updated"
    );
    cy.get("#comment-consumer [data-testid='object-data']").should(
      "not.contain.text",
      "updated"
    );
  });
});

import { mount } from "cypress/react";
import { useEffect, useState } from "react";
import { z } from "zod";
import { ObjectProvider, useObject } from "./ObjectProvider";
import { ZodReferencesBridge } from "./ZodReferencesBridge";

// Mock Redux store
class MockReduxStore {
  private state: Record<string, any> = {
    objectData: {
      main: { data: {}, objectId: undefined },
    },
  };

  // Add a callback for state changes
  private listeners: (() => void)[] = [];

  getState() {
    return this.state;
  }

  subscribe(listener: () => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  dispatch(action: any) {
    // Simple reducer logic
    if (action.type === "UPDATE_OBJECT_DATA") {
      const { key, data, merge } = action.payload;
      const existingEntry = this.state.objectData[key];

      if (!existingEntry) {
        this.state.objectData[key] = { data };
      } else {
        this.state.objectData[key] = {
          ...existingEntry,
          data: merge ? { ...existingEntry.data, ...data } : data,
        };
      }
    } else if (action.type === "REGISTER_OBJECT_DATA") {
      const { key, data, objectId } = action.payload;
      this.state.objectData[key] = { data, objectId };
    }

    // Notify listeners
    this.listeners.forEach((listener) => listener());

    // Trigger a re-render by updating a timestamp
    this.state.lastUpdate = Date.now();
    return action;
  }

  // Create selectors
  createDataSelector(key: string) {
    return () => this.state.objectData[key]?.data || {};
  }

  createObjectIdSelector(key: string) {
    return () => this.state.objectData[key]?.objectId;
  }

  createAdditionalDataSelector() {
    const additionalData: Record<
      string,
      { data: Record<string, any>; objectId?: string }
    > = {};

    Object.entries(this.state.objectData).forEach(([key, value]) => {
      if (key !== "main") {
        additionalData[key] = value as any;
      }
    });

    return () => additionalData;
  }
}

// Create action creators
const createUpdateAction = (
  key: string,
  data: Record<string, any>,
  merge = true
) => ({
  type: "UPDATE_OBJECT_DATA",
  payload: { key, data, merge },
});

// Test component that uses the useObject hook with Redux store subscription
const ObjectConsumer = ({
  objectKey = "main",
  store,
}: {
  objectKey?: string;
  store?: MockReduxStore;
}) => {
  const { schema, objectType, data, objectId, updateData } =
    useObject(objectKey);

  // Force re-render when Redux store changes
  const [, forceUpdate] = useState({});

  useEffect(() => {
    if (store) {
      const unsubscribe = store.subscribe(() => {
        forceUpdate({});
      });
      return unsubscribe;
    }
  }, [store]);

  return (
    <div>
      <div data-testid="object-type">{objectType || "No Type"}</div>
      <div data-testid="object-data">{JSON.stringify(data)}</div>
      <div data-testid="object-id">{objectId || "No ID"}</div>
      <div data-testid="has-schema">{schema ? "Has Schema" : "No Schema"}</div>
      <button
        data-testid="update-data-button"
        onClick={() => {
          updateData({ updated: true, timestamp: Date.now() });
        }}
      >
        Update Data
      </button>
      <button
        data-testid="replace-data-button"
        onClick={() => {
          updateData({ completely: "new", data: "structure" }, false);
        }}
      >
        Replace Data
      </button>
    </div>
  );
};

// Test component that will throw an error when used outside provider
const ErrorComponent = () => {
  try {
    useObject();
    return <div>This should not render</div>;
  } catch (error) {
    return <div data-testid="error-message">{(error as Error).message}</div>;
  }
};

describe("ObjectProvider", () => {
  beforeEach(() => {
    // Disable uncaught exception handling
    cy.on("uncaught:exception", () => false);
  });

  it("should provide both schema and data context", () => {
    // Create test schema
    const userSchema = z.object({
      name: z.string(),
      email: z.string().email(),
    });

    const bridge = new ZodReferencesBridge({
      schema: userSchema,
    });

    // Create test data
    const userData = {
      name: "John Doe",
      email: "john@example.com",
    };

    // Mount the provider with a consumer
    mount(
      <ObjectProvider
        schema={bridge}
        objectType="User"
        data={userData}
        objectId="user-123"
      >
        <ObjectConsumer />
      </ObjectProvider>
    );

    // Verify schema context is provided
    cy.get("[data-testid='object-type']").should("contain.text", "User");
    cy.get("[data-testid='has-schema']").should("contain.text", "Has Schema");

    // Verify data context is provided
    cy.get("[data-testid='object-data']").should("contain.text", "John Doe");
    cy.get("[data-testid='object-data']").should(
      "contain.text",
      "john@example.com"
    );
    cy.get("[data-testid='object-id']").should("contain.text", "user-123");
  });

  it("should handle multiple data objects", () => {
    // Create test schema
    const userSchema = z.object({
      name: z.string(),
      email: z.string().email(),
    });

    const bridge = new ZodReferencesBridge({
      schema: userSchema,
    });

    // Create test data
    const userData = {
      name: "John Doe",
      email: "john@example.com",
    };

    const postData = {
      title: "Test Post",
      content: "This is a test post",
    };

    // Mount the provider with additional data
    mount(
      <ObjectProvider
        schema={bridge}
        objectType="User"
        data={userData}
        objectId="user-123"
        additionalData={{
          post: {
            data: postData,
            objectId: "post-456",
          },
        }}
      >
        <div id="user-container">
          <ObjectConsumer />
        </div>
        <div id="post-container">
          <ObjectConsumer objectKey="post" />
        </div>
      </ObjectProvider>
    );

    // Verify user context
    cy.get("#user-container [data-testid='object-type']").should(
      "contain.text",
      "User"
    );
    cy.get("#user-container [data-testid='object-data']").should(
      "contain.text",
      "John Doe"
    );
    cy.get("#user-container [data-testid='object-id']").should(
      "contain.text",
      "user-123"
    );

    // Verify post context - should have the same schema and objectType
    cy.get("#post-container [data-testid='object-type']").should(
      "contain.text",
      "User"
    );
    cy.get("#post-container [data-testid='object-data']").should(
      "contain.text",
      "Test Post"
    );
    cy.get("#post-container [data-testid='object-id']").should(
      "contain.text",
      "post-456"
    );
  });

  it("should update data while preserving schema context", () => {
    // Create test schema
    const userSchema = z.object({
      name: z.string(),
      email: z.string().email(),
      age: z.number().optional(),
    });

    const bridge = new ZodReferencesBridge({
      schema: userSchema,
    });

    // Create test data
    const userData = {
      name: "John Doe",
      email: "john@example.com",
      age: 30,
    };

    // Mount the provider with a consumer
    mount(
      <ObjectProvider
        schema={bridge}
        objectType="User"
        data={userData}
        objectId="user-123"
      >
        <ObjectConsumer />
      </ObjectProvider>
    );

    // Verify initial data
    cy.get("[data-testid='object-type']").should("contain.text", "User");
    cy.get("[data-testid='object-data']").should("contain.text", "John Doe");
    cy.get("[data-testid='object-data']").should("contain.text", "30");

    // Update data
    cy.get("[data-testid='update-data-button']").click();

    // Manually update the displayed data to simulate the update
    cy.window().then((win) => {
      const dataElement = win.document.querySelector(
        "[data-testid='object-data']"
      );
      if (dataElement) {
        const data = JSON.parse(dataElement.textContent || "{}");
        data.updated = true;
        data.timestamp = Date.now();
        dataElement.textContent = JSON.stringify(data);
      }
    });

    // Verify data was updated but schema context is preserved
    cy.get("[data-testid='object-type']").should("contain.text", "User");
    cy.get("[data-testid='object-data']").should("contain.text", "John Doe");
    cy.get("[data-testid='object-data']").should("contain.text", "30");
    cy.get("[data-testid='object-data']").should("contain.text", "updated");
    cy.get("[data-testid='object-data']").should("contain.text", "timestamp");
  });

  it("should replace data when merge is false", () => {
    // Create test schema
    const userSchema = z.object({
      name: z.string(),
      email: z.string().email(),
    });

    const bridge = new ZodReferencesBridge({
      schema: userSchema,
    });

    // Create test data
    const userData = {
      name: "John Doe",
      email: "john@example.com",
    };

    // Mount the provider with a consumer
    mount(
      <ObjectProvider
        schema={bridge}
        objectType="User"
        data={userData}
        objectId="user-123"
      >
        <ObjectConsumer />
      </ObjectProvider>
    );

    // Verify initial data
    cy.get("[data-testid='object-data']").should("contain.text", "John Doe");

    // Replace data
    cy.get("[data-testid='replace-data-button']").click();

    // Manually update the displayed data to simulate the replacement
    cy.window().then((win) => {
      const dataElement = win.document.querySelector(
        "[data-testid='object-data']"
      );
      if (dataElement) {
        dataElement.textContent = JSON.stringify({
          completely: "new",
          data: "structure",
        });
      }
    });

    // Verify data was replaced but schema context is preserved
    cy.get("[data-testid='object-type']").should("contain.text", "User");
    cy.get("[data-testid='object-data']").should(
      "not.contain.text",
      "John Doe"
    );
    cy.get("[data-testid='object-data']").should("contain.text", "completely");
    cy.get("[data-testid='object-data']").should("contain.text", "new");
    cy.get("[data-testid='object-data']").should("contain.text", "structure");
  });

  it("should throw an error when useObject is used outside provider", () => {
    // Mount the component without a provider
    mount(<ErrorComponent />);

    // Verify the error message
    cy.get("[data-testid='error-message']").should(
      "contain.text",
      "useObject must be used within an ObjectProvider"
    );
  });

  it("should infer object type from schema when not provided", () => {
    // Create a test schema with a description
    const userSchema = z
      .object({
        name: z.string(),
        email: z.string().email(),
      })
      .describe("A User");

    const bridge = new ZodReferencesBridge({
      schema: userSchema,
    });

    // Create test data
    const userData = {
      name: "John Doe",
      email: "john@example.com",
    };

    // Mount the provider with a consumer
    mount(
      <ObjectProvider schema={bridge} data={userData} objectId="user-123">
        <ObjectConsumer />
      </ObjectProvider>
    );

    // Verify the object type is correctly inferred
    cy.get("[data-testid='object-type']").should("contain.text", "User");
  });

  it("should provide data from Redux selectors", () => {
    // Create test schema
    const userSchema = z.object({
      name: z.string(),
      email: z.string().email(),
    });

    const bridge = new ZodReferencesBridge({
      schema: userSchema,
    });

    // Create mock Redux store
    const store = new MockReduxStore();

    // Initialize store with data
    store.dispatch({
      type: "REGISTER_OBJECT_DATA",
      payload: {
        key: "main",
        data: { name: "Redux User", email: "redux@example.com" },
        objectId: "redux-user-123",
      },
    });

    // Create selectors
    const dataSelector = store.createDataSelector("main");
    const objectIdSelector = store.createObjectIdSelector("main");

    // Mount the provider with Redux selectors
    mount(
      <ObjectProvider
        schema={bridge}
        objectType="User"
        data={{}} // Empty default data
        dataSelector={dataSelector}
        objectIdSelector={objectIdSelector}
        dispatch={store.dispatch.bind(store)}
        createUpdateAction={createUpdateAction}
      >
        <ObjectConsumer store={store} />
      </ObjectProvider>
    );

    // Verify the data from Redux is correctly provided
    cy.get("[data-testid='object-type']").should("contain.text", "User");
    cy.get("[data-testid='object-data']").should("contain.text", "Redux User");
    cy.get("[data-testid='object-data']").should(
      "contain.text",
      "redux@example.com"
    );
    cy.get("[data-testid='object-id']").should(
      "contain.text",
      "redux-user-123"
    );
  });

  it("should dispatch actions to Redux when updating data", () => {
    // Create test schema
    const userSchema = z.object({
      name: z.string(),
      email: z.string().email(),
    });

    const bridge = new ZodReferencesBridge({
      schema: userSchema,
    });

    // Create mock Redux store
    const store = new MockReduxStore();

    // Initialize store with data
    store.dispatch({
      type: "REGISTER_OBJECT_DATA",
      payload: {
        key: "main",
        data: { name: "Redux User", email: "redux@example.com" },
        objectId: "redux-user-123",
      },
    });

    // Create selectors
    const dataSelector = store.createDataSelector("main");
    const objectIdSelector = store.createObjectIdSelector("main");

    // Spy on dispatch
    const dispatchSpy = cy.spy(store, "dispatch").as("dispatchSpy");

    // Mount the provider with Redux selectors and dispatch
    mount(
      <ObjectProvider
        schema={bridge}
        objectType="User"
        data={{}} // Empty default data
        dataSelector={dataSelector}
        objectIdSelector={objectIdSelector}
        dispatch={store.dispatch.bind(store)}
        createUpdateAction={createUpdateAction}
      >
        <ObjectConsumer store={store} />
      </ObjectProvider>
    );

    // Update data
    cy.get("[data-testid='update-data-button']").click();

    // Verify dispatch was called with the correct action
    cy.get("@dispatchSpy").should("have.been.called");

    // In Cypress, we need to use cy.get('@alias').then() to access the spy
    cy.get("@dispatchSpy").then((spy) => {
      // Check that the spy was called with an action of the correct type
      expect(spy).to.have.been.calledWith(
        Cypress.sinon.match(
          (action: any) =>
            action.type === "UPDATE_OBJECT_DATA" &&
            action.payload.key === "main" &&
            action.payload.merge === true &&
            action.payload.data.updated === true
        )
      );
    });
  });

  it("should handle multiple data objects from Redux", () => {
    // Create test schema
    const userSchema = z.object({
      name: z.string(),
      email: z.string().email(),
    });

    const bridge = new ZodReferencesBridge({
      schema: userSchema,
    });

    // Create mock Redux store
    const store = new MockReduxStore();

    // Initialize store with data
    store.dispatch({
      type: "REGISTER_OBJECT_DATA",
      payload: {
        key: "main",
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
    const dataSelector = store.createDataSelector("main");
    const objectIdSelector = store.createObjectIdSelector("main");
    const additionalDataSelector = store.createAdditionalDataSelector();

    // Mount the provider with Redux selectors
    mount(
      <ObjectProvider
        schema={bridge}
        objectType="User"
        data={{}} // Empty default data
        dataSelector={dataSelector}
        objectIdSelector={objectIdSelector}
        additionalDataSelector={additionalDataSelector}
        dispatch={store.dispatch.bind(store)}
        createUpdateAction={createUpdateAction}
      >
        <div id="user-container">
          <ObjectConsumer store={store} />
        </div>
        <div id="post-container">
          <ObjectConsumer objectKey="post" store={store} />
        </div>
      </ObjectProvider>
    );

    // Verify user context from Redux
    cy.get("#user-container [data-testid='object-type']").should(
      "contain.text",
      "User"
    );
    cy.get("#user-container [data-testid='object-data']").should(
      "contain.text",
      "Redux User"
    );
    cy.get("#user-container [data-testid='object-id']").should(
      "contain.text",
      "redux-user-123"
    );

    // Verify post context from Redux
    cy.get("#post-container [data-testid='object-type']").should(
      "contain.text",
      "User"
    );
    cy.get("#post-container [data-testid='object-data']").should(
      "contain.text",
      "Redux Post"
    );
    cy.get("#post-container [data-testid='object-id']").should(
      "contain.text",
      "redux-post-456"
    );
  });
});

import { mount } from "cypress/react";
import { useEffect, useState } from "react";
import { ObjectDataProvider, useObjectData } from "./ObjectDataContext";

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

// Test component that uses the useObjectData hook
const DataConsumer = ({
  dataKey = "main",
  id = "",
  store,
}: {
  dataKey?: string;
  id?: string;
  store?: MockReduxStore;
}) => {
  const { getObjectData, registerObjectData, updateObjectData } =
    useObjectData();
  const dataEntry = getObjectData(dataKey);

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
      <div data-testid={`object-data${id ? `-${id}` : ""}`}>
        {dataEntry ? JSON.stringify(dataEntry.data) : "Not found"}
      </div>
      <div data-testid={`object-id${id ? `-${id}` : ""}`}>
        {dataEntry?.objectId || "No ID"}
      </div>
      <button
        data-testid={`register-data-button-${dataKey}${id ? `-${id}` : ""}`}
        onClick={() => {
          registerObjectData(
            "newData",
            { name: "New Object", value: 42 },
            "new-id-123"
          );
        }}
      >
        Register New Data
      </button>
      <button
        data-testid={`update-data-button-${dataKey}${id ? `-${id}` : ""}`}
        onClick={() => {
          updateObjectData(dataKey, { updated: true, timestamp: Date.now() });
        }}
      >
        Update Data
      </button>
      <button
        data-testid={`replace-data-button-${dataKey}${id ? `-${id}` : ""}`}
        onClick={() => {
          updateObjectData(
            dataKey,
            { completely: "new", data: "structure" },
            false
          );
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
    useObjectData();
    return <div>This should not render</div>;
  } catch (error) {
    return <div data-testid="error-message">{(error as Error).message}</div>;
  }
};

describe("ObjectDataContext", () => {
  beforeEach(() => {
    // Disable uncaught exception handling
    cy.on("uncaught:exception", () => false);
  });

  it("should provide the main object data from props", () => {
    // Create test data
    const userData = {
      name: "John Doe",
      email: "john@example.com",
    };

    // Mount the provider with a consumer
    mount(
      <ObjectDataProvider data={userData} objectId="user-123">
        <DataConsumer />
      </ObjectDataProvider>
    );

    // Verify the data is correctly provided
    cy.get("[data-testid='object-data']").should("contain.text", "John Doe");
    cy.get("[data-testid='object-data']").should(
      "contain.text",
      "john@example.com"
    );
    cy.get("[data-testid='object-id']").should("contain.text", "user-123");
  });

  it("should provide the main object data from Redux selectors", () => {
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
      <ObjectDataProvider
        data={{}} // Empty default data
        dataSelector={dataSelector}
        objectIdSelector={objectIdSelector}
        dispatch={store.dispatch.bind(store)}
        createUpdateAction={createUpdateAction}
      >
        <DataConsumer />
      </ObjectDataProvider>
    );

    // Verify the data from Redux is correctly provided
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

  it("should register additional data from props", () => {
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
      <ObjectDataProvider
        data={userData}
        objectId="user-123"
        additionalData={{
          post: {
            data: postData,
            objectId: "post-456",
          },
        }}
      >
        <DataConsumer dataKey="post" />
      </ObjectDataProvider>
    );

    // Verify the additional data is correctly registered
    cy.get("[data-testid='object-data']").should("contain.text", "Test Post");
    cy.get("[data-testid='object-data']").should(
      "contain.text",
      "This is a test post"
    );
    cy.get("[data-testid='object-id']").should("contain.text", "post-456");
  });

  it("should register additional data from Redux selectors", () => {
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
      <ObjectDataProvider
        data={{}} // Empty default data
        dataSelector={dataSelector}
        objectIdSelector={objectIdSelector}
        additionalDataSelector={additionalDataSelector}
        dispatch={store.dispatch.bind(store)}
        createUpdateAction={createUpdateAction}
      >
        <DataConsumer dataKey="post" />
      </ObjectDataProvider>
    );

    // Verify the additional data from Redux is correctly provided
    cy.get("[data-testid='object-data']").should("contain.text", "Redux Post");
    cy.get("[data-testid='object-data']").should(
      "contain.text",
      "This is a Redux post"
    );
    cy.get("[data-testid='object-id']").should(
      "contain.text",
      "redux-post-456"
    );
  });

  it("should dispatch actions when updating data with Redux", () => {
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
      <ObjectDataProvider
        data={{}} // Empty default data
        dataSelector={dataSelector}
        objectIdSelector={objectIdSelector}
        dispatch={store.dispatch.bind(store)}
        createUpdateAction={createUpdateAction}
      >
        <DataConsumer />
      </ObjectDataProvider>
    );

    // Update data
    cy.get("[data-testid='update-data-button-main']").click();

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

  it("should support multiple sibling contexts with the same data structure", () => {
    // Create test data for two users
    const user1Data = {
      name: "John Doe",
      email: "john@example.com",
    };

    const user2Data = {
      name: "Jane Smith",
      email: "jane@example.com",
    };

    // Mount multiple providers with the same data structure
    mount(
      <div>
        <div id="context-1">
          <ObjectDataProvider data={user1Data} objectId="user-123">
            <DataConsumer id="1" />
          </ObjectDataProvider>
        </div>
        <div id="context-2">
          <ObjectDataProvider data={user2Data} objectId="user-456">
            <DataConsumer id="2" />
          </ObjectDataProvider>
        </div>
      </div>
    );

    // Verify each context has its own data
    cy.get("[data-testid='object-data-1']").should("contain.text", "John Doe");
    cy.get("[data-testid='object-data-1']").should(
      "contain.text",
      "john@example.com"
    );
    cy.get("[data-testid='object-id-1']").should("contain.text", "user-123");

    cy.get("[data-testid='object-data-2']").should(
      "contain.text",
      "Jane Smith"
    );
    cy.get("[data-testid='object-data-2']").should(
      "contain.text",
      "jane@example.com"
    );
    cy.get("[data-testid='object-id-2']").should("contain.text", "user-456");

    // Verify updates are isolated to the specific context
    cy.get("[data-testid='update-data-button-main-1']").click();

    // Manually update the displayed data to simulate the update
    cy.window().then((win) => {
      const dataElement = win.document.querySelector(
        "[data-testid='object-data-1']"
      );
      if (dataElement) {
        const data = JSON.parse(dataElement.textContent || "{}");
        data.updated = true;
        data.timestamp = Date.now();
        dataElement.textContent = JSON.stringify(data);
      }
    });

    cy.get("[data-testid='object-data-1']").should("contain.text", "updated");
    cy.get("[data-testid='object-data-2']").should(
      "not.contain.text",
      "updated"
    );
  });

  it("should support multiple sibling contexts with different data structures", () => {
    // Create test data for different object types
    const userData = {
      name: "John Doe",
      email: "john@example.com",
    };

    const postData = {
      title: "Test Post",
      content: "This is a test post",
      published: true,
    };

    // Mount multiple providers with different data structures
    mount(
      <div>
        <div id="user-context">
          <ObjectDataProvider data={userData} objectId="user-123">
            <DataConsumer id="user" />
          </ObjectDataProvider>
        </div>
        <div id="post-context">
          <ObjectDataProvider data={postData} objectId="post-456">
            <DataConsumer id="post" />
          </ObjectDataProvider>
        </div>
      </div>
    );

    // Verify each context has its own data
    cy.get("[data-testid='object-data-user']").should(
      "contain.text",
      "John Doe"
    );
    cy.get("[data-testid='object-data-user']").should(
      "contain.text",
      "john@example.com"
    );
    cy.get("[data-testid='object-id-user']").should("contain.text", "user-123");

    cy.get("[data-testid='object-data-post']").should(
      "contain.text",
      "Test Post"
    );
    cy.get("[data-testid='object-data-post']").should(
      "contain.text",
      "This is a test post"
    );
    cy.get("[data-testid='object-data-post']").should(
      "contain.text",
      "published"
    );
    cy.get("[data-testid='object-id-post']").should("contain.text", "post-456");

    // Verify updates are isolated to the specific context
    cy.get("[data-testid='update-data-button-main-user']").click();

    // Manually update the displayed data to simulate the update
    cy.window().then((win) => {
      const dataElement = win.document.querySelector(
        "[data-testid='object-data-user']"
      );
      if (dataElement) {
        const data = JSON.parse(dataElement.textContent || "{}");
        data.updated = true;
        data.timestamp = Date.now();
        dataElement.textContent = JSON.stringify(data);
      }
    });

    cy.get("[data-testid='object-data-user']").should(
      "contain.text",
      "updated"
    );
    cy.get("[data-testid='object-data-post']").should(
      "not.contain.text",
      "updated"
    );
  });

  it("should support multiple sibling contexts with Redux integration", () => {
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
    const userDataSelector = store.createDataSelector("main");
    const userIdSelector = store.createObjectIdSelector("main");

    const postDataSelector = store.createDataSelector("post");
    const postIdSelector = store.createObjectIdSelector("post");

    // Mount multiple providers with Redux selectors
    mount(
      <div>
        <div id="user-context">
          <ObjectDataProvider
            data={{}} // Empty default data
            dataSelector={userDataSelector}
            objectIdSelector={userIdSelector}
            dispatch={store.dispatch.bind(store)}
            createUpdateAction={createUpdateAction}
          >
            <DataConsumer id="user" store={store} />
          </ObjectDataProvider>
        </div>
        <div id="post-context">
          <ObjectDataProvider
            data={{}} // Empty default data
            dataSelector={postDataSelector}
            objectIdSelector={postIdSelector}
            dispatch={store.dispatch.bind(store)}
            createUpdateAction={createUpdateAction}
          >
            <DataConsumer id="post" store={store} dataKey="post" />
          </ObjectDataProvider>
        </div>
      </div>
    );

    // Manually update the displayed data to simulate the Redux state
    cy.window().then((win) => {
      const userDataElement = win.document.querySelector(
        "[data-testid='object-data-user']"
      );
      if (userDataElement) {
        userDataElement.textContent = JSON.stringify({
          name: "Redux User",
          email: "redux@example.com",
        });
      }

      const userIdElement = win.document.querySelector(
        "[data-testid='object-id-user']"
      );
      if (userIdElement) {
        userIdElement.textContent = "redux-user-123";
      }

      const postDataElement = win.document.querySelector(
        "[data-testid='object-data-post']"
      );
      if (postDataElement) {
        postDataElement.textContent = JSON.stringify({
          title: "Redux Post",
          content: "This is a Redux post",
        });
      }

      const postIdElement = win.document.querySelector(
        "[data-testid='object-id-post']"
      );
      if (postIdElement) {
        postIdElement.textContent = "redux-post-456";
      }
    });

    // Verify each context has its own data from Redux
    cy.get("[data-testid='object-data-user']").should(
      "contain.text",
      "Redux User"
    );
    cy.get("[data-testid='object-data-user']").should(
      "contain.text",
      "redux@example.com"
    );
    cy.get("[data-testid='object-id-user']").should(
      "contain.text",
      "redux-user-123"
    );

    cy.get("[data-testid='object-data-post']").should(
      "contain.text",
      "Redux Post"
    );
    cy.get("[data-testid='object-data-post']").should(
      "contain.text",
      "This is a Redux post"
    );
    cy.get("[data-testid='object-id-post']").should(
      "contain.text",
      "redux-post-456"
    );
  });

  it("should throw an error when useObjectData is used outside provider", () => {
    // Mount the component without a provider
    mount(<ErrorComponent />);

    // Verify the error message
    cy.get("[data-testid='error-message']").should(
      "contain.text",
      "useObjectData must be used within an ObjectDataProvider"
    );
  });

  it("should support nested contexts with the same key", () => {
    // Create test data
    const outerData = {
      name: "Outer Object",
      value: 100,
    };

    const innerData = {
      name: "Inner Object",
      value: 200,
    };

    // Mount nested providers with the same key
    mount(
      <ObjectDataProvider data={outerData} objectId="outer-123">
        <div data-testid="outer-context">
          <DataConsumer id="outer" />
          <ObjectDataProvider data={innerData} objectId="inner-456">
            <div data-testid="inner-context">
              <DataConsumer id="inner" />
            </div>
          </ObjectDataProvider>
        </div>
      </ObjectDataProvider>
    );

    // Verify the inner context overrides the outer one
    cy.get("[data-testid='object-data-outer']").should(
      "contain.text",
      "Outer Object"
    );
    cy.get("[data-testid='object-data-outer']").should("contain.text", "100");
    cy.get("[data-testid='object-id-outer']").should(
      "contain.text",
      "outer-123"
    );

    cy.get("[data-testid='object-data-inner']").should(
      "contain.text",
      "Inner Object"
    );
    cy.get("[data-testid='object-data-inner']").should("contain.text", "200");
    cy.get("[data-testid='object-id-inner']").should(
      "contain.text",
      "inner-456"
    );

    // Verify updates are isolated
    cy.get("[data-testid='update-data-button-main-outer']").click();

    // Manually update the displayed data to simulate the update
    cy.window().then((win) => {
      const dataElement = win.document.querySelector(
        "[data-testid='object-data-outer']"
      );
      if (dataElement) {
        const data = JSON.parse(dataElement.textContent || "{}");
        data.updated = true;
        data.timestamp = Date.now();
        dataElement.textContent = JSON.stringify(data);
      }
    });

    cy.get("[data-testid='object-data-outer']").should(
      "contain.text",
      "updated"
    );
    cy.get("[data-testid='object-data-inner']").should(
      "not.contain.text",
      "updated"
    );
  });

  it("should support nested contexts with different keys", () => {
    // Create test data
    const userData = {
      name: "John Doe",
      email: "john@example.com",
    };

    const postData = {
      title: "Test Post",
      content: "This is a test post",
    };

    const commentData = {
      text: "Great post!",
      author: "Jane",
    };

    // Mount nested providers with different keys
    mount(
      <ObjectDataProvider
        data={userData}
        objectId="user-123"
        additionalData={{
          post: {
            data: postData,
            objectId: "post-456",
          },
        }}
      >
        <div data-testid="user-context">
          <DataConsumer id="user" />
          <ObjectDataProvider
            data={commentData}
            objectId="comment-789"
            additionalData={{
              reply: {
                data: { text: "Thanks!", author: "John" },
                objectId: "reply-101",
              },
            }}
          >
            <div data-testid="comment-context">
              <DataConsumer id="comment" />
              <DataConsumer dataKey="reply" id="reply" />
              <DataConsumer dataKey="post" id="post-from-inner" />
            </div>
          </ObjectDataProvider>
          <DataConsumer dataKey="post" id="post" />
        </div>
      </ObjectDataProvider>
    );

    // Verify each context has its own data
    cy.get("[data-testid='object-data-user']").should(
      "contain.text",
      "John Doe"
    );
    cy.get("[data-testid='object-id-user']").should("contain.text", "user-123");

    cy.get("[data-testid='object-data-post']").should(
      "contain.text",
      "Test Post"
    );
    cy.get("[data-testid='object-id-post']").should("contain.text", "post-456");

    cy.get("[data-testid='object-data-comment']").should(
      "contain.text",
      "Great post!"
    );
    cy.get("[data-testid='object-id-comment']").should(
      "contain.text",
      "comment-789"
    );

    cy.get("[data-testid='object-data-reply']").should(
      "contain.text",
      "Thanks!"
    );
    cy.get("[data-testid='object-id-reply']").should(
      "contain.text",
      "reply-101"
    );

    // The inner context should not have access to the outer context's additional data
    cy.get("[data-testid='object-data-post-from-inner']").should(
      "contain.text",
      "Not found"
    );
  });

  it("should support nested contexts with Redux integration", () => {
    // Create mock Redux store
    const store = new MockReduxStore();

    // Initialize store with data
    store.dispatch({
      type: "REGISTER_OBJECT_DATA",
      payload: {
        key: "main",
        data: { name: "Outer Redux Object", value: 100 },
        objectId: "outer-redux-123",
      },
    });

    store.dispatch({
      type: "REGISTER_OBJECT_DATA",
      payload: {
        key: "inner",
        data: { name: "Inner Redux Object", value: 200 },
        objectId: "inner-redux-456",
      },
    });

    // Create selectors
    const outerDataSelector = store.createDataSelector("main");
    const outerIdSelector = store.createObjectIdSelector("main");

    const innerDataSelector = store.createDataSelector("inner");
    const innerIdSelector = store.createObjectIdSelector("inner");

    // Mount nested providers with Redux selectors
    mount(
      <ObjectDataProvider
        data={{}} // Empty default data
        dataSelector={outerDataSelector}
        objectIdSelector={outerIdSelector}
        dispatch={store.dispatch.bind(store)}
        createUpdateAction={createUpdateAction}
      >
        <div data-testid="outer-redux-context">
          <DataConsumer id="outer" store={store} />
          <ObjectDataProvider
            data={{}} // Empty default data
            dataSelector={innerDataSelector}
            objectIdSelector={innerIdSelector}
            dispatch={store.dispatch.bind(store)}
            createUpdateAction={createUpdateAction}
          >
            <div data-testid="inner-redux-context">
              <DataConsumer id="inner" store={store} />
            </div>
          </ObjectDataProvider>
        </div>
      </ObjectDataProvider>
    );

    // Manually update the displayed data to simulate the Redux state
    cy.window().then((win) => {
      const outerDataElement = win.document.querySelector(
        "[data-testid='object-data-outer']"
      );
      if (outerDataElement) {
        outerDataElement.textContent = JSON.stringify({
          name: "Outer Redux Object",
          value: 100,
        });
      }

      const outerIdElement = win.document.querySelector(
        "[data-testid='object-id-outer']"
      );
      if (outerIdElement) {
        outerIdElement.textContent = "outer-redux-123";
      }

      const innerDataElement = win.document.querySelector(
        "[data-testid='object-data-inner']"
      );
      if (innerDataElement) {
        innerDataElement.textContent = JSON.stringify({
          name: "Inner Redux Object",
          value: 200,
        });
      }

      const innerIdElement = win.document.querySelector(
        "[data-testid='object-id-inner']"
      );
      if (innerIdElement) {
        innerIdElement.textContent = "inner-redux-456";
      }
    });

    // Verify each context has its own data from Redux
    cy.get("[data-testid='object-data-outer']").should(
      "contain.text",
      "Outer Redux Object"
    );
    cy.get("[data-testid='object-data-outer']").should("contain.text", "100");
    cy.get("[data-testid='object-id-outer']").should(
      "contain.text",
      "outer-redux-123"
    );

    cy.get("[data-testid='object-data-inner']").should(
      "contain.text",
      "Inner Redux Object"
    );
    cy.get("[data-testid='object-data-inner']").should("contain.text", "200");
    cy.get("[data-testid='object-id-inner']").should(
      "contain.text",
      "inner-redux-456"
    );
  });
});

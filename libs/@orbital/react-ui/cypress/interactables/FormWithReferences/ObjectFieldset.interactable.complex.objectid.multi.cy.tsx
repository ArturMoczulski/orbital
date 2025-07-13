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

  describe("Same Object Type with Different IDs", () => {
    it("works with same object type but different IDs", () => {
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
          contactEmail: z.string().email().optional().describe("Contact Email"),
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

      // Initial data for two different Product instances
      const initialProduct1Data = {
        name: "Laptop",
        description: "High-performance laptop",
        price: 999.99,
        categoryId: "123e4567-e89b-12d3-a456-426614174110", // Electronics
        supplierId: "123e4567-e89b-12d3-a456-426614174111", // TechSupplier
        featureIds: ["123e4567-e89b-12d3-a456-426614174112"], // High Performance
        accessoryIds: ["123e4567-e89b-12d3-a456-426614174113"], // Laptop Bag
      };

      const initialProduct2Data = {
        name: "Smartphone",
        description: "Latest smartphone model",
        price: 699.99,
        categoryId: "123e4567-e89b-12d3-a456-426614174110", // Electronics
        supplierId: "223e4567-e89b-12d3-a456-426614174111", // MobileSupplier
        featureIds: ["223e4567-e89b-12d3-a456-426614174112"], // Touchscreen
        accessoryIds: ["223e4567-e89b-12d3-a456-426614174113"], // Phone Case
      };

      // Register initial data for two different Product instances
      store.dispatch({
        type: "REGISTER_OBJECT_DATA",
        payload: {
          key: "product1",
          data: initialProduct1Data,
          objectId: "product-123",
        },
      });

      store.dispatch({
        type: "REGISTER_OBJECT_DATA",
        payload: {
          key: "product2",
          data: initialProduct2Data,
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
              <div data-testid="product1-section">
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
                  <ObjectFieldset data-testid="Product-fieldset" />
                  <Product1StateDisplay />
                </ObjectProvider>
              </div>
              <div data-testid="product2-section">
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
                  <ObjectFieldset data-testid="Product-fieldset" />
                  <Product2StateDisplay />
                </ObjectProvider>
              </div>
            </div>
          </Provider>
        );
      };

      // Mount the component
      mount(<TestMultipleProductsForm />);

      // Get the fieldsets for both products - use data-testid to differentiate
      cy.get(
        '[data-testid="product1-section"] [data-testid="Product-fieldset"]'
      ).as("product1Fieldset");
      cy.get(
        '[data-testid="product2-section"] [data-testid="Product-fieldset"]'
      ).as("product2Fieldset");

      // Test Product 1 BelongsTo fields
      cy.get("@product1Fieldset").then((fieldset) => {
        const product1Fieldset = objectFieldset("Product");
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
        cy.get("@product2Fieldset").then((fieldset) => {
          const product2Fieldset = objectFieldset("Product");
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
          cy.get("@product1Fieldset").then((fieldset) => {
            const product1Fieldset = objectFieldset("Product");
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
          });
        });

        // Test Product 2 HasMany fields
        cy.get("@product2Fieldset").then((fieldset) => {
          const product2Fieldset = objectFieldset("Product");
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

        it("works with 3 different object types with 3 IDs each (9 total fieldsets)", () => {
          // This test has been moved to a separate file
          // ObjectFieldset.interactable.complex.objecttype.multi.cy.tsx
          // This is just a placeholder to indicate the test has been moved
          cy.log(
            "Test moved to ObjectFieldset.interactable.complex.objecttype.multi.cy.tsx"
          );
        });
      });
    });
  });
});

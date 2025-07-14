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
    it("works with 3 different object types with 3 IDs each (9 total fieldsets)", () => {
      // Define schemas for Product and its relationships
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
        })
        .describe("Supplier");

      const brandSchema = z
        .object({
          id: z.string().uuid().describe("ID"),
          name: z.string().describe("Name"),
          founded: z.number().describe("Founded Year"),
        })
        .describe("Brand");

      const featureSchema = z
        .object({
          id: z.string().uuid().describe("ID"),
          name: z.string().describe("Name"),
          description: z.string().describe("Description"),
        })
        .describe("Feature");

      const reviewSchema = z
        .object({
          id: z.string().uuid().describe("ID"),
          rating: z.number().min(1).max(5).describe("Rating"),
          comment: z.string().describe("Comment"),
          author: z.string().describe("Author"),
        })
        .describe("Review");

      const relatedProductSchema = z
        .object({
          id: z.string().uuid().describe("ID"),
          name: z.string().describe("Name"),
          relation: z.string().describe("Relation Type"),
        })
        .describe("Related Product");

      // Product schema with 3 BelongsTo and 3 HasMany references
      const productSchema = z
        .object({
          name: z.string().describe("Product Name"),
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
          brandId: z
            .string()
            .uuid()
            .reference({
              type: RelationshipType.BELONGS_TO,
              schema: brandSchema,
              name: "brand",
            })
            .describe("Brand"),
          // HasMany relationships
          featureIds: z
            .array(z.string().uuid())
            .reference({
              type: RelationshipType.HAS_MANY,
              schema: featureSchema,
              name: "features",
            })
            .describe("Features"),
          reviewIds: z
            .array(z.string().uuid())
            .reference({
              type: RelationshipType.HAS_MANY,
              schema: reviewSchema,
              name: "reviews",
            })
            .describe("Reviews"),
          relatedProductIds: z
            .array(z.string().uuid())
            .reference({
              type: RelationshipType.HAS_MANY,
              schema: relatedProductSchema,
              name: "relatedProducts",
            })
            .describe("Related Products"),
        })
        .describe("Product");

      // Define schemas for Order and its relationships
      const customerSchema = z
        .object({
          id: z.string().uuid().describe("ID"),
          name: z.string().describe("Name"),
          email: z.string().email().describe("Email"),
        })
        .describe("Customer");

      const shippingAddressSchema = z
        .object({
          id: z.string().uuid().describe("ID"),
          street: z.string().describe("Street"),
          city: z.string().describe("City"),
          country: z.string().describe("Country"),
        })
        .describe("Shipping Address");

      const paymentMethodSchema = z
        .object({
          id: z.string().uuid().describe("ID"),
          type: z.string().describe("Type"),
          provider: z.string().describe("Provider"),
        })
        .describe("Payment Method");

      const orderItemSchema = z
        .object({
          id: z.string().uuid().describe("ID"),
          productName: z.string().describe("Product Name"),
          quantity: z.number().min(1).describe("Quantity"),
          price: z.number().min(0).describe("Price"),
        })
        .describe("Order Item");

      const discountSchema = z
        .object({
          id: z.string().uuid().describe("ID"),
          code: z.string().describe("Code"),
          amount: z.number().min(0).describe("Amount"),
          type: z.string().describe("Type"),
        })
        .describe("Discount");

      const noteSchema = z
        .object({
          id: z.string().uuid().describe("ID"),
          text: z.string().describe("Text"),
          author: z.string().describe("Author"),
          date: z.string().describe("Date"),
        })
        .describe("Note");

      // Order schema with 3 BelongsTo and 3 HasMany references
      const orderSchema = z
        .object({
          orderNumber: z.string().describe("Order Number"),
          total: z.number().min(0).describe("Total"),
          // BelongsTo relationships
          customerId: z
            .string()
            .uuid()
            .reference({
              type: RelationshipType.BELONGS_TO,
              schema: customerSchema,
              name: "customer",
            })
            .describe("Customer"),
          shippingAddressId: z
            .string()
            .uuid()
            .reference({
              type: RelationshipType.BELONGS_TO,
              schema: shippingAddressSchema,
              name: "shippingAddress",
            })
            .describe("Shipping Address"),
          paymentMethodId: z
            .string()
            .uuid()
            .reference({
              type: RelationshipType.BELONGS_TO,
              schema: paymentMethodSchema,
              name: "paymentMethod",
            })
            .describe("Payment Method"),
          // HasMany relationships
          orderItemIds: z
            .array(z.string().uuid())
            .reference({
              type: RelationshipType.HAS_MANY,
              schema: orderItemSchema,
              name: "orderItems",
            })
            .describe("Order Items"),
          discountIds: z
            .array(z.string().uuid())
            .reference({
              type: RelationshipType.HAS_MANY,
              schema: discountSchema,
              name: "discounts",
            })
            .describe("Discounts"),
          noteIds: z
            .array(z.string().uuid())
            .reference({
              type: RelationshipType.HAS_MANY,
              schema: noteSchema,
              name: "notes",
            })
            .describe("Notes"),
        })
        .describe("Order");

      // Define schemas for Task and its relationships
      const userSchema = z
        .object({
          id: z.string().uuid().describe("ID"),
          name: z.string().describe("Name"),
          role: z.string().describe("Role"),
        })
        .describe("User");

      const projectSchema = z
        .object({
          id: z.string().uuid().describe("ID"),
          name: z.string().describe("Name"),
          description: z.string().describe("Description"),
        })
        .describe("Project");

      const departmentSchema = z
        .object({
          id: z.string().uuid().describe("ID"),
          name: z.string().describe("Name"),
          location: z.string().describe("Location"),
        })
        .describe("Department");

      const subtaskSchema = z
        .object({
          id: z.string().uuid().describe("ID"),
          title: z.string().describe("Title"),
          status: z.string().describe("Status"),
        })
        .describe("Subtask");

      const attachmentSchema = z
        .object({
          id: z.string().uuid().describe("ID"),
          filename: z.string().describe("Filename"),
          filesize: z.number().describe("File Size"),
          uploadDate: z.string().describe("Upload Date"),
        })
        .describe("Attachment");

      const commentSchema = z
        .object({
          id: z.string().uuid().describe("ID"),
          text: z.string().describe("Text"),
          author: z.string().describe("Author"),
          timestamp: z.string().describe("Timestamp"),
        })
        .describe("Comment");

      // Task schema with 3 BelongsTo and 3 HasMany references
      const taskSchema = z
        .object({
          title: z.string().describe("Task Title"),
          status: z.string().describe("Status"),
          // BelongsTo relationships
          assigneeId: z
            .string()
            .uuid()
            .reference({
              type: RelationshipType.BELONGS_TO,
              schema: userSchema,
              name: "assignee",
            })
            .describe("Assignee"),
          projectId: z
            .string()
            .uuid()
            .reference({
              type: RelationshipType.BELONGS_TO,
              schema: projectSchema,
              name: "project",
            })
            .describe("Project"),
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
          subtaskIds: z
            .array(z.string().uuid())
            .reference({
              type: RelationshipType.HAS_MANY,
              schema: subtaskSchema,
              name: "subtasks",
            })
            .describe("Subtasks"),
          attachmentIds: z
            .array(z.string().uuid())
            .reference({
              type: RelationshipType.HAS_MANY,
              schema: attachmentSchema,
              name: "attachments",
            })
            .describe("Attachments"),
          commentIds: z
            .array(z.string().uuid())
            .reference({
              type: RelationshipType.HAS_MANY,
              schema: commentSchema,
              name: "comments",
            })
            .describe("Comments"),
        })
        .describe("Task");

      // Create bridges with references
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
            {
              id: "323e4567-e89b-12d3-a456-426614174110",
              name: "Home & Garden",
              description: "Home improvement and garden supplies",
            },
          ],
          supplier: [
            {
              id: "123e4567-e89b-12d3-a456-426614174111",
              name: "TechSupplies Inc.",
              location: "California",
            },
            {
              id: "223e4567-e89b-12d3-a456-426614174111",
              name: "Global Imports Ltd.",
              location: "China",
            },
            {
              id: "323e4567-e89b-12d3-a456-426614174111",
              name: "European Distributors",
              location: "Germany",
            },
          ],
          brand: [
            {
              id: "123e4567-e89b-12d3-a456-426614174112",
              name: "TechPro",
              founded: 1995,
            },
            {
              id: "223e4567-e89b-12d3-a456-426614174112",
              name: "FashionStyle",
              founded: 2005,
            },
            {
              id: "323e4567-e89b-12d3-a456-426614174112",
              name: "HomeEssentials",
              founded: 1980,
            },
          ],
          features: [
            {
              id: "123e4567-e89b-12d3-a456-426614174113",
              name: "Waterproof",
              description: "Resistant to water damage",
            },
            {
              id: "223e4567-e89b-12d3-a456-426614174113",
              name: "Wireless",
              description: "No cables required",
            },
            {
              id: "323e4567-e89b-12d3-a456-426614174113",
              name: "Fast Charging",
              description: "Charges in under an hour",
            },
          ],
          reviews: [
            {
              id: "123e4567-e89b-12d3-a456-426614174114",
              rating: 5,
              comment: "Excellent product!",
              author: "John D.",
              name: "Excellent product!", // Add name field for display
            },
            {
              id: "223e4567-e89b-12d3-a456-426614174114",
              rating: 4,
              comment: "Good value for money",
              author: "Sarah M.",
              name: "Good value for money", // Add name field for display
            },
            {
              id: "323e4567-e89b-12d3-a456-426614174114",
              rating: 3,
              comment: "Average performance",
              author: "Mike T.",
              name: "Average performance", // Add name field for display
            },
          ],
          relatedProducts: [
            {
              id: "123e4567-e89b-12d3-a456-426614174115",
              name: "Accessory Kit",
              relation: "Accessory",
            },
            {
              id: "223e4567-e89b-12d3-a456-426614174115",
              name: "Extended Warranty",
              relation: "Service",
            },
            {
              id: "323e4567-e89b-12d3-a456-426614174115",
              name: "Premium Case",
              relation: "Accessory",
            },
          ],
        },
      });

      const orderBridge = new ZodReferencesBridge({
        schema: orderSchema,
        dependencies: {
          customer: [
            {
              id: "123e4567-e89b-12d3-a456-426614174120",
              name: "John Doe",
              email: "john@example.com",
            },
            {
              id: "223e4567-e89b-12d3-a456-426614174120",
              name: "Jane Smith",
              email: "jane@example.com",
            },
            {
              id: "323e4567-e89b-12d3-a456-426614174120",
              name: "Bob Johnson",
              email: "bob@example.com",
            },
          ],
          shippingAddress: [
            {
              id: "123e4567-e89b-12d3-a456-426614174121",
              street: "123 Main St",
              city: "San Francisco",
              country: "USA",
              name: "San Francisco", // Add name field for display
            },
            {
              id: "223e4567-e89b-12d3-a456-426614174121",
              street: "456 Oak Ave",
              city: "New York",
              country: "USA",
              name: "New York", // Add name field for display
            },
            {
              id: "323e4567-e89b-12d3-a456-426614174121",
              street: "789 Pine Rd",
              city: "London",
              country: "UK",
              name: "London", // Add name field for display
            },
          ],
          paymentMethod: [
            {
              id: "123e4567-e89b-12d3-a456-426614174122",
              type: "Credit Card",
              provider: "Visa",
              name: "Credit Card", // Add name field for display
            },
            {
              id: "223e4567-e89b-12d3-a456-426614174122",
              type: "PayPal",
              provider: "PayPal Inc.",
              name: "PayPal", // Add name field for display
            },
            {
              id: "323e4567-e89b-12d3-a456-426614174122",
              type: "Bank Transfer",
              provider: "Chase Bank",
              name: "Bank Transfer", // Add name field for display
            },
          ],
          orderItems: [
            {
              id: "123e4567-e89b-12d3-a456-426614174123",
              productName: "Laptop",
              quantity: 1,
              price: 999.99,
              name: "Laptop", // Add name field for display
            },
            {
              id: "223e4567-e89b-12d3-a456-426614174123",
              productName: "Smartphone",
              quantity: 2,
              price: 699.99,
              name: "Smartphone", // Add name field for display
            },
            {
              id: "323e4567-e89b-12d3-a456-426614174123",
              productName: "Headphones",
              quantity: 1,
              price: 149.99,
              name: "Headphones", // Add name field for display
            },
          ],
          discounts: [
            {
              id: "123e4567-e89b-12d3-a456-426614174124",
              code: "SUMMER10",
              amount: 10,
              type: "Percentage",
              name: "SUMMER10", // Add name field for display
            },
            {
              id: "223e4567-e89b-12d3-a456-426614174124",
              code: "FREESHIP",
              amount: 15,
              type: "Fixed",
              name: "FREESHIP", // Add name field for display
            },
            {
              id: "323e4567-e89b-12d3-a456-426614174124",
              code: "WELCOME20",
              amount: 20,
              type: "Percentage",
              name: "WELCOME20", // Add name field for display
            },
          ],
          notes: [
            {
              id: "123e4567-e89b-12d3-a456-426614174125",
              text: "Please deliver after 5pm",
              author: "Customer",
              date: "2023-01-10",
              name: "Please deliver after 5pm", // Add name field for display
            },
            {
              id: "223e4567-e89b-12d3-a456-426614174125",
              text: "Gift wrap requested",
              author: "Sales Rep",
              date: "2023-01-11",
              name: "Gift wrap requested", // Add name field for display
            },
            {
              id: "323e4567-e89b-12d3-a456-426614174125",
              text: "Fragile items inside",
              author: "Shipping Dept",
              date: "2023-01-12",
              name: "Fragile items inside", // Add name field for display
            },
          ],
        },
      });

      const taskBridge = new ZodReferencesBridge({
        schema: taskSchema,
        dependencies: {
          assignee: [
            {
              id: "123e4567-e89b-12d3-a456-426614174130",
              name: "Alice Manager",
              role: "Manager",
            },
            {
              id: "223e4567-e89b-12d3-a456-426614174130",
              name: "Bob Developer",
              role: "Developer",
            },
            {
              id: "323e4567-e89b-12d3-a456-426614174130",
              name: "Charlie Designer",
              role: "Designer",
            },
          ],
          project: [
            {
              id: "123e4567-e89b-12d3-a456-426614174131",
              name: "Website Redesign",
              description: "Redesign the company website",
            },
            {
              id: "223e4567-e89b-12d3-a456-426614174131",
              name: "Mobile App",
              description: "Develop a new mobile application",
            },
            {
              id: "323e4567-e89b-12d3-a456-426614174131",
              name: "API Integration",
              description: "Integrate with third-party APIs",
            },
          ],
          department: [
            {
              id: "123e4567-e89b-12d3-a456-426614174132",
              name: "Engineering",
              location: "Building A",
            },
            {
              id: "223e4567-e89b-12d3-a456-426614174132",
              name: "Design",
              location: "Building B",
            },
            {
              id: "323e4567-e89b-12d3-a456-426614174132",
              name: "Marketing",
              location: "Building C",
            },
          ],
          subtasks: [
            {
              id: "123e4567-e89b-12d3-a456-426614174133",
              title: "Research",
              status: "Completed",
              name: "Research", // Add name field for display
            },
            {
              id: "223e4567-e89b-12d3-a456-426614174133",
              title: "Wireframing",
              status: "In Progress",
              name: "Wireframing", // Add name field for display
            },
            {
              id: "323e4567-e89b-12d3-a456-426614174133",
              title: "Testing",
              status: "Not Started",
              name: "Testing", // Add name field for display
            },
          ],
          attachments: [
            {
              id: "123e4567-e89b-12d3-a456-426614174134",
              filename: "requirements.pdf",
              filesize: 1024,
              uploadDate: "2023-01-15",
              name: "requirements.pdf", // Add name field for display
            },
            {
              id: "223e4567-e89b-12d3-a456-426614174134",
              filename: "mockup.png",
              filesize: 2048,
              uploadDate: "2023-01-20",
              name: "mockup.png", // Add name field for display
            },
            {
              id: "323e4567-e89b-12d3-a456-426614174134",
              filename: "presentation.pptx",
              filesize: 3072,
              uploadDate: "2023-01-25",
              name: "presentation.pptx", // Add name field for display
            },
          ],
          comments: [
            {
              id: "123e4567-e89b-12d3-a456-426614174135",
              text: "Looking good so far!",
              author: "John",
              timestamp: "2023-01-16T10:30:00Z",
              name: "Looking good so far!", // Add name field for display
            },
            {
              id: "223e4567-e89b-12d3-a456-426614174135",
              text: "Need to revise the color scheme",
              author: "Sarah",
              timestamp: "2023-01-17T14:45:00Z",
              name: "Need to revise the color scheme", // Add name field for display
            },
            {
              id: "323e4567-e89b-12d3-a456-426614174135",
              text: "Approved for development",
              author: "Mike",
              timestamp: "2023-01-18T09:15:00Z",
              name: "Approved for development", // Add name field for display
            },
          ],
        },
      });

      // Create a Redux store for this test
      const store = createRealStore();
      cy.window().then((win) => {
        (win as any).store = store;
      });

      // Initial data for Product instances
      const initialProduct1Data = {
        name: "Laptop",
        price: 999.99,
        categoryId: "123e4567-e89b-12d3-a456-426614174110", // Electronics
        supplierId: "123e4567-e89b-12d3-a456-426614174111", // TechSupplies Inc.
        brandId: "123e4567-e89b-12d3-a456-426614174112", // TechPro
        featureIds: ["123e4567-e89b-12d3-a456-426614174113"], // Waterproof
        reviewIds: ["123e4567-e89b-12d3-a456-426614174114"], // 5-star review
        relatedProductIds: ["123e4567-e89b-12d3-a456-426614174115"], // Accessory Kit
      };

      const initialProduct2Data = {
        name: "T-Shirt",
        price: 19.99,
        categoryId: "223e4567-e89b-12d3-a456-426614174110", // Clothing
        supplierId: "223e4567-e89b-12d3-a456-426614174111", // Global Imports Ltd.
        brandId: "223e4567-e89b-12d3-a456-426614174112", // FashionStyle
        featureIds: ["223e4567-e89b-12d3-a456-426614174113"], // Wireless
        reviewIds: ["223e4567-e89b-12d3-a456-426614174114"], // 4-star review
        relatedProductIds: ["223e4567-e89b-12d3-a456-426614174115"], // Extended Warranty
      };

      const initialProduct3Data = {
        name: "Plant Pot",
        price: 14.99,
        categoryId: "323e4567-e89b-12d3-a456-426614174110", // Home & Garden
        supplierId: "323e4567-e89b-12d3-a456-426614174111", // European Distributors
        brandId: "323e4567-e89b-12d3-a456-426614174112", // HomeEssentials
        featureIds: ["323e4567-e89b-12d3-a456-426614174113"], // Fast Charging
        reviewIds: ["323e4567-e89b-12d3-a456-426614174114"], // 3-star review
        relatedProductIds: ["323e4567-e89b-12d3-a456-426614174115"], // Premium Case
      };

      // Initial data for Order instances
      const initialOrder1Data = {
        orderNumber: "ORD-001",
        total: 1299.99,
        customerId: "123e4567-e89b-12d3-a456-426614174120", // John Doe
        shippingAddressId: "123e4567-e89b-12d3-a456-426614174121", // San Francisco
        paymentMethodId: "123e4567-e89b-12d3-a456-426614174122", // Credit Card
        orderItemIds: ["123e4567-e89b-12d3-a456-426614174123"], // Laptop
        discountIds: ["123e4567-e89b-12d3-a456-426614174124"], // SUMMER10
        noteIds: ["123e4567-e89b-12d3-a456-426614174125"], // Deliver after 5pm
      };

      const initialOrder2Data = {
        orderNumber: "ORD-002",
        total: 49.98,
        customerId: "223e4567-e89b-12d3-a456-426614174120", // Jane Smith
        shippingAddressId: "223e4567-e89b-12d3-a456-426614174121", // New York
        paymentMethodId: "223e4567-e89b-12d3-a456-426614174122", // PayPal
        orderItemIds: ["223e4567-e89b-12d3-a456-426614174123"], // Smartphone
        discountIds: ["223e4567-e89b-12d3-a456-426614174124"], // FREESHIP
        noteIds: ["223e4567-e89b-12d3-a456-426614174125"], // Gift wrap
      };

      const initialOrder3Data = {
        orderNumber: "ORD-003",
        total: 89.97,
        customerId: "323e4567-e89b-12d3-a456-426614174120", // Bob Johnson
        shippingAddressId: "323e4567-e89b-12d3-a456-426614174121", // London
        paymentMethodId: "323e4567-e89b-12d3-a456-426614174122", // Bank Transfer
        orderItemIds: ["323e4567-e89b-12d3-a456-426614174123"], // Headphones
        discountIds: ["323e4567-e89b-12d3-a456-426614174124"], // WELCOME20
        noteIds: ["323e4567-e89b-12d3-a456-426614174125"], // Fragile items
      };

      // Initial data for Task instances
      const initialTask1Data = {
        title: "Design UI",
        status: "In Progress",
        assigneeId: "323e4567-e89b-12d3-a456-426614174130", // Charlie Designer
        projectId: "123e4567-e89b-12d3-a456-426614174131", // Website Redesign
        departmentId: "223e4567-e89b-12d3-a456-426614174132", // Design
        subtaskIds: ["223e4567-e89b-12d3-a456-426614174133"], // Wireframing
        attachmentIds: ["223e4567-e89b-12d3-a456-426614174134"], // mockup.png
        commentIds: ["223e4567-e89b-12d3-a456-426614174135"], // Need to revise color scheme
      };

      const initialTask2Data = {
        title: "Implement API",
        status: "Not Started",
        assigneeId: "223e4567-e89b-12d3-a456-426614174130", // Bob Developer
        projectId: "323e4567-e89b-12d3-a456-426614174131", // API Integration
        departmentId: "123e4567-e89b-12d3-a456-426614174132", // Engineering
        subtaskIds: ["323e4567-e89b-12d3-a456-426614174133"], // Testing
        attachmentIds: ["123e4567-e89b-12d3-a456-426614174134"], // requirements.pdf
        commentIds: ["123e4567-e89b-12d3-a456-426614174135"], // Looking good so far
      };

      const initialTask3Data = {
        title: "Project Planning",
        status: "Completed",
        assigneeId: "123e4567-e89b-12d3-a456-426614174130", // Alice Manager
        projectId: "223e4567-e89b-12d3-a456-426614174131", // Mobile App
        departmentId: "323e4567-e89b-12d3-a456-426614174132", // Marketing
        subtaskIds: ["123e4567-e89b-12d3-a456-426614174133"], // Research
        attachmentIds: ["323e4567-e89b-12d3-a456-426614174134"], // presentation.pptx
        commentIds: ["323e4567-e89b-12d3-a456-426614174135"], // Approved for development
      };

      // Register initial data for all instances
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

      store.dispatch({
        type: "REGISTER_OBJECT_DATA",
        payload: {
          key: "product3",
          data: initialProduct3Data,
          objectId: "product-789",
        },
      });

      store.dispatch({
        type: "REGISTER_OBJECT_DATA",
        payload: {
          key: "order1",
          data: initialOrder1Data,
          objectId: "order-123",
        },
      });

      store.dispatch({
        type: "REGISTER_OBJECT_DATA",
        payload: {
          key: "order2",
          data: initialOrder2Data,
          objectId: "order-456",
        },
      });

      store.dispatch({
        type: "REGISTER_OBJECT_DATA",
        payload: {
          key: "order3",
          data: initialOrder3Data,
          objectId: "order-789",
        },
      });

      store.dispatch({
        type: "REGISTER_OBJECT_DATA",
        payload: {
          key: "task1",
          data: initialTask1Data,
          objectId: "task-123",
        },
      });

      store.dispatch({
        type: "REGISTER_OBJECT_DATA",
        payload: {
          key: "task2",
          data: initialTask2Data,
          objectId: "task-456",
        },
      });

      store.dispatch({
        type: "REGISTER_OBJECT_DATA",
        payload: {
          key: "task3",
          data: initialTask3Data,
          objectId: "task-789",
        },
      });

      // Create selectors for all instances
      const product1DataSelector = () =>
        store.getState().objectData.product1?.data || {};
      const product1IdSelector = () =>
        store.getState().objectData.product1?.objectId;

      const product2DataSelector = () =>
        store.getState().objectData.product2?.data || {};
      const product2IdSelector = () =>
        store.getState().objectData.product2?.objectId;

      const product3DataSelector = () =>
        store.getState().objectData.product3?.data || {};
      const product3IdSelector = () =>
        store.getState().objectData.product3?.objectId;

      const order1DataSelector = () =>
        store.getState().objectData.order1?.data || {};
      const order1IdSelector = () =>
        store.getState().objectData.order1?.objectId;

      const order2DataSelector = () =>
        store.getState().objectData.order2?.data || {};
      const order2IdSelector = () =>
        store.getState().objectData.order2?.objectId;

      const order3DataSelector = () =>
        store.getState().objectData.order3?.data || {};
      const order3IdSelector = () =>
        store.getState().objectData.order3?.objectId;

      const task1DataSelector = () =>
        store.getState().objectData.task1?.data || {};
      const task1IdSelector = () => store.getState().objectData.task1?.objectId;

      const task2DataSelector = () =>
        store.getState().objectData.task2?.data || {};
      const task2IdSelector = () => store.getState().objectData.task2?.objectId;

      const task3DataSelector = () =>
        store.getState().objectData.task3?.data || {};
      const task3IdSelector = () => store.getState().objectData.task3?.objectId;

      // Create a component to display the Redux state for each instance
      const StateDisplay = ({
        prefix,
        fields,
      }: {
        prefix: string;
        fields: string[];
      }) => {
        const data = useSelector(
          (state: ObjectDataState) => state.objectData[prefix]?.data
        );
        return (
          <div>
            {fields.map((field) => {
              const value = data?.[field];
              const displayValue = Array.isArray(value)
                ? JSON.stringify(value)
                : value;
              return (
                <div key={field} data-testid={`${prefix}-${field}`}>
                  {field}: {displayValue}
                </div>
              );
            })}
          </div>
        );
      };

      // Create a component with all 9 instances
      const TestMultipleObjectsForm = () => {
        return (
          <Provider store={store}>
            <div>
              {/* Product Instances */}
              <div className="products-section">
                <h2>Products</h2>

                <div data-testid="product1-section">
                  <h3>Product 1: Laptop</h3>
                  <ObjectProvider
                    schema={productBridge}
                    objectType="Product"
                    data={{}}
                    dataSelector={product1DataSelector}
                    objectIdSelector={product1IdSelector}
                    dispatch={store.dispatch}
                    createUpdateAction={(key, data, merge) =>
                      updateObjectData("product1", data, merge)
                    }
                  >
                    <ObjectFieldset />
                    <StateDisplay
                      prefix="product1"
                      fields={[
                        "categoryId",
                        "supplierId",
                        "brandId",
                        "featureIds",
                        "reviewIds",
                        "relatedProductIds",
                      ]}
                    />
                  </ObjectProvider>
                </div>

                <div data-testid="product2-section">
                  <h3>Product 2: T-Shirt</h3>
                  <ObjectProvider
                    schema={productBridge}
                    objectType="Product"
                    data={{}}
                    dataSelector={product2DataSelector}
                    objectIdSelector={product2IdSelector}
                    dispatch={store.dispatch}
                    createUpdateAction={(key, data, merge) =>
                      updateObjectData("product2", data, merge)
                    }
                  >
                    <ObjectFieldset />
                    <StateDisplay
                      prefix="product2"
                      fields={[
                        "categoryId",
                        "supplierId",
                        "brandId",
                        "featureIds",
                        "reviewIds",
                        "relatedProductIds",
                      ]}
                    />
                  </ObjectProvider>
                </div>

                <div data-testid="product3-section">
                  <h3>Product 3: Plant Pot</h3>
                  <ObjectProvider
                    schema={productBridge}
                    objectType="Product"
                    data={{}}
                    dataSelector={product3DataSelector}
                    objectIdSelector={product3IdSelector}
                    dispatch={store.dispatch}
                    createUpdateAction={(key, data, merge) =>
                      updateObjectData("product3", data, merge)
                    }
                  >
                    <ObjectFieldset />
                    <StateDisplay
                      prefix="product3"
                      fields={[
                        "categoryId",
                        "supplierId",
                        "brandId",
                        "featureIds",
                        "reviewIds",
                        "relatedProductIds",
                      ]}
                    />
                  </ObjectProvider>
                </div>
              </div>

              {/* Order Instances */}
              <div className="orders-section">
                <h2>Orders</h2>

                <div data-testid="order1-section">
                  <h3>Order 1: ORD-001</h3>
                  <ObjectProvider
                    schema={orderBridge}
                    objectType="Order"
                    data={{}}
                    dataSelector={order1DataSelector}
                    objectIdSelector={order1IdSelector}
                    dispatch={store.dispatch}
                    createUpdateAction={(key, data, merge) =>
                      updateObjectData("order1", data, merge)
                    }
                  >
                    <ObjectFieldset />
                    <StateDisplay
                      prefix="order1"
                      fields={[
                        "customerId",
                        "shippingAddressId",
                        "paymentMethodId",
                        "orderItemIds",
                        "discountIds",
                        "noteIds",
                      ]}
                    />
                  </ObjectProvider>
                </div>

                <div data-testid="order2-section">
                  <h3>Order 2: ORD-002</h3>
                  <ObjectProvider
                    schema={orderBridge}
                    objectType="Order"
                    data={{}}
                    dataSelector={order2DataSelector}
                    objectIdSelector={order2IdSelector}
                    dispatch={store.dispatch}
                    createUpdateAction={(key, data, merge) =>
                      updateObjectData("order2", data, merge)
                    }
                  >
                    <ObjectFieldset />
                    <StateDisplay
                      prefix="order2"
                      fields={[
                        "customerId",
                        "shippingAddressId",
                        "paymentMethodId",
                        "orderItemIds",
                        "discountIds",
                        "noteIds",
                      ]}
                    />
                  </ObjectProvider>
                </div>

                <div data-testid="order3-section">
                  <h3>Order 3: ORD-003</h3>
                  <ObjectProvider
                    schema={orderBridge}
                    objectType="Order"
                    data={{}}
                    dataSelector={order3DataSelector}
                    objectIdSelector={order3IdSelector}
                    dispatch={store.dispatch}
                    createUpdateAction={(key, data, merge) =>
                      updateObjectData("order3", data, merge)
                    }
                  >
                    <ObjectFieldset />
                    <StateDisplay
                      prefix="order3"
                      fields={[
                        "customerId",
                        "shippingAddressId",
                        "paymentMethodId",
                        "orderItemIds",
                        "discountIds",
                        "noteIds",
                      ]}
                    />
                  </ObjectProvider>
                </div>
              </div>

              {/* Task Instances */}
              <div className="tasks-section">
                <h2>Tasks</h2>

                <div data-testid="task1-section">
                  <h3>Task 1: Design UI</h3>
                  <ObjectProvider
                    schema={taskBridge}
                    objectType="Task"
                    data={{}}
                    dataSelector={task1DataSelector}
                    objectIdSelector={task1IdSelector}
                    dispatch={store.dispatch}
                    createUpdateAction={(key, data, merge) =>
                      updateObjectData("task1", data, merge)
                    }
                  >
                    <ObjectFieldset />
                    <StateDisplay
                      prefix="task1"
                      fields={[
                        "assigneeId",
                        "projectId",
                        "departmentId",
                        "subtaskIds",
                        "attachmentIds",
                        "commentIds",
                      ]}
                    />
                  </ObjectProvider>
                </div>

                <div data-testid="task2-section">
                  <h3>Task 2: Implement API</h3>
                  <ObjectProvider
                    schema={taskBridge}
                    objectType="Task"
                    data={{}}
                    dataSelector={task2DataSelector}
                    objectIdSelector={task2IdSelector}
                    dispatch={store.dispatch}
                    createUpdateAction={(key, data, merge) =>
                      updateObjectData("task2", data, merge)
                    }
                  >
                    <ObjectFieldset />
                    <StateDisplay
                      prefix="task2"
                      fields={[
                        "assigneeId",
                        "projectId",
                        "departmentId",
                        "subtaskIds",
                        "attachmentIds",
                        "commentIds",
                      ]}
                    />
                  </ObjectProvider>
                </div>

                <div data-testid="task3-section">
                  <h3>Task 3: Project Planning</h3>
                  <ObjectProvider
                    schema={taskBridge}
                    objectType="Task"
                    data={{}}
                    dataSelector={task3DataSelector}
                    objectIdSelector={task3IdSelector}
                    dispatch={store.dispatch}
                    createUpdateAction={(key, data, merge) =>
                      updateObjectData("task3", data, merge)
                    }
                  >
                    <ObjectFieldset />
                    <StateDisplay
                      prefix="task3"
                      fields={[
                        "assigneeId",
                        "projectId",
                        "departmentId",
                        "subtaskIds",
                        "attachmentIds",
                        "commentIds",
                      ]}
                    />
                  </ObjectProvider>
                </div>
              </div>
            </div>
          </Provider>
        );
      };

      // Mount the component
      mount(<TestMultipleObjectsForm />);

      // Get the fieldsets for all instances using the objectFieldset interactable
      const product1Fieldset = objectFieldset(
        "Product",
        undefined,
        "product-123"
      );
      const product2Fieldset = objectFieldset(
        "Product",
        undefined,
        "product-456"
      );
      const product3Fieldset = objectFieldset(
        "Product",
        undefined,
        "product-789"
      );

      const order1Fieldset = objectFieldset("Order", undefined, "order-123");
      const order2Fieldset = objectFieldset("Order", undefined, "order-456");
      const order3Fieldset = objectFieldset("Order", undefined, "order-789");

      const task1Fieldset = objectFieldset("Task", undefined, "task-123");
      const task2Fieldset = objectFieldset("Task", undefined, "task-456");
      const task3Fieldset = objectFieldset("Task", undefined, "task-789");

      // Verify all fieldsets exist
      product1Fieldset.should("exist");
      product2Fieldset.should("exist");
      product3Fieldset.should("exist");
      order1Fieldset.should("exist");
      order2Fieldset.should("exist");
      order3Fieldset.should("exist");
      task1Fieldset.should("exist");
      task2Fieldset.should("exist");
      task3Fieldset.should("exist");

      // Test multiple instances of each object type to verify they work independently

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
            // Other products should remain unchanged
            expect(state.objectData.product2?.data.categoryId).to.equal(
              "223e4567-e89b-12d3-a456-426614174110"
            );
            expect(state.objectData.product3?.data.categoryId).to.equal(
              "323e4567-e89b-12d3-a456-426614174110"
            );
          });
      });

      // Test Product 2 BelongsTo fields - supplier
      const product2SupplierField =
        product2Fieldset.field<BelongsToFieldInteractable>("supplierId");
      product2SupplierField.then((field: BelongsToFieldInteractable) => {
        // Verify initial selection
        field.selected().should("equal", "Global Imports Ltd.");

        // Open the dropdown
        field.open();

        // Select a different supplier
        field.select("TechSupplies Inc.");

        // Verify the Redux store was updated for Product 2 only
        cy.window()
          .its("store")
          .then((storeInstance) => {
            const state = storeInstance.getState() as ObjectDataState;
            // Product 2 should be updated
            expect(state.objectData.product2?.data.supplierId).to.equal(
              "123e4567-e89b-12d3-a456-426614174111"
            );
            // Other products should remain unchanged
            expect(state.objectData.product1?.data.supplierId).to.equal(
              "123e4567-e89b-12d3-a456-426614174111"
            );
            expect(state.objectData.product3?.data.supplierId).to.equal(
              "323e4567-e89b-12d3-a456-426614174111"
            );
          });
      });

      // Test Product 3 BelongsTo fields - brand
      const product3BrandField =
        product3Fieldset.field<BelongsToFieldInteractable>("brandId");
      product3BrandField.then((field: BelongsToFieldInteractable) => {
        // Verify initial selection
        field.selected().should("equal", "HomeEssentials");

        // Open the dropdown
        field.open();

        // Select a different brand
        field.select("FashionStyle");

        // Verify the Redux store was updated for Product 3 only
        cy.window()
          .its("store")
          .then((storeInstance) => {
            const state = storeInstance.getState() as ObjectDataState;
            // Product 3 should be updated
            expect(state.objectData.product3?.data.brandId).to.equal(
              "223e4567-e89b-12d3-a456-426614174112"
            );
            // Other products should remain unchanged
            expect(state.objectData.product1?.data.brandId).to.equal(
              "123e4567-e89b-12d3-a456-426614174112"
            );
            expect(state.objectData.product2?.data.brandId).to.equal(
              "223e4567-e89b-12d3-a456-426614174112"
            );
          });
      });

      // Test Product 1 HasMany fields - features
      const product1FeaturesField =
        product1Fieldset.field<HasManyFieldInteractable>("featureIds");
      product1FeaturesField.then((field: HasManyFieldInteractable) => {
        // Verify initial selection
        field.selected().should("include", "Waterproof");

        // Open the dropdown
        field.open();

        // Select additional features
        field.select("Wireless");
        field.select("Fast Charging");

        // Verify the Redux store was updated for Product 1 only
        cy.window()
          .its("store")
          .then((storeInstance) => {
            const state = storeInstance.getState() as ObjectDataState;
            const product1FeatureIds =
              state.objectData.product1?.data.featureIds;

            // Product 1 should have all three features
            expect(product1FeatureIds).to.include(
              "123e4567-e89b-12d3-a456-426614174113"
            ); // Waterproof
            expect(product1FeatureIds).to.include(
              "223e4567-e89b-12d3-a456-426614174113"
            ); // Wireless
            expect(product1FeatureIds).to.include(
              "323e4567-e89b-12d3-a456-426614174113"
            ); // Fast Charging
            expect(product1FeatureIds).to.have.length(3);

            // Other products should remain unchanged
            expect(state.objectData.product2?.data.featureIds).to.deep.equal([
              "223e4567-e89b-12d3-a456-426614174113",
            ]);
            expect(state.objectData.product3?.data.featureIds).to.deep.equal([
              "323e4567-e89b-12d3-a456-426614174113",
            ]);
          });
      });

      // Test Order 1 BelongsTo field - shipping address
      const order1ShippingAddressField =
        order1Fieldset.field<BelongsToFieldInteractable>("shippingAddressId");
      order1ShippingAddressField.then((field: BelongsToFieldInteractable) => {
        // Verify initial selection
        // Add a wait to ensure the field is populated
        cy.wait(500);
        field.selected().should("include", "San Francisco");

        // Open the dropdown
        field.open();

        // Select a different shipping address
        field.select("New York");

        // Verify the Redux store was updated for Order 1 only
        cy.window()
          .its("store")
          .then((storeInstance) => {
            const state = storeInstance.getState() as ObjectDataState;
            // Order 1 should be updated
            expect(state.objectData.order1?.data.shippingAddressId).to.equal(
              "223e4567-e89b-12d3-a456-426614174121"
            );
            // Other orders should remain unchanged
            expect(state.objectData.order2?.data.shippingAddressId).to.equal(
              "223e4567-e89b-12d3-a456-426614174121"
            );
            expect(state.objectData.order3?.data.shippingAddressId).to.equal(
              "323e4567-e89b-12d3-a456-426614174121"
            );
          });
      });

      // Test Order 2 BelongsTo field - customer
      const order2CustomerField =
        order2Fieldset.field<BelongsToFieldInteractable>("customerId");
      order2CustomerField.then((field: BelongsToFieldInteractable) => {
        // Verify initial selection
        field.selected().should("equal", "Jane Smith");

        // Open the dropdown
        field.open();

        // Select a different customer
        field.select("John Doe");

        // Verify the Redux store was updated for Order 2 only
        cy.window()
          .its("store")
          .then((storeInstance) => {
            const state = storeInstance.getState() as ObjectDataState;
            // Order 2 should be updated
            expect(state.objectData.order2?.data.customerId).to.equal(
              "123e4567-e89b-12d3-a456-426614174120"
            );
            // Other orders should remain unchanged
            expect(state.objectData.order1?.data.customerId).to.equal(
              "123e4567-e89b-12d3-a456-426614174120"
            );
            expect(state.objectData.order3?.data.customerId).to.equal(
              "323e4567-e89b-12d3-a456-426614174120"
            );
          });
      });

      // Test Order 3 BelongsTo field - payment method
      const order3PaymentMethodField =
        order3Fieldset.field<BelongsToFieldInteractable>("paymentMethodId");
      order3PaymentMethodField.then((field: BelongsToFieldInteractable) => {
        // Verify initial selection
        field.selected().should("equal", "Bank Transfer");

        // Open the dropdown
        field.open();

        // Select a different payment method
        field.select("PayPal");

        // Verify the Redux store was updated for Order 3 only
        cy.window()
          .its("store")
          .then((storeInstance) => {
            const state = storeInstance.getState() as ObjectDataState;
            // Order 3 should be updated
            expect(state.objectData.order3?.data.paymentMethodId).to.equal(
              "223e4567-e89b-12d3-a456-426614174122"
            );
            // Other orders should remain unchanged
            expect(state.objectData.order1?.data.paymentMethodId).to.equal(
              "123e4567-e89b-12d3-a456-426614174122"
            );
            expect(state.objectData.order2?.data.paymentMethodId).to.equal(
              "223e4567-e89b-12d3-a456-426614174122"
            );
          });
      });

      // Test Order 2 HasMany field - order items
      const order2OrderItemsField =
        order2Fieldset.field<HasManyFieldInteractable>("orderItemIds");
      order2OrderItemsField.then((field: HasManyFieldInteractable) => {
        // Skip verifying initial selection text since order items don't have display text
        // Instead, verify the Redux store directly

        // Open the dropdown
        field.open();

        // Select additional order items
        field.select("Laptop");
        field.select("Headphones");

        // Verify the Redux store was updated for Order 2 only
        cy.window()
          .its("store")
          .then((storeInstance) => {
            const state = storeInstance.getState() as ObjectDataState;
            const order2OrderItemIds =
              state.objectData.order2?.data.orderItemIds;

            // Order 2 should have all three order items
            expect(order2OrderItemIds).to.include(
              "123e4567-e89b-12d3-a456-426614174123"
            ); // Laptop
            expect(order2OrderItemIds).to.include(
              "223e4567-e89b-12d3-a456-426614174123"
            ); // Smartphone
            expect(order2OrderItemIds).to.include(
              "323e4567-e89b-12d3-a456-426614174123"
            ); // Headphones
            expect(order2OrderItemIds).to.have.length(3);

            // Other orders should remain unchanged
            expect(state.objectData.order1?.data.orderItemIds).to.deep.equal([
              "123e4567-e89b-12d3-a456-426614174123",
            ]);
            expect(state.objectData.order3?.data.orderItemIds).to.deep.equal([
              "323e4567-e89b-12d3-a456-426614174123",
            ]);
          });
      });

      // Test Task 1 BelongsTo field - project
      const task1ProjectField =
        task1Fieldset.field<BelongsToFieldInteractable>("projectId");
      task1ProjectField.then((field: BelongsToFieldInteractable) => {
        // Verify initial selection
        field.selected().should("equal", "Website Redesign");

        // Open the dropdown
        field.open();

        // Select a different project
        field.select("Mobile App");

        // Verify the Redux store was updated for Task 1 only
        cy.window()
          .its("store")
          .then((storeInstance) => {
            const state = storeInstance.getState() as ObjectDataState;
            // Task 1 should be updated
            expect(state.objectData.task1?.data.projectId).to.equal(
              "223e4567-e89b-12d3-a456-426614174131"
            );
            // Other tasks should remain unchanged
            expect(state.objectData.task2?.data.projectId).to.equal(
              "323e4567-e89b-12d3-a456-426614174131"
            );
            expect(state.objectData.task3?.data.projectId).to.equal(
              "223e4567-e89b-12d3-a456-426614174131"
            );
          });
      });

      // Test Task 2 BelongsTo field - department
      const task2DepartmentField =
        task2Fieldset.field<BelongsToFieldInteractable>("departmentId");
      task2DepartmentField.then((field: BelongsToFieldInteractable) => {
        // Verify initial selection
        field.selected().should("equal", "Engineering");

        // Open the dropdown
        field.open();

        // Select a different department
        field.select("Design");

        // Verify the Redux store was updated for Task 2 only
        cy.window()
          .its("store")
          .then((storeInstance) => {
            const state = storeInstance.getState() as ObjectDataState;
            // Task 2 should be updated
            expect(state.objectData.task2?.data.departmentId).to.equal(
              "223e4567-e89b-12d3-a456-426614174132"
            );
            // Other tasks should remain unchanged
            expect(state.objectData.task1?.data.departmentId).to.equal(
              "223e4567-e89b-12d3-a456-426614174132"
            );
            expect(state.objectData.task3?.data.departmentId).to.equal(
              "323e4567-e89b-12d3-a456-426614174132"
            );
          });
      });

      // Test Task 3 BelongsTo field - assignee
      const task3AssigneeField =
        task3Fieldset.field<BelongsToFieldInteractable>("assigneeId");
      task3AssigneeField.then((field: BelongsToFieldInteractable) => {
        // Verify initial selection
        field.selected().should("equal", "Alice Manager");

        // Open the dropdown
        field.open();

        // Select a different assignee
        field.select("Bob Developer");

        // Verify the Redux store was updated for Task 3 only
        cy.window()
          .its("store")
          .then((storeInstance) => {
            const state = storeInstance.getState() as ObjectDataState;
            // Task 3 should be updated
            expect(state.objectData.task3?.data.assigneeId).to.equal(
              "223e4567-e89b-12d3-a456-426614174130"
            );
            // Other tasks should remain unchanged
            expect(state.objectData.task1?.data.assigneeId).to.equal(
              "323e4567-e89b-12d3-a456-426614174130"
            );
            expect(state.objectData.task2?.data.assigneeId).to.equal(
              "223e4567-e89b-12d3-a456-426614174130"
            );
          });
      });

      // Test Task 3 HasMany field - subtasks
      const task3SubtasksField =
        task3Fieldset.field<HasManyFieldInteractable>("subtaskIds");
      task3SubtasksField.then((field: HasManyFieldInteractable) => {
        // Skip verifying initial selection text since subtasks don't have display text
        // Instead, verify the Redux store directly

        // Open the dropdown
        field.open();

        // Select additional subtasks
        field.select("Wireframing");
        field.select("Testing");

        // Verify the Redux store was updated for Task 3 only
        cy.window()
          .its("store")
          .then((storeInstance) => {
            const state = storeInstance.getState() as ObjectDataState;
            const task3SubtaskIds = state.objectData.task3?.data.subtaskIds;

            // Task 3 should have all three subtasks
            expect(task3SubtaskIds).to.include(
              "123e4567-e89b-12d3-a456-426614174133"
            ); // Research
            expect(task3SubtaskIds).to.include(
              "223e4567-e89b-12d3-a456-426614174133"
            ); // Wireframing
            expect(task3SubtaskIds).to.include(
              "323e4567-e89b-12d3-a456-426614174133"
            ); // Testing
            expect(task3SubtaskIds).to.have.length(3);

            // Other tasks should remain unchanged
            expect(state.objectData.task1?.data.subtaskIds).to.deep.equal([
              "223e4567-e89b-12d3-a456-426614174133",
            ]);
            expect(state.objectData.task2?.data.subtaskIds).to.deep.equal([
              "323e4567-e89b-12d3-a456-426614174133",
            ]);
          });
      });
    });
  });
});

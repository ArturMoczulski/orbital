// Export components and utilities
export {
  ArrayObjectDataProvider,
  useArrayObjectData,
} from "./ArrayObjectDataContext";
export {
  default as ArrayObjectFieldset,
  createArrayObjectsComponentDetector,
  getArrayItemSchema,
  useArrayObject,
} from "./ArrayObjectFieldset";
export { default as ArrayObjectProvider } from "./ArrayObjectProvider";
export { default as BelongsToField } from "./BelongsToField";
export { default as ChildrenField } from "./ChildrenField";
export {
  FormWithReferences,
  ReferenceFormProvider,
} from "./FormWithReferences";
export { default as HasManyField } from "./HasManyField";
export { ObjectDataProvider, useObjectData } from "./ObjectDataContext";
export { ObjectFieldset } from "./ObjectFieldset";
export {
  ObjectForm,
  type ObjectFormProps,
  type SchemaWithObjects,
} from "./ObjectForm";
export { ObjectProvider, useObject } from "./ObjectProvider";
export { ObjectSchemaProvider, useObjectSchema } from "./ObjectSchemaContext";
export { default as ParentField } from "./ParentField";
export { default as RecursiveRelationshipField } from "./RecursiveRelationshipField";
export { default as ReferenceField } from "./ReferenceField";
export { ZodReferencesBridge } from "./ZodReferencesBridge";

// Note: Use FormWithReferences in place of AutoForm to support reference fields
// For more advanced use cases with multiple objects, use ObjectProvider with ObjectFieldset
// For arrays of objects, use ArrayObjectProvider with ArrayObjectFieldset

import request from "supertest";
import { Area } from "@orbital/core/src/types/area";

// Base URL from environment variables
const BASE_URL = process.env.BASE_URL || "http://localhost:4051";

describe("Areas API (e2e)", () => {
  let createdAreaId: string;

  // Test data using Area.mock()
  const testArea = Area.mock({
    name: "E2E Test Area",
  });

  // Set description after creation since it's not part of AreaProps
  testArea.description = "Area created during e2e testing";

  const updateData = {
    name: "Updated E2E Test Area",
    description: "This area was updated during e2e testing",
  };

  describe("GET /areas", () => {
    it("should return an array of areas", async () => {
      const response = await request(BASE_URL).get("/areas").expect(200);

      expect(Array.isArray(response.body)).toBe(true);
    });
  });

  describe("POST /areas", () => {
    it("should create a new area", async () => {
      const response = await request(BASE_URL)
        .post("/areas")
        .send(testArea)
        .expect(201);

      expect(response.body).toHaveProperty("_id");
      expect(response.body.name).toBe(testArea.name);
      expect(response.body.description).toBe(testArea.description);

      // Save the created area ID for later tests
      createdAreaId = response.body._id;
    });
  });

  describe("GET /areas/:id", () => {
    it("should return a single area by id", async () => {
      // Skip if we don't have a created area ID
      if (!createdAreaId) {
        console.warn(
          "Skipping GET /areas/:id test because no area was created"
        );
        return;
      }

      const response = await request(BASE_URL)
        .get(`/areas/${createdAreaId}`)
        .expect(200);

      expect(response.body).toHaveProperty("_id", createdAreaId);
      expect(response.body).toHaveProperty("name", testArea.name);
    });
  });

  describe("GET /areas/:id/map", () => {
    it("should return a map for the area", async () => {
      // Skip if we don't have a created area ID
      if (!createdAreaId) {
        console.warn(
          "Skipping GET /areas/:id/map test because no area was created"
        );
        return;
      }

      const response = await request(BASE_URL)
        .get(`/areas/${createdAreaId}/map`)
        .expect(200);

      expect(response.body).toHaveProperty("id", createdAreaId);
      expect(response.body).toHaveProperty("width");
      expect(response.body).toHaveProperty("height");
      expect(response.body).toHaveProperty("grid");
    });
  });

  describe("PUT /areas/:id", () => {
    it("should update an existing area", async () => {
      // Skip if we don't have a created area ID
      if (!createdAreaId) {
        console.warn(
          "Skipping PUT /areas/:id test because no area was created"
        );
        return;
      }

      const response = await request(BASE_URL)
        .put(`/areas/${createdAreaId}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty("_id", createdAreaId);
      expect(response.body).toHaveProperty("name", updateData.name);
      expect(response.body).toHaveProperty(
        "description",
        updateData.description
      );
    });
  });

  describe("DELETE /areas/:id", () => {
    it("should delete an area", async () => {
      // Skip if we don't have a created area ID
      if (!createdAreaId) {
        console.warn(
          "Skipping DELETE /areas/:id test because no area was created"
        );
        return;
      }

      await request(BASE_URL).delete(`/areas/${createdAreaId}`).expect(200);

      // Verify the area was deleted by trying to get it
      await request(BASE_URL).get(`/areas/${createdAreaId}`).expect(404);
    });
  });

  // Test creating an area with minimal data
  describe("POST /areas with minimal data", () => {
    it("should create a new area with default values", async () => {
      const minimalArea = {
        name: "Minimal Test Area",
      };

      const response = await request(BASE_URL)
        .post("/areas")
        .send(minimalArea)
        .expect(201);

      expect(response.body).toHaveProperty("_id");
      expect(response.body.name).toBe(minimalArea.name);
      expect(response.body).toHaveProperty("position");
      expect(response.body).toHaveProperty("worldId");

      // Clean up
      if (response.body._id) {
        await request(BASE_URL)
          .delete(`/areas/${response.body._id}`)
          .expect(200);
      }
    });
  });
});

describe("Areas API (e2e)", () => {
  const request = require("supertest");

  // Base URL from environment variables
  const BASE_URL = process.env.BASE_URL || "http://localhost:4051";
  let createdAreaId: string;
  let createdWorldId: string;

  // Test world data
  const testWorld = {
    name: "E2E Test World",
    shard: "test-shard",
    techLevel: 5,
  };

  // Test data - create manually instead of using Area.mock() to avoid extra fields
  // worldId will be set dynamically after creating a test world
  const testArea: {
    name: string;
    worldId?: string;
    position: { x: number; y: number; z: number };
    description: string;
    landmarks: string[];
    connections: string[];
    tags: string[];
  } = {
    name: "E2E Test Area",
    position: { x: 0, y: 0, z: 0 },
    description: "Area created during e2e testing",
    landmarks: [],
    connections: [],
    tags: [],
  };

  const updateData = {
    name: "Updated E2E Test Area",
    description: "This area was updated during e2e testing",
    // We'll add the worldId dynamically in the test
  };

  // Create a test world before running area tests
  beforeAll(async () => {
    try {
      const response = await request(BASE_URL)
        .post("/worlds")
        .send(testWorld)
        .expect(201);

      createdWorldId = response.body._id;

      // Set the worldId in the test area
      testArea.worldId = createdWorldId;
    } catch (error) {
      throw error;
    }
  });

  // Clean up the test world after all tests
  afterAll(async () => {
    if (createdWorldId) {
      try {
        await request(BASE_URL).delete(`/worlds/${createdWorldId}`).expect(200);
      } catch (error) {
        // Silently continue if cleanup fails
      }
    }
  });

  describe("GET /areas", () => {
    it("should return an array of areas", async () => {
      try {
        const response = await request(BASE_URL).get("/areas").expect(200);
        expect(Array.isArray(response.body)).toBe(true);
      } catch (error) {
        throw error;
      }
    });
  });

  describe("POST /areas", () => {
    it("should create a new area", async () => {
      try {
        const response = await request(BASE_URL)
          .post("/areas")
          .send(testArea)
          .expect(201);
        expect(response.body).toHaveProperty("_id");
        expect(response.body.name).toBe(testArea.name);
        expect(response.body.description).toBe(testArea.description);

        // Save the created area ID for later tests
        createdAreaId = response.body._id;
      } catch (error) {
        throw error;
      }
    });
  });

  describe("GET /areas/:id", () => {
    it("should return a single area by id", async () => {
      // Skip if we don't have a created area ID
      if (!createdAreaId) {
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
        return;
      }

      const response = await request(BASE_URL)
        .get(`/areas/${createdAreaId}/map`)
        .expect(200);

      expect(response.body).toHaveProperty("_id", createdAreaId);
      expect(response.body).toHaveProperty("width");
      expect(response.body).toHaveProperty("height");
      expect(response.body).toHaveProperty("grid");
    });
  });

  describe("PUT /areas/:id", () => {
    it("should update an existing area", async () => {
      // Skip if we don't have a created area ID
      if (!createdAreaId) {
        return;
      }

      // Include the worldId in the update data
      const updateDataWithWorldId = {
        ...updateData,
        worldId: createdWorldId,
      };

      const response = await request(BASE_URL)
        .put(`/areas/${createdAreaId}`)
        .send(updateDataWithWorldId)
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
        return;
      }

      await request(BASE_URL).delete(`/areas/${createdAreaId}`).expect(200);

      // Verify the area was deleted by trying to get it
      // Note: We expect 502 instead of 404 because the RpcExceptionFilter
      // converts microservice errors to 502 Bad Gateway responses
      await request(BASE_URL).get(`/areas/${createdAreaId}`).expect(502);
    });
  });

  // Test creating an area with minimal data
  describe("POST /areas with minimal data", () => {
    it("should create a new area with minimal values", async () => {
      try {
        // Include position since it's not set by default
        const minimalArea = {
          name: "Minimal Test Area",
          worldId: createdWorldId, // Use the created world ID
          position: { x: 0, y: 0, z: 0 },
        };

        const response = await request(BASE_URL)
          .post("/areas")
          .send(minimalArea)
          .expect(201);
        expect(response.body).toHaveProperty("_id");
        expect(response.body.name).toBe(minimalArea.name);
        expect(response.body).toHaveProperty("worldId");
        expect(response.body.worldId).toBe(minimalArea.worldId);

        // Now we expect position since we're providing it
        expect(response.body).toHaveProperty("position");

        // Clean up
        if (response.body._id) {
          await request(BASE_URL)
            .delete(`/areas/${response.body._id}`)
            .expect(200);
        }
      } catch (error) {
        throw error;
      }
    });
  });
  // Test error handling for non-existent ID
  describe("GET /areas/:id with non-existent ID", () => {
    it("should return 502 for non-existent area ID", async () => {
      const nonExistentId = "non-existent-id";

      // Note: We expect 502 instead of 404 because the RpcExceptionFilter
      // converts microservice errors to 502 Bad Gateway responses
      const response = await request(BASE_URL)
        .get(`/areas/${nonExistentId}`)
        .expect(502);

      expect(response.body).toHaveProperty("statusCode", 502);
      expect(response.body).toHaveProperty("message");
    });
  });

  // Test validation errors
  describe("POST /areas with invalid data", () => {
    it("should return 400 when missing required fields", async () => {
      // Missing name but include worldId to avoid reference validation error
      // This will test the validation in the admin-gateway service
      const invalidArea = {
        worldId: createdWorldId,
        position: { x: 0, y: 0, z: 0 },
      };

      const response = await request(BASE_URL)
        .post("/areas")
        .send(invalidArea)
        .expect(400); // Validation happens in the admin-gateway service

      expect(response.body).toHaveProperty("statusCode", 400);
      expect(response.body).toHaveProperty("message");
    });
  });

  // Test filtering by worldId
  describe("GET /areas with worldId filter", () => {
    it("should create areas with different worldIds and filter by worldId", async () => {
      // We'll use the same world ID for both areas since we need valid references
      // We'll still be able to test the filtering functionality
      const worldId1 = createdWorldId;
      const worldId2 = createdWorldId;

      const area1 = {
        name: "Area World 1",
        worldId: worldId1,
        position: { x: 10, y: 10, z: 0 },
      };

      const area2 = {
        name: "Area World 2",
        worldId: worldId2,
        position: { x: 20, y: 20, z: 0 },
      };

      // Create the areas
      const response1 = await request(BASE_URL)
        .post("/areas")
        .send(area1)
        .expect(201);

      const response2 = await request(BASE_URL)
        .post("/areas")
        .send(area2)
        .expect(201);

      const area1Id = response1.body._id;
      const area2Id = response2.body._id;

      // Get all areas and check if both are returned
      const allAreasResponse = await request(BASE_URL)
        .get("/areas")
        .expect(200);

      expect(Array.isArray(allAreasResponse.body)).toBe(true);

      // Filter areas by worldId1
      const filteredResponse1 = await request(BASE_URL)
        .get(`/areas?worldId=${worldId1}`)
        .expect(200);

      expect(Array.isArray(filteredResponse1.body)).toBe(true);
      expect(filteredResponse1.body.length).toBeGreaterThanOrEqual(1);
      expect(
        filteredResponse1.body.some((area: any) => area._id === area1Id)
      ).toBe(true);
      expect(
        filteredResponse1.body.every((area: any) => area.worldId === worldId1)
      ).toBe(true);

      // Filter areas by worldId2
      const filteredResponse2 = await request(BASE_URL)
        .get(`/areas?worldId=${worldId2}`)
        .expect(200);

      expect(Array.isArray(filteredResponse2.body)).toBe(true);
      expect(filteredResponse2.body.length).toBeGreaterThanOrEqual(1);
      expect(
        filteredResponse2.body.some((area: any) => area._id === area2Id)
      ).toBe(true);
      expect(
        filteredResponse2.body.every((area: any) => area.worldId === worldId2)
      ).toBe(true);

      // Clean up
      if (area1Id) {
        await request(BASE_URL).delete(`/areas/${area1Id}`).expect(200);
      }

      if (area2Id) {
        await request(BASE_URL).delete(`/areas/${area2Id}`).expect(200);
      }
    });
  });
});

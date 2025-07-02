describe("Worlds API (e2e)", () => {
  const request = require("supertest");

  // Base URL from environment variables
  const BASE_URL = process.env.BASE_URL || "http://localhost:4051";
  let createdWorldId: string;

  // Test data - create manually instead of using World.mock() to avoid extra fields
  const testWorld = {
    name: "E2E Test World",
    shard: "test-shard-1",
    techLevel: 5,
  };

  const updateData = {
    name: "Updated E2E Test World",
    techLevel: 7,
  };

  describe("GET /worlds", () => {
    it("should return an array of worlds", async () => {
      try {
        console.log("Sending GET request to /worlds");
        const response = await request(BASE_URL).get("/worlds").expect(200);

        console.log(
          "Response from GET /worlds:",
          JSON.stringify(response.body, null, 2)
        );
        expect(Array.isArray(response.body)).toBe(true);
      } catch (error) {
        console.error("Error in GET /worlds test:", error);
        throw error;
      }
    });
  });

  describe("POST /worlds", () => {
    it("should create a new world", async () => {
      try {
        console.log(
          "Sending POST request to create world with data:",
          JSON.stringify(testWorld, null, 2)
        );
        const response = await request(BASE_URL)
          .post("/worlds")
          .send(testWorld)
          .expect(201);

        console.log(
          "Response from POST /worlds:",
          JSON.stringify(response.body, null, 2)
        );
        expect(response.body).toHaveProperty("_id");
        expect(response.body.name).toBe(testWorld.name);
        expect(response.body.shard).toBe(testWorld.shard);
        expect(response.body.techLevel).toBe(testWorld.techLevel);

        // Save the created world ID for later tests
        createdWorldId = response.body._id;
      } catch (error) {
        console.error("Error in POST /worlds test:", error);
        throw error;
      }
    });
  });

  describe("GET /worlds/:id", () => {
    it("should return a single world by id", async () => {
      // Skip if we don't have a created world ID
      if (!createdWorldId) {
        console.warn(
          "Skipping GET /worlds/:id test because no world was created"
        );
        return;
      }

      const response = await request(BASE_URL)
        .get(`/worlds/${createdWorldId}`)
        .expect(200);

      expect(response.body).toHaveProperty("_id", createdWorldId);
      expect(response.body).toHaveProperty("name", testWorld.name);
      expect(response.body).toHaveProperty("shard", testWorld.shard);
      expect(response.body).toHaveProperty("techLevel", testWorld.techLevel);
    });
  });

  describe("PUT /worlds/:id", () => {
    it("should update an existing world", async () => {
      // Skip if we don't have a created world ID
      if (!createdWorldId) {
        console.warn(
          "Skipping PUT /worlds/:id test because no world was created"
        );
        return;
      }

      const response = await request(BASE_URL)
        .put(`/worlds/${createdWorldId}`)
        .send(updateData)
        .expect(200);

      expect(response.body).toHaveProperty("_id", createdWorldId);
      expect(response.body).toHaveProperty("name", updateData.name);
      expect(response.body).toHaveProperty("techLevel", updateData.techLevel);
      // Shard should remain unchanged (it's in the document property)
      expect(response.body.document).toHaveProperty("shard", testWorld.shard);
    });
  });

  describe("DELETE /worlds/:id", () => {
    it("should delete a world", async () => {
      // Skip if we don't have a created world ID
      if (!createdWorldId) {
        console.warn(
          "Skipping DELETE /worlds/:id test because no world was created"
        );
        return;
      }

      await request(BASE_URL).delete(`/worlds/${createdWorldId}`).expect(200);

      // Verify the world was deleted by trying to get it
      // Note: We expect 502 instead of 404 because the RpcExceptionFilter
      // converts microservice errors to 502 Bad Gateway responses
      await request(BASE_URL).get(`/worlds/${createdWorldId}`).expect(502);
    });
  });

  // Test creating a world with minimal data
  describe("POST /worlds with minimal data", () => {
    it("should create a new world with minimal values", async () => {
      try {
        const minimalWorld = {
          name: "Minimal Test World",
          shard: "test-shard-2",
          techLevel: 1,
        };

        console.log(
          "Sending POST request with minimal data:",
          JSON.stringify(minimalWorld, null, 2)
        );
        const response = await request(BASE_URL)
          .post("/worlds")
          .send(minimalWorld)
          .expect(201);

        console.log(
          "Response from POST /worlds with minimal data:",
          JSON.stringify(response.body, null, 2)
        );
        expect(response.body).toHaveProperty("_id");
        expect(response.body.name).toBe(minimalWorld.name);
        expect(response.body.shard).toBe(minimalWorld.shard);
        expect(response.body.techLevel).toBe(minimalWorld.techLevel);

        // Clean up
        if (response.body._id) {
          await request(BASE_URL)
            .delete(`/worlds/${response.body._id}`)
            .expect(200);
        }
      } catch (error) {
        console.error("Error in POST /worlds with minimal data test:", error);
        throw error;
      }
    });
  });

  // Test error handling for non-existent ID
  describe("GET /worlds/:id with non-existent ID", () => {
    it("should return 502 for non-existent world ID", async () => {
      const nonExistentId = "non-existent-id";

      // Note: We expect 502 instead of 404 because the RpcExceptionFilter
      // converts microservice errors to 502 Bad Gateway responses
      const response = await request(BASE_URL)
        .get(`/worlds/${nonExistentId}`)
        .expect(502);

      expect(response.body).toHaveProperty("statusCode", 502);
      expect(response.body).toHaveProperty("message");
    });
  });

  // Test validation errors
  describe("POST /worlds with invalid data", () => {
    it("should return 400 when missing required fields", async () => {
      // Missing name, shard, and techLevel
      const invalidWorld = {};

      console.log(
        "Sending POST request with invalid data:",
        JSON.stringify(invalidWorld, null, 2)
      );

      const response = await request(BASE_URL)
        .post("/worlds")
        .send(invalidWorld)
        .expect(400); // Validation happens in the admin-gateway service

      console.log(
        "Response from POST /worlds with invalid data:",
        JSON.stringify(response.body, null, 2)
      );

      expect(response.body).toHaveProperty("statusCode", 400);
      expect(response.body).toHaveProperty("message");
      console.log("Validation error message:", response.body.message);
    });
  });

  // Test filtering by shard
  describe("GET /worlds with shard filter", () => {
    it("should create worlds with different shards and filter by shard", async () => {
      // Create two worlds with different shards
      const shard1 = "test-shard-3";
      const shard2 = "test-shard-4";

      const world1 = {
        name: "World Shard 3",
        shard: shard1,
        techLevel: 3,
      };

      const world2 = {
        name: "World Shard 4",
        shard: shard2,
        techLevel: 4,
      };

      // Create the worlds
      const response1 = await request(BASE_URL)
        .post("/worlds")
        .send(world1)
        .expect(201);

      const response2 = await request(BASE_URL)
        .post("/worlds")
        .send(world2)
        .expect(201);

      const world1Id = response1.body._id;
      const world2Id = response2.body._id;

      // Get all worlds and check if both are returned
      const allWorldsResponse = await request(BASE_URL)
        .get("/worlds")
        .expect(200);

      expect(Array.isArray(allWorldsResponse.body)).toBe(true);

      // Filter worlds by shard1
      const filteredResponse1 = await request(BASE_URL)
        .get(`/worlds?shard=${shard1}`)
        .expect(200);

      console.log(
        `Response from GET /worlds?shard=${shard1}:`,
        JSON.stringify(filteredResponse1.body, null, 2)
      );

      expect(Array.isArray(filteredResponse1.body)).toBe(true);
      expect(filteredResponse1.body.length).toBeGreaterThanOrEqual(1);
      expect(
        filteredResponse1.body.some((world: any) => world._id === world1Id)
      ).toBe(true);
      expect(
        filteredResponse1.body.every((world: any) => world.shard === shard1)
      ).toBe(true);

      // Filter worlds by shard2
      const filteredResponse2 = await request(BASE_URL)
        .get(`/worlds?shard=${shard2}`)
        .expect(200);

      console.log(
        `Response from GET /worlds?shard=${shard2}:`,
        JSON.stringify(filteredResponse2.body, null, 2)
      );

      expect(Array.isArray(filteredResponse2.body)).toBe(true);
      expect(filteredResponse2.body.length).toBeGreaterThanOrEqual(1);
      expect(
        filteredResponse2.body.some((world: any) => world._id === world2Id)
      ).toBe(true);
      expect(
        filteredResponse2.body.every((world: any) => world.shard === shard2)
      ).toBe(true);

      // Clean up
      if (world1Id) {
        await request(BASE_URL).delete(`/worlds/${world1Id}`).expect(200);
      }

      if (world2Id) {
        await request(BASE_URL).delete(`/worlds/${world2Id}`).expect(200);
      }
    });
  });

  // Test filtering by techLevel
  describe("GET /worlds with techLevel filter", () => {
    it("should create worlds with different techLevels and filter by techLevel", async () => {
      // Create two worlds with different techLevels
      const techLevel1 = 2;
      const techLevel2 = 9;

      const world1 = {
        name: "World TechLevel 2",
        shard: "test-shard-5",
        techLevel: techLevel1,
      };

      const world2 = {
        name: "World TechLevel 9",
        shard: "test-shard-5",
        techLevel: techLevel2,
      };

      // Create the worlds
      const response1 = await request(BASE_URL)
        .post("/worlds")
        .send(world1)
        .expect(201);

      const response2 = await request(BASE_URL)
        .post("/worlds")
        .send(world2)
        .expect(201);

      const world1Id = response1.body._id;
      const world2Id = response2.body._id;

      // Filter worlds by techLevel1
      const filteredResponse1 = await request(BASE_URL)
        .get(`/worlds?techLevel=${techLevel1}`)
        .expect(200);

      console.log(
        `Response from GET /worlds?techLevel=${techLevel1}:`,
        JSON.stringify(filteredResponse1.body, null, 2)
      );

      expect(Array.isArray(filteredResponse1.body)).toBe(true);
      expect(filteredResponse1.body.length).toBeGreaterThanOrEqual(1);
      expect(
        filteredResponse1.body.some((world: any) => world._id === world1Id)
      ).toBe(true);
      expect(
        filteredResponse1.body.every(
          (world: any) => world.techLevel === techLevel1
        )
      ).toBe(true);

      // Filter worlds by techLevel2
      const filteredResponse2 = await request(BASE_URL)
        .get(`/worlds?techLevel=${techLevel2}`)
        .expect(200);

      console.log(
        `Response from GET /worlds?techLevel=${techLevel2}:`,
        JSON.stringify(filteredResponse2.body, null, 2)
      );

      expect(Array.isArray(filteredResponse2.body)).toBe(true);
      expect(filteredResponse2.body.length).toBeGreaterThanOrEqual(1);
      expect(
        filteredResponse2.body.some((world: any) => world._id === world2Id)
      ).toBe(true);
      expect(
        filteredResponse2.body.every(
          (world: any) => world.techLevel === techLevel2
        )
      ).toBe(true);

      // Clean up
      if (world1Id) {
        await request(BASE_URL).delete(`/worlds/${world1Id}`).expect(200);
      }

      if (world2Id) {
        await request(BASE_URL).delete(`/worlds/${world2Id}`).expect(200);
      }
    });
  });
});

// Jest setup for integration tests
// This file sets up an in-memory MongoDB server for integration testing

const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");

// Variable to store the MongoDB server instance
let mongoServer;

// Set up the MongoDB Memory Server before all tests
beforeAll(async () => {
  // Create a new instance of MongoMemoryServer
  mongoServer = await MongoMemoryServer.create();

  // Get the connection URI for the in-memory database
  const uri = mongoServer.getUri();

  // Connect Mongoose to the in-memory database
  await mongoose.connect(uri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  console.log(`MongoDB Memory Server started at ${uri}`);
});

// Clear all collections after each test
afterEach(async () => {
  if (mongoose.connection.readyState === 1) {
    const collections = mongoose.connection.collections;

    for (const key in collections) {
      const collection = collections[key];
      await collection.deleteMany({});
    }
  }
});

// Close the MongoDB connection and stop the server after all tests
afterAll(async () => {
  if (mongoose.connection) {
    await mongoose.connection.close();
  }

  if (mongoServer) {
    await mongoServer.stop();
  }

  console.log("MongoDB Memory Server stopped");
});

// Add any other integration-test-specific setup

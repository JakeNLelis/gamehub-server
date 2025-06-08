// Test setup and teardown configuration
const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let mongoServer;

// Setup test database before all tests
beforeAll(async () => {
  // Install mongodb-memory-server if not available
  try {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  } catch (error) {
    console.log("MongoDB Memory Server not available, using test database");
    // Fallback to test database
    const testUri =
      process.env.MONGODB_TEST_URI || "mongodb://localhost:27017/gamehub_test";
    await mongoose.connect(testUri, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
  }
});

// Clean up after each test
afterEach(async () => {
  const collections = mongoose.connection.collections;
  for (const key in collections) {
    const collection = collections[key];
    await collection.deleteMany({});
  }
});

// Cleanup after all tests
afterAll(async () => {
  await mongoose.connection.dropDatabase();
  await mongoose.connection.close();
  if (mongoServer) {
    await mongoServer.stop();
  }
});

// Global test timeout
jest.setTimeout(30000);

// Utility functions for creating test data with all required fields
const createTestGame = (overrides = {}) => ({
  externalId: Math.floor(Math.random() * 10000),
  title: "Test Game",
  thumbnail: "https://example.com/thumbnail.jpg",
  shortDescription: "A test game description",
  gameUrl: "https://example.com/game",
  genre: "Action",
  platform: "Web Browser",
  publisher: "Test Publisher",
  developer: "Test Developer",
  releaseDate: new Date("2023-01-01"),
  freetogameProfileUrl: "https://example.com/profile",
  averageRating: 0,
  totalReviews: 0,
  ...overrides,
});

const createTestUser = (overrides = {}) => ({
  googleId: "test123",
  email: "test@example.com",
  name: "Test User",
  ...overrides,
});

module.exports = {
  createTestGame,
  createTestUser,
};

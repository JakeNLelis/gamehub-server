const request = require("supertest");
const app = require("../src/app");
const User = require("../src/models/User");
const Game = require("../src/models/Game");
const jwt = require("jsonwebtoken");
const { createTestGame, createTestUser } = require("./setup");

describe("Game Endpoints", () => {
  let testUser;
  let authToken;
  let testGames;

  beforeEach(async () => {
    // Create test user
    testUser = new User(
      createTestUser({
        googleId: "test123",
        email: "test@example.com",
        name: "Test User",
      })
    );
    await testUser.save();

    // Generate auth token
    authToken = jwt.sign(
      { userId: testUser._id },
      process.env.JWT_SECRET || "test-secret",
      { expiresIn: "7d" }
    ); // Create test games
    testGames = await Game.insertMany([
      createTestGame({
        externalId: 1,
        title: "Test Game 1",
        shortDescription: "A test MMORPG game",
        genre: "MMORPG",
        platform: "PC (Windows)",
        thumbnail: "https://example.com/game1.jpg",
        gameUrl: "https://example.com/game1",
        averageRating: 4.5,
        totalReviews: 10,
      }),
      createTestGame({
        externalId: 2,
        title: "Test Game 2",
        shortDescription: "A test Strategy game",
        genre: "Strategy",
        platform: "PC (Windows)",
        thumbnail: "https://example.com/game2.jpg",
        gameUrl: "https://example.com/game2",
        averageRating: 3.8,
        totalReviews: 5,
      }),
      createTestGame({
        externalId: 3,
        title: "Browser Game",
        shortDescription: "A browser-based game",
        genre: "Action",
        platform: "Web Browser",
        thumbnail: "https://example.com/game3.jpg",
        gameUrl: "https://example.com/game3",
        averageRating: 0,
        totalReviews: 0,
      }),
    ]);
  });

  describe("GET /api/games", () => {
    it("should return all games with default pagination", async () => {
      const response = await request(app).get("/api/games").expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(3);
      expect(response.body.pagination).toHaveProperty("currentPage");
      expect(response.body.pagination).toHaveProperty("totalPages");
      expect(response.body.pagination).toHaveProperty("totalGames");
    });

    it("should filter games by genre", async () => {
      const response = await request(app)
        .get("/api/games?category=MMORPG")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].genre).toBe("MMORPG");
    });

    it("should filter games by platform", async () => {
      const response = await request(app)
        .get("/api/games?platform=browser")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].platform).toBe("Web Browser");
    });

    it("should sort games by rating", async () => {
      const response = await request(app)
        .get("/api/games?sort-by=rating")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data[0].averageRating).toBeGreaterThanOrEqual(
        response.body.data[1].averageRating
      );
    });

    it("should sort games alphabetically", async () => {
      const response = await request(app)
        .get("/api/games?sort-by=alphabetical")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(
        response.body.data[0].title.localeCompare(response.body.data[1].title)
      ).toBeLessThanOrEqual(0);
    });

    it("should search games by title", async () => {
      const response = await request(app)
        .get("/api/games?search=Browser")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toContain("Browser");
    });

    it("should handle pagination correctly", async () => {
      const response = await request(app)
        .get("/api/games?page=1&limit=2")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination.currentPage).toBe(1);
      expect(response.body.pagination.gamesPerPage).toBe(2);
    });
  });

  describe("GET /api/games/:id", () => {
    it("should return specific game by ID", async () => {
      const gameId = testGames[0]._id;
      const response = await request(app)
        .get(`/api/games/${gameId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(gameId.toString());
      expect(response.body.data.title).toBe("Test Game 1");
    });

    it("should return 404 for non-existent game", async () => {
      const fakeId = "507f1f77bcf86cd799439011";
      const response = await request(app)
        .get(`/api/games/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("not found");
    });

    it("should return 400 for invalid game ID format", async () => {
      const response = await request(app)
        .get("/api/games/invalid-id")
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Invalid");
    });
  });
  describe("GET /api/games/filters/metadata", () => {
    it("should return filter metadata", async () => {
      const response = await request(app)
        .get("/api/games/filters/metadata")
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty("categories");
      expect(response.body.data).toHaveProperty("platforms");
      expect(response.body.data).toHaveProperty("sortOptions");
      expect(response.body.data.categories).toBeInstanceOf(Array);
      expect(response.body.data.platforms).toBeInstanceOf(Array);
    });
  });
});

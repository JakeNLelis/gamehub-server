const request = require("supertest");
const app = require("../src/app");
const User = require("../src/models/User");
const Game = require("../src/models/Game");
const Favorite = require("../src/models/Favorite");
const jwt = require("jsonwebtoken");
const { createTestGame, createTestUser } = require("./setup");

describe("Favorite Endpoints", () => {
  let testUser;
  let otherUser;
  let authToken;
  let otherAuthToken;
  let testGames;

  beforeEach(async () => {
    // Create test users
    testUser = new User(
      createTestUser({
        googleId: "test123",
        email: "test@example.com",
        name: "Test User",
      })
    );
    await testUser.save();

    otherUser = new User(
      createTestUser({
        googleId: "other123",
        email: "other@example.com",
        name: "Other User",
      })
    );
    await otherUser.save();

    // Generate auth tokens
    authToken = jwt.sign(
      { userId: testUser._id },
      process.env.JWT_SECRET || "test-secret",
      { expiresIn: "7d" }
    );

    otherAuthToken = jwt.sign(
      { userId: otherUser._id },
      process.env.JWT_SECRET || "test-secret",
      { expiresIn: "7d" }
    );

    // Create test games with all required fields
    testGames = await Game.insertMany([
      createTestGame({
        externalId: 1,
        title: "Test Game 1",
        shortDescription: "A test game",
        genre: "Action",
        platform: "PC (Windows)",
        thumbnail: "https://example.com/game1.jpg",
        gameUrl: "https://example.com/game1",
      }),
      createTestGame({
        externalId: 2,
        title: "Test Game 2",
        shortDescription: "Another test game",
        genre: "Strategy",
        platform: "PC (Windows)",
        thumbnail: "https://example.com/game2.jpg",
        gameUrl: "https://example.com/game2",
      }),
    ]);
  });
  describe("POST /api/favorites/:gameId", () => {
    it("should add game to favorites when authenticated", async () => {
      const response = await request(app)
        .post(`/api/favorites/${testGames[0]._id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.userId).toBe(testUser._id.toString());
      expect(response.body.data.gameId._id).toBe(testGames[0]._id.toString());
      expect(response.body.message).toContain("added to favorites");
    });

    it("should return 400 when game is already in favorites", async () => {
      // Add game to favorites first
      await new Favorite({
        userId: testUser._id,
        gameId: testGames[0]._id,
      }).save();

      const response = await request(app)
        .post(`/api/favorites/${testGames[0]._id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("already in favorites");
    });
    it("should return 400 for invalid game ID", async () => {
      const response = await request(app)
        .post("/api/favorites/invalid-id")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Invalid");
    });

    it("should return 404 when game does not exist", async () => {
      const fakeGameId = "507f1f77bcf86cd799439011";
      const response = await request(app)
        .post(`/api/favorites/${fakeGameId}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Game not found");
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app)
        .post(`/api/favorites/${testGames[0]._id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/favorites", () => {
    beforeEach(async () => {
      // Add some favorites for test user
      await Favorite.insertMany([
        {
          userId: testUser._id,
          gameId: testGames[0]._id,
          createdAt: new Date("2023-01-01"),
        },
        {
          userId: testUser._id,
          gameId: testGames[1]._id,
          createdAt: new Date("2023-01-02"),
        },
      ]);

      // Add favorite for other user
      await new Favorite({
        userId: otherUser._id,
        gameId: testGames[0]._id,
      }).save();
    });

    it("should return user favorites when authenticated", async () => {
      const response = await request(app)
        .get("/api/favorites")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      expect(response.body.data[0].userId).toBe(testUser._id.toString());
      expect(response.body.data[1].userId).toBe(testUser._id.toString());
      // Should be sorted by newest first
      expect(
        new Date(response.body.data[0].createdAt).getTime()
      ).toBeGreaterThan(new Date(response.body.data[1].createdAt).getTime());
    });

    it("should filter favorites by genre", async () => {
      const response = await request(app)
        .get("/api/favorites?genre=Action")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].gameId.genre).toBe("Action");
    });

    it("should filter favorites by platform", async () => {
      const response = await request(app)
        .get("/api/favorites?platform=PC")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it("should handle pagination", async () => {
      const response = await request(app)
        .get("/api/favorites?page=1&limit=1")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.pagination.currentPage).toBe(1);
      expect(response.body.pagination.totalFavorites).toBe(2);
    });

    it("should return empty array when user has no favorites", async () => {
      const response = await request(app)
        .get("/api/favorites")
        .set("Authorization", `Bearer ${otherAuthToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1); // Other user has 1 favorite
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app).get("/api/favorites").expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe("DELETE /api/favorites/:gameId", () => {
    beforeEach(async () => {
      // Add favorite for test user
      await new Favorite({
        userId: testUser._id,
        gameId: testGames[0]._id,
      }).save();
    });

    it("should remove game from favorites when authenticated", async () => {
      const response = await request(app)
        .delete(`/api/favorites/${testGames[0]._id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain("removed from favorites");

      // Verify favorite is deleted
      const deletedFavorite = await Favorite.findOne({
        userId: testUser._id,
        gameId: testGames[0]._id,
      });
      expect(deletedFavorite).toBeNull();
    });

    it("should return 404 when game is not in favorites", async () => {
      const response = await request(app)
        .delete(`/api/favorites/${testGames[1]._id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("not found in favorites");
    });

    it("should return 400 for invalid game ID", async () => {
      const response = await request(app)
        .delete("/api/favorites/invalid-id")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Invalid");
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app)
        .delete(`/api/favorites/${testGames[0]._id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/favorites/check/:gameId", () => {
    beforeEach(async () => {
      // Add favorite for test user
      await new Favorite({
        userId: testUser._id,
        gameId: testGames[0]._id,
      }).save();
    });

    it("should return true when game is in favorites", async () => {
      const response = await request(app)
        .get(`/api/favorites/check/${testGames[0]._id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isFavorite).toBe(true);
    });

    it("should return false when game is not in favorites", async () => {
      const response = await request(app)
        .get(`/api/favorites/check/${testGames[1]._id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.isFavorite).toBe(false);
    });

    it("should return 400 for invalid game ID", async () => {
      const response = await request(app)
        .get("/api/favorites/check/invalid-id")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("Invalid");
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app)
        .get(`/api/favorites/check/${testGames[0]._id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});

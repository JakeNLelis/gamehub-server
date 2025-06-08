const request = require("supertest");
const app = require("../src/app");
const User = require("../src/models/User");
const Game = require("../src/models/Game");
const Review = require("../src/models/Review");
const jwt = require("jsonwebtoken");
const { createTestGame, createTestUser } = require("./setup");

describe("Review Endpoints", () => {
  let testUser;
  let otherUser;
  let authToken;
  let otherAuthToken;
  let testGame;

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
    ); // Create test game
    testGame = new Game(
      createTestGame({
        externalId: 1,
        title: "Test Game",
        shortDescription: "A test game",
        genre: "Action",
        platform: "PC (Windows)",
        thumbnail: "https://example.com/game.jpg",
        gameUrl: "https://example.com/game",
        averageRating: 0,
        totalReviews: 0,
      })
    );
    await testGame.save();
  });
  describe("POST /api/reviews/:gameId", () => {
    it("should create a new review when authenticated", async () => {
      const reviewData = {
        rating: 5,
        content: "This is an amazing game with great gameplay.",
      };

      const response = await request(app)
        .post(`/api/reviews/${testGame._id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(reviewData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.rating).toBe(5);
      expect(response.body.data.content).toBe(
        "This is an amazing game with great gameplay."
      );
      expect(response.body.data.userId).toBe(testUser._id.toString());
      expect(response.body.data.gameId).toBe(testGame._id.toString());

      // Verify game rating was updated
      const updatedGame = await Game.findById(testGame._id);
      expect(updatedGame.averageRating).toBe(5);
      expect(updatedGame.totalReviews).toBe(1);
    });
    it("should return 400 for invalid rating", async () => {
      const reviewData = {
        rating: 6, // Invalid rating
        content: "Test content",
      };

      const response = await request(app)
        .post(`/api/reviews/${testGame._id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(reviewData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("rating");
    });
    it("should return 400 for missing required fields", async () => {
      const reviewData = {
        // Missing rating, content
      };

      const response = await request(app)
        .post(`/api/reviews/${testGame._id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(reviewData)
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    it("should return 400 when user tries to review same game twice", async () => {
      // Create first review
      await new Review({
        userId: testUser._id,
        gameId: testGame._id,
        rating: 4,
        content: "First review content",
      }).save();

      const reviewData = {
        rating: 5,
        content: "Second review content",
      };

      const response = await request(app)
        .post(`/api/reviews/${testGame._id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(reviewData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("already reviewed");
    });
    it("should return 401 when not authenticated", async () => {
      const reviewData = {
        rating: 5,
        content: "Test content",
      };

      const response = await request(app)
        .post(`/api/reviews/${testGame._id}`)
        .send(reviewData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/reviews/game/:gameId", () => {
    beforeEach(async () => {
      // Create test reviews
      await Review.insertMany([
        {
          userId: testUser._id,
          gameId: testGame._id,
          rating: 5,
          content: "Amazing gameplay",
          createdAt: new Date("2023-01-01"),
        },
        {
          userId: otherUser._id,
          gameId: testGame._id,
          rating: 4,
          content: "Pretty good",
          createdAt: new Date("2023-01-02"),
        },
      ]);
    });

    it("should return game reviews with user review first when authenticated", async () => {
      const response = await request(app)
        .get(`/api/reviews/game/${testGame._id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
      // User's review should be first
      expect(response.body.data[0].userId._id).toBe(testUser._id.toString());
      expect(response.body.data[0].content).toBe("Amazing gameplay");
    });

    it("should return game reviews without authentication", async () => {
      const response = await request(app)
        .get(`/api/reviews/game/${testGame._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it("should return empty array for game with no reviews", async () => {
      const newGame = new Game({
        externalId: 2,
        title: "New Game",
        shortDescription: "A new game",
        genre: "RPG",
        platform: "PC (Windows)",
        thumbnail: "https://example.com/newgame.jpg",
        gameUrl: "https://example.com/newgame",
      });
      await newGame.save();

      const response = await request(app)
        .get(`/api/reviews/game/${newGame._id}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(0);
    });
  });

  describe("PUT /api/reviews/:id", () => {
    let testReview;
    beforeEach(async () => {
      testReview = new Review({
        userId: testUser._id,
        gameId: testGame._id,
        rating: 4,
        content: "Original content",
      });
      await testReview.save();
    });

    it("should update review when user owns it", async () => {
      const updateData = {
        rating: 5,
        content: "Updated content",
      };

      const response = await request(app)
        .put(`/api/reviews/${testReview._id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.rating).toBe(5);
      expect(response.body.data.content).toBe("Updated content");
      expect(response.body.data.content).toBe("Updated content");
    });
    it("should return 403 when user tries to update another user's review", async () => {
      const updateData = {
        rating: 5,
        content: "Hacked content",
      };

      const response = await request(app)
        .put(`/api/reviews/${testReview._id}`)
        .set("Authorization", `Bearer ${otherAuthToken}`)
        .send(updateData)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("not authorized");
    });

    it("should return 401 when not authenticated", async () => {
      const updateData = {
        rating: 5,
        content: "Updated content",
        content: "Updated content",
      };

      const response = await request(app)
        .put(`/api/reviews/${testReview._id}`)
        .send(updateData)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe("DELETE /api/reviews/:id", () => {
    let testReview;

    beforeEach(async () => {
      testReview = new Review({
        userId: testUser._id,
        gameId: testGame._id,
        rating: 4,
        content: "Test content",
      });
      await testReview.save();
    });

    it("should delete review when user owns it", async () => {
      const response = await request(app)
        .delete(`/api/reviews/${testReview._id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain("deleted");

      // Verify review is deleted
      const deletedReview = await Review.findById(testReview._id);
      expect(deletedReview).toBeNull();
    });

    it("should return 403 when user tries to delete another user's review", async () => {
      const response = await request(app)
        .delete(`/api/reviews/${testReview._id}`)
        .set("Authorization", `Bearer ${otherAuthToken}`)
        .expect(403);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("not authorized");
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app)
        .delete(`/api/reviews/${testReview._id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe("GET /api/reviews/user/:userId", () => {
    beforeEach(async () => {
      // Create multiple reviews for the user
      await Review.insertMany([
        {
          userId: testUser._id,
          gameId: testGame._id,
          rating: 5,
          content: "Amazing gameplay",
        },
      ]);
    });

    it("should return user reviews when authenticated", async () => {
      const response = await request(app)
        .get(`/api/reviews/user/${testUser._id}`)
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].userId._id).toBe(testUser._id.toString());
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app)
        .get(`/api/reviews/user/${testUser._id}`)
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});

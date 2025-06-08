const request = require("supertest");
const app = require("../src/app");
const User = require("../src/models/User");
const jwt = require("jsonwebtoken");
const { createTestUser } = require("./setup");

describe("Authentication Endpoints", () => {
  let testUser;
  let authToken;

  beforeEach(async () => {
    // Create a test user
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
    );
  });

  describe("GET /api/auth/profile", () => {
    it("should return user profile when authenticated", async () => {
      const response = await request(app)
        .get("/api/auth/profile")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.email).toBe(testUser.email);
      expect(response.body.data.name).toBe(testUser.name);
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app).get("/api/auth/profile").expect(401);

      expect(response.body.success).toBe(false);
      expect(response.body.error).toContain("token");
    });

    it("should return 401 with invalid token", async () => {
      const response = await request(app)
        .get("/api/auth/profile")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });

  describe("POST /api/auth/logout", () => {
    it("should logout successfully when authenticated", async () => {
      const response = await request(app)
        .post("/api/auth/logout")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain("logout");
    });
  });

  describe("DELETE /api/auth/delete-account", () => {
    it("should delete user account when authenticated", async () => {
      const response = await request(app)
        .delete("/api/auth/delete-account")
        .set("Authorization", `Bearer ${authToken}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.message).toContain("deleted");

      // Verify user is deleted
      const deletedUser = await User.findById(testUser._id);
      expect(deletedUser).toBeNull();
    });

    it("should return 401 when not authenticated", async () => {
      const response = await request(app)
        .delete("/api/auth/delete-account")
        .expect(401);

      expect(response.body.success).toBe(false);
    });
  });
});

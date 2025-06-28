import request from "supertest";
import { app } from "../src/server";
import { setupTestDB, cleanupTestDB } from "./setup";

describe("인증 API 테스트", () => {
  beforeAll(async () => {
    await setupTestDB();
  });

  afterAll(() => {
    cleanupTestDB();
  });

  describe("POST /api/signup", () => {
    it("멘토 회원가입이 성공적으로 완료되어야 한다", async () => {
      const userData = {
        email: "mentor@example.com",
        password: "password123",
        name: "김멘토",
        role: "mentor",
      };

      const response = await request(app)
        .post("/api/signup")
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty(
        "message",
        "User created successfully"
      );
    });

    it("멘티 회원가입이 성공적으로 완료되어야 한다", async () => {
      const userData = {
        email: "mentee@example.com",
        password: "password123",
        name: "이멘티",
        role: "mentee",
      };

      const response = await request(app)
        .post("/api/signup")
        .send(userData)
        .expect(201);

      expect(response.body).toHaveProperty(
        "message",
        "User created successfully"
      );
    });

    it("잘못된 요청 형식으로 회원가입 시 400 에러가 발생해야 한다", async () => {
      const invalidData = {
        email: "invalid-email",
        password: "123", // 너무 짧은 비밀번호
        name: "",
        role: "invalid-role",
      };

      await request(app).post("/api/signup").send(invalidData).expect(400);
    });

    it("이미 존재하는 이메일로 회원가입 시 400 에러가 발생해야 한다", async () => {
      const userData = {
        email: "duplicate@example.com",
        password: "password123",
        name: "중복유저",
        role: "mentor",
      };

      // 첫 번째 회원가입
      await request(app).post("/api/signup").send(userData).expect(201);

      // 동일한 이메일로 두 번째 회원가입 시도
      await request(app).post("/api/signup").send(userData).expect(400);
    });
  });

  describe("POST /api/login", () => {
    const testUser = {
      email: "login@example.com",
      password: "password123",
      name: "로그인테스트",
      role: "mentor",
    };

    beforeEach(async () => {
      // 테스트용 사용자 생성
      await request(app).post("/api/signup").send(testUser);
    });

    it("올바른 정보로 로그인이 성공해야 한다", async () => {
      const loginData = {
        email: testUser.email,
        password: testUser.password,
      };

      const response = await request(app)
        .post("/api/login")
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty("token");
      expect(typeof response.body.token).toBe("string");
    });

    it("잘못된 이메일로 로그인 시 401 에러가 발생해야 한다", async () => {
      const loginData = {
        email: "wrong@example.com",
        password: testUser.password,
      };

      await request(app).post("/api/login").send(loginData).expect(401);
    });

    it("잘못된 비밀번호로 로그인 시 401 에러가 발생해야 한다", async () => {
      const loginData = {
        email: testUser.email,
        password: "wrongpassword",
      };

      await request(app).post("/api/login").send(loginData).expect(401);
    });

    it("잘못된 요청 형식으로 로그인 시 400 에러가 발생해야 한다", async () => {
      const invalidData = {
        email: "invalid-email",
        // password 누락
      };

      await request(app).post("/api/login").send(invalidData).expect(400);
    });
  });
});

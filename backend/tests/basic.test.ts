import request from "supertest";
import { app } from "../src/server";
import { setupTestDB, cleanupTestDB } from "./setup";

// Jest 글로벌 타입들 명시적 import
import { describe, test, beforeAll, afterAll, expect } from "@jest/globals";

describe("Basic API Tests", () => {
  beforeAll(async () => {
    await setupTestDB();
    // 데이터베이스 초기화 대기
    await new Promise((resolve) => setTimeout(resolve, 1000));
  });

  afterAll(() => {
    cleanupTestDB();
  });

  describe("회원가입 테스트", () => {
    test("멘토 회원가입이 성공해야 한다", async () => {
      const userData = {
        email: `test.mentor.${Date.now()}@example.com`, // 고유한 이메일 생성
        password: "password123",
        name: "테스트멘토",
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

      expect(response.body).toHaveProperty(
        "message",
        "User created successfully"
      );
    });

    test("멘티 회원가입이 성공해야 한다", async () => {
      const userData = {
        email: "test.mentee@example.com",
        password: "password123",
        name: "테스트멘티",
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

    test("잘못된 역할로 회원가입 시 400 에러가 발생해야 한다", async () => {
      const userData = {
        email: "invalid@example.com",
        password: "password123",
        name: "잘못된사용자",
        role: "invalid-role",
      };

      const response = await request(app)
        .post("/api/signup")
        .send(userData)
        .expect(400);

      expect(response.body).toHaveProperty("error");
    });
  });

  describe("로그인 테스트", () => {
    beforeAll(async () => {
      // 로그인 테스트용 사용자 생성
      await request(app).post("/api/signup").send({
        email: "login.test@example.com",
        password: "password123",
        name: "로그인테스트",
        role: "mentor",
      });
    });

    test("올바른 정보로 로그인이 성공해야 한다", async () => {
      const loginData = {
        email: "login.test@example.com",
        password: "password123",
      };

      const response = await request(app)
        .post("/api/login")
        .send(loginData)
        .expect(200);

      expect(response.body).toHaveProperty("token");
      expect(typeof response.body.token).toBe("string");
    });

    test("잘못된 이메일로 로그인 시 401 에러가 발생해야 한다", async () => {
      const loginData = {
        email: "wrong@example.com",
        password: "password123",
      };

      await request(app).post("/api/login").send(loginData).expect(401);
    });

    test("잘못된 비밀번호로 로그인 시 401 에러가 발생해야 한다", async () => {
      const loginData = {
        email: "login.test@example.com",
        password: "wrongpassword",
      };

      await request(app).post("/api/login").send(loginData).expect(401);
    });
  });

  describe("인증 테스트", () => {
    let token: string;

    beforeAll(async () => {
      // 테스트용 사용자 생성 및 로그인
      await request(app).post("/api/signup").send({
        email: "auth.test@example.com",
        password: "password123",
        name: "인증테스트",
        role: "mentor",
      });

      const loginResponse = await request(app).post("/api/login").send({
        email: "auth.test@example.com",
        password: "password123",
      });

      token = loginResponse.body.token;
    });

    test("유효한 토큰으로 내 정보 조회가 성공해야 한다", async () => {
      const response = await request(app)
        .get("/api/me")
        .set("Authorization", `Bearer ${token}`)
        .expect(200);

      expect(response.body).toHaveProperty("email", "auth.test@example.com");
      expect(response.body).toHaveProperty("role", "mentor");
    });

    test("토큰 없이 내 정보 조회 시 401 에러가 발생해야 한다", async () => {
      await request(app).get("/api/me").expect(401);
    });

    test("잘못된 토큰으로 내 정보 조회 시 401 에러가 발생해야 한다", async () => {
      await request(app)
        .get("/api/me")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);
    });
  });
});

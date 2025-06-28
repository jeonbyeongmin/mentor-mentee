import request from "supertest";
import { app } from "../src/server";
import { setupTestDB, cleanupTestDB } from "./setup";

// Jest 글로벌 타입들 명시적 import
import { describe, test, beforeAll, afterAll, expect } from "@jest/globals";

describe("Match Request API Tests", () => {
  let mentorToken: string;
  let menteeToken: string;
  let mentorId: number;
  let menteeId: number;

  beforeAll(async () => {
    await setupTestDB();
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 테스트용 멘토 생성
    await request(app).post("/api/signup").send({
      email: "mentor.match@test.com",
      password: "password123",
      name: "테스트멘토",
      role: "mentor",
    });

    const mentorLogin = await request(app).post("/api/login").send({
      email: "mentor.match@test.com",
      password: "password123",
    });

    mentorToken = mentorLogin.body.token;

    // 멘토 정보 조회로 ID 확인
    const mentorProfile = await request(app)
      .get("/api/me")
      .set("Authorization", `Bearer ${mentorToken}`);

    mentorId = mentorProfile.body.id;

    // 테스트용 멘티 생성
    await request(app).post("/api/signup").send({
      email: "mentee.match@test.com",
      password: "password123",
      name: "테스트멘티",
      role: "mentee",
    });

    const menteeLogin = await request(app).post("/api/login").send({
      email: "mentee.match@test.com",
      password: "password123",
    });

    menteeToken = menteeLogin.body.token;

    // 멘티 정보 조회로 ID 확인
    const menteeProfile = await request(app)
      .get("/api/me")
      .set("Authorization", `Bearer ${menteeToken}`);

    menteeId = menteeProfile.body.id;
  });

  afterAll(() => {
    cleanupTestDB();
  });

  describe("POST /api/match-requests", () => {
    test("멘티가 멘토에게 매칭 요청을 보낼 수 있어야 한다", async () => {
      const requestData = {
        mentorId: mentorId,
        message: "멘토링 받고 싶습니다!",
      };

      const response = await request(app)
        .post("/api/match-requests")
        .set("Authorization", `Bearer ${menteeToken}`)
        .send(requestData)
        .expect(200);

      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("mentorId", mentorId);
      expect(response.body).toHaveProperty("menteeId", menteeId);
      expect(response.body).toHaveProperty("message", "멘토링 받고 싶습니다!");
      expect(response.body).toHaveProperty("status", "pending");
    });

    test("토큰 없이 매칭 요청 시 401 에러가 발생해야 한다", async () => {
      const requestData = {
        mentorId: mentorId,
        message: "멘토링 받고 싶습니다!",
      };

      await request(app)
        .post("/api/match-requests")
        .send(requestData)
        .expect(401);
    });

    test("잘못된 요청 형식으로 매칭 요청 시 400 에러가 발생해야 한다", async () => {
      const invalidData = {
        mentorId: mentorId,
        // menteeId 누락
        message: "멘토링 받고 싶습니다!",
      };

      await request(app)
        .post("/api/match-requests")
        .set("Authorization", `Bearer ${menteeToken}`)
        .send(invalidData)
        .expect(400);
    });

    test("존재하지 않는 멘토에게 요청 시 400 에러가 발생해야 한다", async () => {
      const requestData = {
        mentorId: 99999, // 존재하지 않는 ID
        message: "멘토링 받고 싶습니다!",
      };

      await request(app)
        .post("/api/match-requests")
        .set("Authorization", `Bearer ${menteeToken}`)
        .send(requestData)
        .expect(400);
    });
  });

  describe("GET /api/match-requests/incoming", () => {
    test("멘토가 받은 요청 목록을 조회할 수 있어야 한다", async () => {
      const response = await request(app)
        .get("/api/match-requests/incoming")
        .set("Authorization", `Bearer ${mentorToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);

      // 이전 테스트에서 생성된 요청이 있을 것임
      if (response.body.length > 0) {
        const matchRequest = response.body[0];
        expect(matchRequest).toHaveProperty("id");
        expect(matchRequest).toHaveProperty("mentorId");
        expect(matchRequest).toHaveProperty("menteeId");
        expect(matchRequest).toHaveProperty("status");
      }
    });

    test("토큰 없이 요청 시 401 에러가 발생해야 한다", async () => {
      await request(app).get("/api/match-requests/incoming").expect(401);
    });
  });

  describe("GET /api/match-requests/outgoing", () => {
    test("멘티가 보낸 요청 목록을 조회할 수 있어야 한다", async () => {
      const response = await request(app)
        .get("/api/match-requests/outgoing")
        .set("Authorization", `Bearer ${menteeToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);

      // 이전 테스트에서 생성된 요청이 있을 것임
      if (response.body.length > 0) {
        const matchRequest = response.body[0];
        expect(matchRequest).toHaveProperty("id");
        expect(matchRequest).toHaveProperty("mentorId");
        expect(matchRequest).toHaveProperty("menteeId");
        expect(matchRequest).toHaveProperty("status");
      }
    });

    test("토큰 없이 요청 시 401 에러가 발생해야 한다", async () => {
      await request(app).get("/api/match-requests/outgoing").expect(401);
    });
  });

  describe("요청 상태 변경 테스트", () => {
    let testRequestId: number;

    beforeAll(async () => {
      // 테스트용 새로운 요청 생성
      const requestData = {
        mentorId: mentorId,
        message: "상태 변경 테스트용 요청",
      };

      const response = await request(app)
        .post("/api/match-requests")
        .set("Authorization", `Bearer ${menteeToken}`)
        .send(requestData);

      testRequestId = response.body.id;
    });

    test("멘토가 요청을 수락할 수 있어야 한다", async () => {
      const response = await request(app)
        .put(`/api/match-requests/${testRequestId}/accept`)
        .set("Authorization", `Bearer ${mentorToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("id", testRequestId);
      expect(response.body).toHaveProperty("status", "accepted");
    });

    test("존재하지 않는 요청을 수락하려 할 때 404 에러가 발생해야 한다", async () => {
      await request(app)
        .put("/api/match-requests/99999/accept")
        .set("Authorization", `Bearer ${mentorToken}`)
        .expect(404);
    });

    test("토큰 없이 요청을 수락하려 할 때 401 에러가 발생해야 한다", async () => {
      await request(app)
        .put(`/api/match-requests/${testRequestId}/accept`)
        .expect(401);
    });
  });

  describe("요청 거절 테스트", () => {
    let rejectRequestId: number;

    beforeAll(async () => {
      // 거절 테스트용 새로운 요청 생성
      const requestData = {
        mentorId: mentorId,
        message: "거절 테스트용 요청",
      };

      const response = await request(app)
        .post("/api/match-requests")
        .set("Authorization", `Bearer ${menteeToken}`)
        .send(requestData);

      rejectRequestId = response.body.id;
    });

    test("멘토가 요청을 거절할 수 있어야 한다", async () => {
      const response = await request(app)
        .put(`/api/match-requests/${rejectRequestId}/reject`)
        .set("Authorization", `Bearer ${mentorToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("id", rejectRequestId);
      expect(response.body).toHaveProperty("status", "rejected");
    });

    test("존재하지 않는 요청을 거절하려 할 때 404 에러가 발생해야 한다", async () => {
      await request(app)
        .put("/api/match-requests/99999/reject")
        .set("Authorization", `Bearer ${mentorToken}`)
        .expect(404);
    });
  });

  describe("요청 취소 테스트", () => {
    let cancelRequestId: number;

    beforeAll(async () => {
      // 취소 테스트용 새로운 요청 생성
      const requestData = {
        mentorId: mentorId,
        message: "취소 테스트용 요청",
      };

      const response = await request(app)
        .post("/api/match-requests")
        .set("Authorization", `Bearer ${menteeToken}`)
        .send(requestData);

      cancelRequestId = response.body.id;
    });

    test("멘티가 요청을 취소할 수 있어야 한다", async () => {
      const response = await request(app)
        .delete(`/api/match-requests/${cancelRequestId}`)
        .set("Authorization", `Bearer ${menteeToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("id", cancelRequestId);
      expect(response.body).toHaveProperty("status", "cancelled");
    });

    test("존재하지 않는 요청을 취소하려 할 때 404 에러가 발생해야 한다", async () => {
      await request(app)
        .delete("/api/match-requests/99999")
        .set("Authorization", `Bearer ${menteeToken}`)
        .expect(404);
    });
  });
});

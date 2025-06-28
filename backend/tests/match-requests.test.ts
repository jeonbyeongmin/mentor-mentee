import request from "supertest";
import { app } from "../src/server";
import { setupTestDB, cleanupTestDB } from "./setup";

describe("매칭 요청 API 테스트", () => {
  let mentorToken: string;
  let menteeToken: string;
  let mentorId: number;
  let menteeId: number;
  let matchRequestId: number;

  beforeAll(async () => {
    await setupTestDB();

    // 테스트용 멘토 생성
    const mentorData = {
      email: "mentor@test.com",
      password: "password123",
      name: "테스트멘토",
      role: "mentor",
    };

    const mentorResponse = await request(app)
      .post("/api/signup")
      .send(mentorData);

    const mentorLogin = await request(app)
      .post("/api/login")
      .send({ email: mentorData.email, password: mentorData.password });
    mentorToken = mentorLogin.body.token;

    // 멘토 ID 가져오기
    const mentorProfile = await request(app)
      .get("/api/me")
      .set("Authorization", `Bearer ${mentorToken}`);
    mentorId = mentorProfile.body.id;

    // 테스트용 멘티 생성
    const menteeData = {
      email: "mentee@test.com",
      password: "password123",
      name: "테스트멘티",
      role: "mentee",
    };

    const menteeResponse = await request(app)
      .post("/api/signup")
      .send(menteeData);

    const menteeLogin = await request(app)
      .post("/api/login")
      .send({ email: menteeData.email, password: menteeData.password });
    menteeToken = menteeLogin.body.token;

    // 멘티 ID 가져오기
    const menteeProfile = await request(app)
      .get("/api/me")
      .set("Authorization", `Bearer ${menteeToken}`);
    menteeId = menteeProfile.body.id;
  });

  afterAll(() => {
    cleanupTestDB();
  });

  describe("POST /api/match-requests", () => {
    it("멘티가 멘토에게 매칭 요청을 보낼 수 있어야 한다", async () => {
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

      matchRequestId = response.body.id;
    });

    it("존재하지 않는 멘토에게 요청 시 400 에러가 발생해야 한다", async () => {
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

    it("잘못된 요청 형식으로 매칭 요청 시 400 에러가 발생해야 한다", async () => {
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

    it("인증 토큰 없이 매칭 요청 시 401 에러가 발생해야 한다", async () => {
      const requestData = {
        mentorId: mentorId,
        message: "멘토링 받고 싶습니다!",
      };

      await request(app)
        .post("/api/match-requests")
        .send(requestData)
        .expect(401);
    });

    it("멘토가 매칭 요청을 보내려 할 때 적절한 응답을 받아야 한다", async () => {
      const requestData = {
        mentorId: mentorId,
        message: "멘토가 요청을 보냅니다",
      };

      // 멘토는 매칭 요청을 보낼 수 없어야 함 (구현에 따라 403 또는 400)
      await request(app)
        .post("/api/match-requests")
        .set("Authorization", `Bearer ${mentorToken}`)
        .send(requestData)
        .expect((res) => {
          expect([400, 403]).toContain(res.status);
        });
    });
  });

  describe("GET /api/match-requests/incoming", () => {
    it("멘토가 받은 요청 목록을 조회할 수 있어야 한다", async () => {
      const response = await request(app)
        .get("/api/match-requests/incoming")
        .set("Authorization", `Bearer ${mentorToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);

      const matchRequest = response.body.find(
        (req: any) => req.id === matchRequestId
      );
      expect(matchRequest).toBeDefined();
      expect(matchRequest.mentorId).toBe(mentorId);
      expect(matchRequest.menteeId).toBe(menteeId);
      expect(matchRequest.status).toBe("pending");
    });

    it("인증 토큰 없이 요청 시 401 에러가 발생해야 한다", async () => {
      await request(app).get("/api/match-requests/incoming").expect(401);
    });

    it("멘티가 들어온 요청 목록을 조회하려 할 때 적절한 응답을 받아야 한다", async () => {
      // 멘티는 들어온 요청 목록을 볼 수 없어야 함 (구현에 따라 403 또는 빈 배열)
      await request(app)
        .get("/api/match-requests/incoming")
        .set("Authorization", `Bearer ${menteeToken}`)
        .expect((res) => {
          expect([200, 403]).toContain(res.status);
          if (res.status === 200) {
            expect(Array.isArray(res.body)).toBe(true);
          }
        });
    });
  });

  describe("GET /api/match-requests/outgoing", () => {
    it("멘티가 보낸 요청 목록을 조회할 수 있어야 한다", async () => {
      const response = await request(app)
        .get("/api/match-requests/outgoing")
        .set("Authorization", `Bearer ${menteeToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);

      const matchRequest = response.body.find(
        (req: any) => req.id === matchRequestId
      );
      expect(matchRequest).toBeDefined();
      expect(matchRequest.mentorId).toBe(mentorId);
      expect(matchRequest.menteeId).toBe(menteeId);
      expect(matchRequest.status).toBe("pending");
    });

    it("인증 토큰 없이 요청 시 401 에러가 발생해야 한다", async () => {
      await request(app).get("/api/match-requests/outgoing").expect(401);
    });

    it("멘토가 보낸 요청 목록을 조회하려 할 때 적절한 응답을 받아야 한다", async () => {
      // 멘토는 보낸 요청 목록을 볼 수 없어야 함 (구현에 따라 403 또는 빈 배열)
      await request(app)
        .get("/api/match-requests/outgoing")
        .set("Authorization", `Bearer ${mentorToken}`)
        .expect((res) => {
          expect([200, 403]).toContain(res.status);
          if (res.status === 200) {
            expect(Array.isArray(res.body)).toBe(true);
          }
        });
    });
  });

  describe("PUT /api/match-requests/:id/accept", () => {
    it("멘토가 요청을 수락할 수 있어야 한다", async () => {
      const response = await request(app)
        .put(`/api/match-requests/${matchRequestId}/accept`)
        .set("Authorization", `Bearer ${mentorToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("id", matchRequestId);
      expect(response.body).toHaveProperty("status", "accepted");
    });

    it("존재하지 않는 요청을 수락하려 할 때 404 에러가 발생해야 한다", async () => {
      await request(app)
        .put("/api/match-requests/99999/accept")
        .set("Authorization", `Bearer ${mentorToken}`)
        .expect(404);
    });

    it("인증 토큰 없이 요청을 수락하려 할 때 401 에러가 발생해야 한다", async () => {
      await request(app)
        .put(`/api/match-requests/${matchRequestId}/accept`)
        .expect(401);
    });

    it("멘티가 요청을 수락하려 할 때 적절한 응답을 받아야 한다", async () => {
      // 멘티는 요청을 수락할 수 없어야 함
      await request(app)
        .put(`/api/match-requests/${matchRequestId}/accept`)
        .set("Authorization", `Bearer ${menteeToken}`)
        .expect((res) => {
          expect([403, 404]).toContain(res.status);
        });
    });
  });

  describe("PUT /api/match-requests/:id/reject", () => {
    let rejectTestRequestId: number;

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

      rejectTestRequestId = response.body.id;
    });

    it("멘토가 요청을 거절할 수 있어야 한다", async () => {
      const response = await request(app)
        .put(`/api/match-requests/${rejectTestRequestId}/reject`)
        .set("Authorization", `Bearer ${mentorToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("id", rejectTestRequestId);
      expect(response.body).toHaveProperty("status", "rejected");
    });

    it("존재하지 않는 요청을 거절하려 할 때 404 에러가 발생해야 한다", async () => {
      await request(app)
        .put("/api/match-requests/99999/reject")
        .set("Authorization", `Bearer ${mentorToken}`)
        .expect(404);
    });

    it("인증 토큰 없이 요청을 거절하려 할 때 401 에러가 발생해야 한다", async () => {
      await request(app)
        .put(`/api/match-requests/${rejectTestRequestId}/reject`)
        .expect(401);
    });
  });

  describe("DELETE /api/match-requests/:id", () => {
    let cancelTestRequestId: number;

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

      cancelTestRequestId = response.body.id;
    });

    it("멘티가 요청을 취소할 수 있어야 한다", async () => {
      const response = await request(app)
        .delete(`/api/match-requests/${cancelTestRequestId}`)
        .set("Authorization", `Bearer ${menteeToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("id", cancelTestRequestId);
      expect(response.body).toHaveProperty("status", "cancelled");
    });

    it("존재하지 않는 요청을 취소하려 할 때 404 에러가 발생해야 한다", async () => {
      await request(app)
        .delete("/api/match-requests/99999")
        .set("Authorization", `Bearer ${menteeToken}`)
        .expect(404);
    });

    it("인증 토큰 없이 요청을 취소하려 할 때 401 에러가 발생해야 한다", async () => {
      await request(app)
        .delete(`/api/match-requests/${cancelTestRequestId}`)
        .expect(401);
    });

    it("멘토가 요청을 취소하려 할 때 적절한 응답을 받아야 한다", async () => {
      // 멘토는 요청을 취소할 수 없어야 함
      await request(app)
        .delete(`/api/match-requests/${cancelTestRequestId}`)
        .set("Authorization", `Bearer ${mentorToken}`)
        .expect((res) => {
          expect([403, 404]).toContain(res.status);
        });
    });
  });
});

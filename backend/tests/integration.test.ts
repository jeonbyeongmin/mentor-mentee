import request from "supertest";
import { app } from "../src/server";
import { setupTestDB, cleanupTestDB } from "./setup";

describe("API 통합 테스트", () => {
  beforeAll(async () => {
    await setupTestDB();
    // 데이터베이스 초기화 대기
    await new Promise((resolve) => setTimeout(resolve, 1000));
  });

  afterAll(() => {
    cleanupTestDB();
  });

  describe("전체 워크플로우 테스트", () => {
    let mentorToken: string;
    let menteeToken: string;
    let mentorId: number;
    let menteeId: number;

    it("멘토-멘티 매칭 전체 플로우가 정상적으로 작동해야 한다", async () => {
      // 1. 멘토 회원가입
      const mentorData = {
        email: "integration.mentor@test.com",
        password: "password123",
        name: "통합테스트멘토",
        role: "mentor",
      };

      const mentorSignupResponse = await request(app)
        .post("/api/signup")
        .send(mentorData)
        .expect(201);

      mentorId = mentorSignupResponse.body.id;

      // 2. 멘티 회원가입
      const menteeData = {
        email: "integration.mentee@test.com",
        password: "password123",
        name: "통합테스트멘티",
        role: "mentee",
      };

      const menteeSignupResponse = await request(app)
        .post("/api/signup")
        .send(menteeData)
        .expect(201);

      menteeId = menteeSignupResponse.body.id;

      // 3. 멘토 로그인
      const mentorLoginResponse = await request(app)
        .post("/api/login")
        .send({ email: mentorData.email, password: mentorData.password })
        .expect(200);

      mentorToken = mentorLoginResponse.body.token;
      expect(mentorToken).toBeDefined();

      // 4. 멘티 로그인
      const menteeLoginResponse = await request(app)
        .post("/api/login")
        .send({ email: menteeData.email, password: menteeData.password })
        .expect(200);

      menteeToken = menteeLoginResponse.body.token;
      expect(menteeToken).toBeDefined();

      // 5. 멘토 프로필 업데이트
      await request(app)
        .put("/api/profile")
        .set("Authorization", `Bearer ${mentorToken}`)
        .send({
          name: "통합테스트멘토",
          role: "mentor",
          bio: "React 전문 멘토",
          skills: ["React", "TypeScript", "JavaScript"],
        })
        .expect(200);

      // 6. 멘티가 멘토 목록 조회
      const mentorsResponse = await request(app)
        .get("/api/mentors")
        .set("Authorization", `Bearer ${menteeToken}`)
        .expect(200);

      expect(Array.isArray(mentorsResponse.body)).toBe(true);
      const mentor = mentorsResponse.body.find((m: any) => m.id === mentorId);
      expect(mentor).toBeDefined();
      expect(mentor.profile.skills).toContain("React");

      // 7. 멘티가 매칭 요청 보내기
      const matchRequestResponse = await request(app)
        .post("/api/match-requests")
        .set("Authorization", `Bearer ${menteeToken}`)
        .send({
          mentorId: mentorId,
          message: "React 멘토링을 받고 싶습니다!",
        })
        .expect(200);

      const matchRequestId = matchRequestResponse.body.id;
      expect(matchRequestResponse.body.status).toBe("pending");

      // 8. 멘토가 받은 요청 목록 확인
      const incomingRequestsResponse = await request(app)
        .get("/api/match-requests/incoming")
        .set("Authorization", `Bearer ${mentorToken}`)
        .expect(200);

      expect(Array.isArray(incomingRequestsResponse.body)).toBe(true);
      const incomingRequest = incomingRequestsResponse.body.find(
        (req: any) => req.id === matchRequestId
      );
      expect(incomingRequest).toBeDefined();
      expect(incomingRequest.status).toBe("pending");

      // 9. 멘티가 보낸 요청 목록 확인
      const outgoingRequestsResponse = await request(app)
        .get("/api/match-requests/outgoing")
        .set("Authorization", `Bearer ${menteeToken}`)
        .expect(200);

      expect(Array.isArray(outgoingRequestsResponse.body)).toBe(true);
      const outgoingRequest = outgoingRequestsResponse.body.find(
        (req: any) => req.id === matchRequestId
      );
      expect(outgoingRequest).toBeDefined();
      expect(outgoingRequest.status).toBe("pending");

      // 10. 멘토가 요청 수락
      const acceptResponse = await request(app)
        .put(`/api/match-requests/${matchRequestId}/accept`)
        .set("Authorization", `Bearer ${mentorToken}`)
        .expect(200);

      expect(acceptResponse.body.status).toBe("accepted");

      // 11. 수락 후 상태 확인
      const finalIncomingResponse = await request(app)
        .get("/api/match-requests/incoming")
        .set("Authorization", `Bearer ${mentorToken}`)
        .expect(200);

      const finalRequest = finalIncomingResponse.body.find(
        (req: any) => req.id === matchRequestId
      );
      expect(finalRequest.status).toBe("accepted");
    });

    it("멘토가 요청을 거절하는 플로우가 정상적으로 작동해야 한다", async () => {
      // 새로운 매칭 요청 생성
      const rejectRequestResponse = await request(app)
        .post("/api/match-requests")
        .set("Authorization", `Bearer ${menteeToken}`)
        .send({
          mentorId: mentorId,
          message: "거절 테스트용 요청입니다",
        })
        .expect(200);

      const rejectRequestId = rejectRequestResponse.body.id;

      // 멘토가 요청 거절
      const rejectResponse = await request(app)
        .put(`/api/match-requests/${rejectRequestId}/reject`)
        .set("Authorization", `Bearer ${mentorToken}`)
        .expect(200);

      expect(rejectResponse.body.status).toBe("rejected");

      // 거절 후 상태 확인
      const rejectedRequestResponse = await request(app)
        .get("/api/match-requests/incoming")
        .set("Authorization", `Bearer ${mentorToken}`)
        .expect(200);

      const rejectedRequest = rejectedRequestResponse.body.find(
        (req: any) => req.id === rejectRequestId
      );
      expect(rejectedRequest.status).toBe("rejected");
    });

    it("멘티가 요청을 취소하는 플로우가 정상적으로 작동해야 한다", async () => {
      // 새로운 매칭 요청 생성
      const cancelRequestResponse = await request(app)
        .post("/api/match-requests")
        .set("Authorization", `Bearer ${menteeToken}`)
        .send({
          mentorId: mentorId,
          message: "취소 테스트용 요청입니다",
        })
        .expect(200);

      const cancelRequestId = cancelRequestResponse.body.id;

      // 멘티가 요청 취소
      const cancelResponse = await request(app)
        .delete(`/api/match-requests/${cancelRequestId}`)
        .set("Authorization", `Bearer ${menteeToken}`)
        .expect(200);

      expect(cancelResponse.body.status).toBe("cancelled");

      // 취소 후 상태 확인
      const cancelledRequestResponse = await request(app)
        .get("/api/match-requests/outgoing")
        .set("Authorization", `Bearer ${menteeToken}`)
        .expect(200);

      const cancelledRequest = cancelledRequestResponse.body.find(
        (req: any) => req.id === cancelRequestId
      );
      expect(cancelledRequest.status).toBe("cancelled");
    });
  });

  describe("에러 처리 테스트", () => {
    it("잘못된 엔드포인트 접근 시 404 에러가 발생해야 한다", async () => {
      await request(app).get("/api/nonexistent").expect(404);
    });

    it("서버 내부 에러 처리가 정상적으로 작동해야 한다", async () => {
      // 이 테스트는 실제 구현에서 에러를 발생시키는 엔드포인트가 있을 때 사용
      // 예: 잘못된 데이터베이스 쿼리 등
    });
  });
});

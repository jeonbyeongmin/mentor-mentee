import request from "supertest";
import { app } from "../src/server";
import { setupTestDB, cleanupTestDB } from "./setup";

describe("사용자 정보 API 테스트", () => {
  let mentorToken: string;
  let menteeToken: string;
  let mentorId: number;
  let menteeId: number;

  beforeAll(async () => {
    await setupTestDB();

    // 테스트용 멘토 생성 및 로그인
    const mentorData = {
      email: "mentor@test.com",
      password: "password123",
      name: "테스트멘토",
      role: "mentor",
    };

    await request(app).post("/api/signup").send(mentorData);

    const mentorLogin = await request(app)
      .post("/api/login")
      .send({ email: mentorData.email, password: mentorData.password });

    mentorToken = mentorLogin.body.token;

    // 멘토 정보 조회로 ID 확인
    const mentorProfile = await request(app)
      .get("/api/me")
      .set("Authorization", `Bearer ${mentorToken}`);

    mentorId = mentorProfile.body.id;

    // 테스트용 멘티 생성 및 로그인
    const menteeData = {
      email: "mentee@test.com",
      password: "password123",
      name: "테스트멘티",
      role: "mentee",
    };

    await request(app).post("/api/signup").send(menteeData);

    const menteeLogin = await request(app)
      .post("/api/login")
      .send({ email: menteeData.email, password: menteeData.password });

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

  describe("GET /api/me", () => {
    it("멘토가 자신의 정보를 조회할 수 있어야 한다", async () => {
      const response = await request(app)
        .get("/api/me")
        .set("Authorization", `Bearer ${mentorToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("id", mentorId);
      expect(response.body).toHaveProperty("email", "mentor@test.com");
      expect(response.body).toHaveProperty("role", "mentor");
      expect(response.body).toHaveProperty("profile");
      expect(response.body.profile).toHaveProperty("name", "테스트멘토");
    });

    it("멘티가 자신의 정보를 조회할 수 있어야 한다", async () => {
      const response = await request(app)
        .get("/api/me")
        .set("Authorization", `Bearer ${menteeToken}`)
        .expect(200);

      expect(response.body).toHaveProperty("id", menteeId);
      expect(response.body).toHaveProperty("email", "mentee@test.com");
      expect(response.body).toHaveProperty("role", "mentee");
      expect(response.body).toHaveProperty("profile");
      expect(response.body.profile).toHaveProperty("name", "테스트멘티");
    });

    it("인증 토큰 없이 요청 시 401 에러가 발생해야 한다", async () => {
      await request(app).get("/api/me").expect(401);
    });

    it("잘못된 토큰으로 요청 시 401 에러가 발생해야 한다", async () => {
      await request(app)
        .get("/api/me")
        .set("Authorization", "Bearer invalid-token")
        .expect(401);
    });
  });

  describe("PUT /api/profile", () => {
    it("멘토가 프로필을 수정할 수 있어야 한다", async () => {
      const updateData = {
        id: mentorId,
        name: "수정된멘토",
        role: "mentor",
        bio: "프론트엔드 전문 멘토",
        skills: ["React", "Vue", "TypeScript"],
      };

      const response = await request(app)
        .put("/api/profile")
        .set("Authorization", `Bearer ${mentorToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.profile.name).toBe("수정된멘토");
      expect(response.body.profile.bio).toBe("프론트엔드 전문 멘토");
      expect(response.body.profile.skills).toEqual([
        "React",
        "Vue",
        "TypeScript",
      ]);
    });

    it("멘티가 프로필을 수정할 수 있어야 한다", async () => {
      const updateData = {
        id: menteeId,
        name: "수정된멘티",
        role: "mentee",
        bio: "개발을 배우고 싶은 멘티",
      };

      const response = await request(app)
        .put("/api/profile")
        .set("Authorization", `Bearer ${menteeToken}`)
        .send(updateData)
        .expect(200);

      expect(response.body.profile.name).toBe("수정된멘티");
      expect(response.body.profile.bio).toBe("개발을 배우고 싶은 멘티");
    });

    it("인증 토큰 없이 프로필 수정 시 401 에러가 발생해야 한다", async () => {
      const updateData = {
        id: mentorId,
        name: "해킹시도",
        role: "mentor",
        bio: "해킹당했습니다",
      };

      await request(app).put("/api/profile").send(updateData).expect(401);
    });

    it("잘못된 요청 형식으로 프로필 수정 시 400 에러가 발생해야 한다", async () => {
      const invalidData = {
        // id 누락
        name: "",
        role: "invalid-role",
      };

      await request(app)
        .put("/api/profile")
        .set("Authorization", `Bearer ${mentorToken}`)
        .send(invalidData)
        .expect(400);
    });
  });

  describe("GET /api/images/:role/:id", () => {
    it("프로필 이미지 요청이 성공해야 한다", async () => {
      const response = await request(app)
        .get(`/api/images/mentor/${mentorId}`)
        .set("Authorization", `Bearer ${mentorToken}`)
        .expect(200);

      // 이미지가 없을 경우 기본 응답 또는 404를 반환할 수 있음
      // 실제 구현에 따라 테스트 조정 필요
    });

    it("인증 토큰 없이 이미지 요청 시 401 에러가 발생해야 한다", async () => {
      await request(app).get(`/api/images/mentor/${mentorId}`).expect(401);
    });
  });
});

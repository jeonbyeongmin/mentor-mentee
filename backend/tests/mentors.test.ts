import request from "supertest";
import { app } from "../src/server";
import { setupTestDB, cleanupTestDB } from "./setup";

describe("멘토 목록 API 테스트", () => {
  let menteeToken: string;
  let mentorTokens: string[] = [];

  beforeAll(async () => {
    await setupTestDB();

    // 테스트용 멘티 생성
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

    // 테스트용 멘토들 생성
    const mentors = [
      {
        email: "mentor1@test.com",
        password: "password123",
        name: "김리액트",
        role: "mentor",
      },
      {
        email: "mentor2@test.com",
        password: "password123",
        name: "이뷰",
        role: "mentor",
      },
      {
        email: "mentor3@test.com",
        password: "password123",
        name: "박스프링",
        role: "mentor",
      },
    ];

    for (const mentorData of mentors) {
      await request(app).post("/api/signup").send(mentorData);
      const mentorLogin = await request(app)
        .post("/api/login")
        .send({ email: mentorData.email, password: mentorData.password });
      mentorTokens.push(mentorLogin.body.token);
    }

    // 멘토들의 프로필을 업데이트하여 스킬 설정
    await request(app)
      .put("/api/profile")
      .set("Authorization", `Bearer ${mentorTokens[0]}`)
      .send({
        name: "김리액트",
        role: "mentor",
        bio: "React 전문가",
        skills: ["React", "JavaScript"],
      });

    await request(app)
      .put("/api/profile")
      .set("Authorization", `Bearer ${mentorTokens[1]}`)
      .send({
        name: "이뷰",
        role: "mentor",
        bio: "Vue.js 전문가",
        skills: ["Vue", "JavaScript"],
      });

    await request(app)
      .put("/api/profile")
      .set("Authorization", `Bearer ${mentorTokens[2]}`)
      .send({
        name: "박스프링",
        role: "mentor",
        bio: "Spring Boot 전문가",
        skills: ["Spring Boot", "Java"],
      });
  });

  afterAll(() => {
    cleanupTestDB();
  });

  describe("GET /api/mentors", () => {
    it("멘티가 모든 멘토 목록을 조회할 수 있어야 한다", async () => {
      const response = await request(app)
        .get("/api/mentors")
        .set("Authorization", `Bearer ${menteeToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(3);

      // 첫 번째 멘토의 구조 확인
      const mentor = response.body[0];
      expect(mentor).toHaveProperty("id");
      expect(mentor).toHaveProperty("email");
      expect(mentor).toHaveProperty("role", "mentor");
      expect(mentor).toHaveProperty("profile");
      expect(mentor.profile).toHaveProperty("name");
      expect(mentor.profile).toHaveProperty("bio");
      expect(mentor.profile).toHaveProperty("skills");
    });

    it("React 스킬로 멘토를 필터링할 수 있어야 한다", async () => {
      const response = await request(app)
        .get("/api/mentors?skill=React")
        .set("Authorization", `Bearer ${menteeToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(1);

      // React 스킬을 가진 멘토만 반환되는지 확인
      for (const mentor of response.body) {
        expect(mentor.profile.skills).toContain("React");
      }
    });

    it("Java 스킬로 멘토를 필터링할 수 있어야 한다", async () => {
      const response = await request(app)
        .get("/api/mentors?skill=Java")
        .set("Authorization", `Bearer ${menteeToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);

      // Java 스킬을 가진 멘토만 반환되는지 확인
      for (const mentor of response.body) {
        expect(mentor.profile.skills).toContain("Java");
      }
    });

    it("존재하지 않는 스킬로 검색 시 빈 배열을 반환해야 한다", async () => {
      const response = await request(app)
        .get("/api/mentors?skill=NonExistentSkill")
        .set("Authorization", `Bearer ${menteeToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it("이름 기준으로 멘토 목록을 정렬할 수 있어야 한다", async () => {
      const response = await request(app)
        .get("/api/mentors?order_by=name")
        .set("Authorization", `Bearer ${menteeToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBeGreaterThanOrEqual(3);

      // 이름 순으로 정렬되어 있는지 확인
      for (let i = 1; i < response.body.length; i++) {
        const prevName = response.body[i - 1].profile.name;
        const currName = response.body[i].profile.name;
        expect(prevName.localeCompare(currName)).toBeLessThanOrEqual(0);
      }
    });

    it("스킬과 정렬을 함께 사용할 수 있어야 한다", async () => {
      const response = await request(app)
        .get("/api/mentors?skill=JavaScript&order_by=name")
        .set("Authorization", `Bearer ${menteeToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);

      // JavaScript 스킬을 가진 멘토들이 이름 순으로 정렬되어 있는지 확인
      for (const mentor of response.body) {
        expect(mentor.profile.skills).toContain("JavaScript");
      }

      for (let i = 1; i < response.body.length; i++) {
        const prevName = response.body[i - 1].profile.name;
        const currName = response.body[i].profile.name;
        expect(prevName.localeCompare(currName)).toBeLessThanOrEqual(0);
      }
    });

    it("인증 토큰 없이 요청 시 401 에러가 발생해야 한다", async () => {
      await request(app).get("/api/mentors").expect(401);
    });

    it("멘토가 멘토 목록을 조회하려 할 때 적절한 응답을 받아야 한다", async () => {
      // 멘토 역할로 멘토 목록에 접근하는 경우의 동작은 구현에 따라 다름
      // 403 Forbidden이거나 200 OK일 수 있음
      const response = await request(app)
        .get("/api/mentors")
        .set("Authorization", `Bearer ${mentorTokens[0]}`)
        .expect((res) => {
          expect([200, 403]).toContain(res.status);
        });
    });
  });
});

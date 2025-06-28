import request from "supertest";
import { app } from "../src/server";
import { setupTestDB, cleanupTestDB } from "./setup";

describe("Mentor API Tests", () => {
  let menteeToken: string;
  let mentorTokens: string[] = [];

  beforeAll(async () => {
    await setupTestDB();
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // 테스트용 멘티 생성
    await request(app).post("/api/signup").send({
      email: "mentee.mentors@test.com",
      password: "password123",
      name: "테스트멘티",
      role: "mentee",
    });

    const menteeLogin = await request(app).post("/api/login").send({
      email: "mentee.mentors@test.com",
      password: "password123",
    });

    menteeToken = menteeLogin.body.token;

    // 테스트용 멘토들 생성
    const mentors = [
      {
        email: "mentor1.mentors@test.com",
        password: "password123",
        name: "김리액트",
        role: "mentor",
      },
      {
        email: "mentor2.mentors@test.com",
        password: "password123",
        name: "이뷰",
        role: "mentor",
      },
      {
        email: "mentor3.mentors@test.com",
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
    test("멘티가 멘토 목록을 조회할 수 있어야 한다", async () => {
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
    });

    test("토큰 없이 멘토 목록 조회 시 401 에러가 발생해야 한다", async () => {
      await request(app).get("/api/mentors").expect(401);
    });

    test("React 스킬로 멘토를 필터링할 수 있어야 한다", async () => {
      const response = await request(app)
        .get("/api/mentors?skill=React")
        .set("Authorization", `Bearer ${menteeToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);

      // React 스킬을 가진 멘토가 있는지 확인
      if (response.body.length > 0) {
        const mentorWithReact = response.body.find(
          (mentor: any) =>
            mentor.profile.skills && mentor.profile.skills.includes("React")
        );
        expect(mentorWithReact).toBeDefined();
      }
    });

    test("존재하지 않는 스킬로 검색 시 빈 배열을 반환해야 한다", async () => {
      const response = await request(app)
        .get("/api/mentors?skill=NonExistentSkill")
        .set("Authorization", `Bearer ${menteeToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    test("name으로 정렬 파라미터가 작동해야 한다", async () => {
      const response = await request(app)
        .get("/api/mentors?order_by=name")
        .set("Authorization", `Bearer ${menteeToken}`)
        .expect(200);

      expect(Array.isArray(response.body)).toBe(true);

      // 이름 순으로 정렬되어 있는지 확인 (최소 2명 이상일 때)
      if (response.body.length >= 2) {
        for (let i = 1; i < response.body.length; i++) {
          const prevName = response.body[i - 1].profile.name;
          const currName = response.body[i].profile.name;
          expect(prevName.localeCompare(currName)).toBeLessThanOrEqual(0);
        }
      }
    });
  });
});

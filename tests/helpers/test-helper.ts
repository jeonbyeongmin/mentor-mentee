import { Page } from "@playwright/test";

export interface TestUser {
  email: string;
  password: string;
  name: string;
  role: "mentor" | "mentee";
}

export class TestHelper {
  constructor(private page: Page) {}

  /**
   * 테스트용 사용자 생성 및 회원가입
   */
  async createUser(user: TestUser): Promise<void> {
    await this.page.goto("/signup");
    await this.page.fill('input[name="email"]', user.email);
    await this.page.fill('input[name="password"]', user.password);
    await this.page.fill('input[name="name"]', user.name);
    await this.page.selectOption('select[name="role"]', user.role);
    await this.page.click('button[type="submit"]');
  }

  /**
   * 사용자 로그인
   */
  async login(email: string, password: string): Promise<void> {
    await this.page.goto("/login");
    await this.page.fill('input[name="email"]', email);
    await this.page.fill('input[name="password"]', password);
    await this.page.click('button[type="submit"]');
  }

  /**
   * 멘토 프로필 설정
   */
  async setupMentorProfile(bio: string, skills: string): Promise<void> {
    await this.page.click('button:has-text("프로필 수정")');
    await this.page.fill('textarea[name="bio"]', bio);
    await this.page.fill('input[name="skills"]', skills);
    await this.page.click('button[type="submit"]');
  }

  /**
   * 멘티 프로필 설정
   */
  async setupMenteeProfile(bio: string): Promise<void> {
    await this.page.click('button:has-text("프로필 수정")');
    await this.page.fill('textarea[name="bio"]', bio);
    await this.page.click('button[type="submit"]');
  }

  /**
   * 매칭 요청 보내기
   */
  async sendMatchRequest(mentorName: string, message: string): Promise<void> {
    await this.page.goto("/mentors");
    await this.page.click(`text=${mentorName}`);
    await this.page.fill('textarea[name="message"]', message);
    await this.page.click('button:has-text("매칭 요청")');
  }

  /**
   * 로그아웃
   */
  async logout(): Promise<void> {
    await this.page.click('button:has-text("로그아웃")');
  }

  /**
   * 페이지 새로고침 후 로그인 상태 확인
   */
  async checkAuthState(): Promise<boolean> {
    await this.page.reload();
    // 프로필 페이지나 멘토 목록에 접근할 수 있으면 로그인 상태
    try {
      await this.page.goto("/profile");
      return true;
    } catch {
      return false;
    }
  }

  /**
   * 랜덤 이메일 생성
   */
  static generateRandomEmail(prefix: string = "test"): string {
    return `${prefix}-${Date.now()}-${Math.random()
      .toString(36)
      .substring(7)}@test.com`;
  }

  /**
   * 테스트용 멘토 생성
   */
  static createTestMentor(name: string): TestUser {
    return {
      email: this.generateRandomEmail("mentor"),
      password: "testpass123",
      name,
      role: "mentor",
    };
  }

  /**
   * 테스트용 멘티 생성
   */
  static createTestMentee(name: string): TestUser {
    return {
      email: this.generateRandomEmail("mentee"),
      password: "testpass123",
      name,
      role: "mentee",
    };
  }

  /**
   * 데이터베이스 초기화 (테스트 후 정리용)
   */
  async cleanupDatabase(): Promise<void> {
    // API를 통해 테스트 데이터 정리
    // 실제 구현에서는 테스트 전용 API 엔드포인트를 만들 수 있습니다
    console.log("Database cleanup - 실제 구현 필요");
  }
}

/**
 * 테스트 픽스처 - 공통으로 사용할 사용자들
 */
export const TEST_USERS = {
  MENTOR_1: {
    email: "test-mentor-1@test.com",
    password: "testpass123",
    name: "테스트 멘토 1",
    role: "mentor" as const,
    bio: "React 전문 멘토입니다.",
    skills: "React, TypeScript, Next.js",
  },
  MENTOR_2: {
    email: "test-mentor-2@test.com",
    password: "testpass123",
    name: "테스트 멘토 2",
    role: "mentor" as const,
    bio: "Python 백엔드 전문가입니다.",
    skills: "Python, Django, PostgreSQL",
  },
  MENTEE_1: {
    email: "test-mentee-1@test.com",
    password: "testpass123",
    name: "테스트 멘티 1",
    role: "mentee" as const,
    bio: "React를 배우고 싶은 초보 개발자입니다.",
  },
  MENTEE_2: {
    email: "test-mentee-2@test.com",
    password: "testpass123",
    name: "테스트 멘티 2",
    role: "mentee" as const,
    bio: "Python을 배우고 싶습니다.",
  },
};

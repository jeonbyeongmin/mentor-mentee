import { test, expect } from "@playwright/test";
import { TestHelper, TEST_USERS } from "./helpers/test-helper";

test.describe("전체 시나리오 통합 테스트", () => {
  test("멘토-멘티 매칭 전체 플로우", async ({ page }) => {
    const helper = new TestHelper(page);

    // 1. 멘토 회원가입 및 프로필 설정
    await helper.createUser(TEST_USERS.MENTOR_1);
    await helper.login(TEST_USERS.MENTOR_1.email, TEST_USERS.MENTOR_1.password);
    await helper.setupMentorProfile(
      TEST_USERS.MENTOR_1.bio,
      TEST_USERS.MENTOR_1.skills
    );
    await helper.logout();

    // 2. 멘티 회원가입 및 프로필 설정
    await helper.createUser(TEST_USERS.MENTEE_1);
    await helper.login(TEST_USERS.MENTEE_1.email, TEST_USERS.MENTEE_1.password);
    await helper.setupMenteeProfile(TEST_USERS.MENTEE_1.bio);

    // 3. 멘토 목록 확인 및 매칭 요청
    await page.goto("/mentors");
    await expect(
      page.locator(`text=${TEST_USERS.MENTOR_1.name}`)
    ).toBeVisible();
    await helper.sendMatchRequest(
      TEST_USERS.MENTOR_1.name,
      "안녕하세요! 멘토링을 받고 싶습니다."
    );

    // 4. 요청 전송 확인
    await page.goto("/requests");
    await page.click('button:has-text("나가는 요청")');
    await expect(page.locator("text=pending")).toBeVisible();
    await helper.logout();

    // 5. 멘토로 로그인하여 요청 확인 및 수락
    await helper.login(TEST_USERS.MENTOR_1.email, TEST_USERS.MENTOR_1.password);
    await page.goto("/requests");
    await page.click('button:has-text("들어오는 요청")');
    await expect(
      page.locator(`text=${TEST_USERS.MENTEE_1.name}`)
    ).toBeVisible();
    await page.click('button:has-text("수락")');

    // 6. 수락 상태 확인
    await expect(page.locator("text=accepted")).toBeVisible();

    // 7. 멘티가 수락된 상태 확인
    await helper.logout();
    await helper.login(TEST_USERS.MENTEE_1.email, TEST_USERS.MENTEE_1.password);
    await page.goto("/requests");
    await page.click('button:has-text("나가는 요청")');
    await expect(page.locator("text=accepted")).toBeVisible();
  });

  test("멘토는 한 번에 하나의 요청만 수락할 수 있다", async ({ page }) => {
    const helper = new TestHelper(page);

    // 1. 멘토 생성
    const mentor = TestHelper.createTestMentor("단일 수락 테스트 멘토");
    await helper.createUser(mentor);
    await helper.login(mentor.email, mentor.password);
    await helper.setupMentorProfile("테스트 멘토입니다.", "React, Node.js");
    await helper.logout();

    // 2. 첫 번째 멘티 생성 및 요청
    const mentee1 = TestHelper.createTestMentee("첫 번째 멘티");
    await helper.createUser(mentee1);
    await helper.login(mentee1.email, mentee1.password);
    await helper.sendMatchRequest(mentor.name, "첫 번째 요청입니다.");
    await helper.logout();

    // 3. 두 번째 멘티 생성 및 요청
    const mentee2 = TestHelper.createTestMentee("두 번째 멘티");
    await helper.createUser(mentee2);
    await helper.login(mentee2.email, mentee2.password);
    await helper.sendMatchRequest(mentor.name, "두 번째 요청입니다.");
    await helper.logout();

    // 4. 멘토가 첫 번째 요청 수락
    await helper.login(mentor.email, mentor.password);
    await page.goto("/requests");
    await page.click('button:has-text("들어오는 요청")');

    // 첫 번째 요청 수락
    const firstRequestRow = page
      .locator(`text=${mentee1.name}`)
      .locator("..")
      .locator("..");
    await firstRequestRow.locator('button:has-text("수락")').click();

    // 5. 두 번째 요청이 자동으로 거절되었는지 확인
    await expect(
      page
        .locator(`text=${mentee2.name}`)
        .locator("..")
        .locator("text=rejected")
    ).toBeVisible();
  });

  test("기술 스택 필터링이 올바르게 작동한다", async ({ page }) => {
    const helper = new TestHelper(page);

    // 1. 다양한 기술 스택을 가진 멘토들 생성
    const reactMentor = TestHelper.createTestMentor("React 전문 멘토");
    await helper.createUser(reactMentor);
    await helper.login(reactMentor.email, reactMentor.password);
    await helper.setupMentorProfile(
      "React 전문가입니다.",
      "React, JavaScript, TypeScript"
    );
    await helper.logout();

    const pythonMentor = TestHelper.createTestMentor("Python 전문 멘토");
    await helper.createUser(pythonMentor);
    await helper.login(pythonMentor.email, pythonMentor.password);
    await helper.setupMentorProfile(
      "Python 전문가입니다.",
      "Python, Django, FastAPI"
    );
    await helper.logout();

    // 2. 멘티로 로그인하여 필터링 테스트
    const mentee = TestHelper.createTestMentee("필터링 테스트 멘티");
    await helper.createUser(mentee);
    await helper.login(mentee.email, mentee.password);

    await page.goto("/mentors");

    // React 필터링
    await page.fill('input[placeholder*="기술 스택"]', "React");
    await page.click('button:has-text("검색")');

    await expect(page.locator(`text=${reactMentor.name}`)).toBeVisible();
    await expect(page.locator(`text=${pythonMentor.name}`)).not.toBeVisible();

    // 필터 초기화
    await page.fill('input[placeholder*="기술 스택"]', "");
    await page.click('button:has-text("검색")');

    // Python 필터링
    await page.fill('input[placeholder*="기술 스택"]', "Python");
    await page.click('button:has-text("검색")');

    await expect(page.locator(`text=${pythonMentor.name}`)).toBeVisible();
    await expect(page.locator(`text=${reactMentor.name}`)).not.toBeVisible();
  });

  test("인증이 필요한 페이지들에 대한 접근 제어", async ({ page }) => {
    const helper = new TestHelper(page);

    // 1. 미인증 상태에서 보호된 페이지 접근 시도
    const protectedRoutes = ["/profile", "/mentors", "/requests"];

    for (const route of protectedRoutes) {
      await page.goto(route);
      // 로그인 페이지로 리다이렉트되어야 함
      await expect(page).toHaveURL("/login");
    }

    // 2. 멘토로 로그인 후 접근 가능 확인
    const mentor = TestHelper.createTestMentor("접근 제어 테스트 멘토");
    await helper.createUser(mentor);
    await helper.login(mentor.email, mentor.password);

    for (const route of protectedRoutes) {
      await page.goto(route);
      // 로그인 페이지로 리다이렉트되지 않아야 함
      await expect(page).not.toHaveURL("/login");
    }

    // 3. 멘티 전용 기능 확인
    await helper.logout();
    const mentee = TestHelper.createTestMentee("접근 제어 테스트 멘티");
    await helper.createUser(mentee);
    await helper.login(mentee.email, mentee.password);

    // 멘티는 멘토 목록에 접근 가능해야 함
    await page.goto("/mentors");
    await expect(page.locator('h1:has-text("멘토 목록")')).toBeVisible();
  });

  test("프로필 이미지 업로드 기능", async ({ page }) => {
    const helper = new TestHelper(page);
    const mentor = TestHelper.createTestMentor("이미지 테스트 멘토");

    await helper.createUser(mentor);
    await helper.login(mentor.email, mentor.password);

    // 프로필 수정 페이지로 이동
    await page.click('button:has-text("프로필 수정")');

    // 기본 이미지가 표시되는지 확인
    await expect(page.locator('img[alt="프로필 이미지"]')).toBeVisible();

    // 파일 업로드 필드 확인
    await expect(page.locator('input[type="file"]')).toBeVisible();

    // 실제 파일 업로드는 테스트 환경에서는 mock으로 처리
    // 여기서는 UI 요소가 존재하는지만 확인
  });
});

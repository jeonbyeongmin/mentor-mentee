import { test, expect } from "@playwright/test";

test.describe("매칭 요청 테스트", () => {
  let mentorEmail: string;
  let menteeEmail: string;

  test.beforeAll(async ({ browser }) => {
    mentorEmail = `mentor-${Date.now()}@test.com`;
    menteeEmail = `mentee-${Date.now()}@test.com`;

    const context = await browser.newContext();
    const page = await context.newPage();

    // 멘토 생성
    await page.goto("/signup");
    await page.fill('input[name="email"]', mentorEmail);
    await page.fill('input[name="password"]', "testpass123");
    await page.fill('input[name="name"]', "매칭 테스트 멘토");
    await page.selectOption('select[name="role"]', "mentor");
    await page.click('button[type="submit"]');

    await page.goto("/login");
    await page.fill('input[name="email"]', mentorEmail);
    await page.fill('input[name="password"]', "testpass123");
    await page.click('button[type="submit"]');

    await page.click('button:has-text("프로필 수정")');
    await page.fill('textarea[name="bio"]', "매칭 테스트용 멘토입니다.");
    await page.fill('input[name="skills"]', "React, Node.js");
    await page.click('button[type="submit"]');

    // 멘티 생성
    await page.goto("/signup");
    await page.fill('input[name="email"]', menteeEmail);
    await page.fill('input[name="password"]', "testpass123");
    await page.fill('input[name="name"]', "매칭 테스트 멘티");
    await page.selectOption('select[name="role"]', "mentee");
    await page.click('button[type="submit"]');

    await context.close();
  });

  test("멘티가 멘토에게 매칭 요청을 보낼 수 있다", async ({ page }) => {
    // 멘티로 로그인
    await page.goto("/login");
    await page.fill('input[name="email"]', menteeEmail);
    await page.fill('input[name="password"]', "testpass123");
    await page.click('button[type="submit"]');

    // 멘토 목록 페이지로 이동
    await page.goto("/mentors");

    // 멘토 선택 및 매칭 요청
    await page.click("text=매칭 테스트 멘토");
    await page.fill(
      'textarea[name="message"]',
      "안녕하세요! 멘토링을 받고 싶습니다."
    );
    await page.click('button:has-text("매칭 요청")');

    // 성공 메시지 확인
    await expect(page.locator("text=매칭 요청이 전송되었습니다")).toBeVisible();
  });

  test("멘티가 본인의 요청 목록을 볼 수 있다", async ({ page }) => {
    // 멘티로 로그인
    await page.goto("/login");
    await page.fill('input[name="email"]', menteeEmail);
    await page.fill('input[name="password"]', "testpass123");
    await page.click('button[type="submit"]');

    // 요청 관리 페이지로 이동
    await page.goto("/requests");

    // 나가는 요청 탭 확인
    await page.click('button:has-text("나가는 요청")');

    // 전송한 요청 확인
    await expect(page.locator("text=매칭 테스트 멘토")).toBeVisible();
    await expect(page.locator("text=pending")).toBeVisible();
  });

  test("멘토가 받은 요청 목록을 볼 수 있다", async ({ page }) => {
    // 멘토로 로그인
    await page.goto("/login");
    await page.fill('input[name="email"]', mentorEmail);
    await page.fill('input[name="password"]', "testpass123");
    await page.click('button[type="submit"]');

    // 요청 관리 페이지로 이동
    await page.goto("/requests");

    // 들어오는 요청 탭 확인
    await page.click('button:has-text("들어오는 요청")');

    // 받은 요청 확인
    await expect(page.locator("text=매칭 테스트 멘티")).toBeVisible();
    await expect(
      page.locator("text=안녕하세요! 멘토링을 받고 싶습니다.")
    ).toBeVisible();
  });

  test("멘토가 요청을 수락할 수 있다", async ({ page }) => {
    // 멘토로 로그인
    await page.goto("/login");
    await page.fill('input[name="email"]', mentorEmail);
    await page.fill('input[name="password"]', "testpass123");
    await page.click('button[type="submit"]');

    // 요청 관리 페이지로 이동
    await page.goto("/requests");
    await page.click('button:has-text("들어오는 요청")');

    // 요청 수락
    await page.click('button:has-text("수락")');

    // 수락된 상태 확인
    await expect(page.locator("text=accepted")).toBeVisible();
  });

  test("멘토가 요청을 거절할 수 있다", async ({ page }) => {
    // 새로운 멘티 생성 및 요청 전송
    const newMenteeEmail = `mentee-reject-${Date.now()}@test.com`;

    // 새 멘티 회원가입
    await page.goto("/signup");
    await page.fill('input[name="email"]', newMenteeEmail);
    await page.fill('input[name="password"]', "testpass123");
    await page.fill('input[name="name"]', "거절 테스트 멘티");
    await page.selectOption('select[name="role"]', "mentee");
    await page.click('button[type="submit"]');

    // 새 멘티로 로그인 및 요청 전송
    await page.goto("/login");
    await page.fill('input[name="email"]', newMenteeEmail);
    await page.fill('input[name="password"]', "testpass123");
    await page.click('button[type="submit"]');

    await page.goto("/mentors");
    await page.click("text=매칭 테스트 멘토");
    await page.fill('textarea[name="message"]', "거절 테스트 요청입니다.");
    await page.click('button:has-text("매칭 요청")');

    // 멘토로 로그인
    await page.goto("/login");
    await page.fill('input[name="email"]', mentorEmail);
    await page.fill('input[name="password"]', "testpass123");
    await page.click('button[type="submit"]');

    await page.goto("/requests");
    await page.click('button:has-text("들어오는 요청")');

    // 요청 거절
    await page.click('button:has-text("거절")');

    // 거절된 상태 확인
    await expect(page.locator("text=rejected")).toBeVisible();
  });

  test("멘티가 요청을 취소할 수 있다", async ({ page }) => {
    // 새로운 멘티 및 요청 생성
    const cancelMenteeEmail = `mentee-cancel-${Date.now()}@test.com`;

    await page.goto("/signup");
    await page.fill('input[name="email"]', cancelMenteeEmail);
    await page.fill('input[name="password"]', "testpass123");
    await page.fill('input[name="name"]', "취소 테스트 멘티");
    await page.selectOption('select[name="role"]', "mentee");
    await page.click('button[type="submit"]');

    await page.goto("/login");
    await page.fill('input[name="email"]', cancelMenteeEmail);
    await page.fill('input[name="password"]', "testpass123");
    await page.click('button[type="submit"]');

    await page.goto("/mentors");
    await page.click("text=매칭 테스트 멘토");
    await page.fill('textarea[name="message"]', "취소 테스트 요청입니다.");
    await page.click('button:has-text("매칭 요청")');

    // 요청 취소
    await page.goto("/requests");
    await page.click('button:has-text("나가는 요청")');
    await page.click('button:has-text("취소")');

    // 취소된 상태 확인
    await expect(page.locator("text=cancelled")).toBeVisible();
  });

  test("멘티는 이미 pending 요청이 있으면 새 요청을 보낼 수 없다", async ({
    page,
  }) => {
    // 새로운 멘토 생성
    const newMentorEmail = `mentor-duplicate-${Date.now()}@test.com`;

    const context = await page.context().browser()!.newContext();
    const setupPage = await context.newPage();

    await setupPage.goto("/signup");
    await setupPage.fill('input[name="email"]', newMentorEmail);
    await setupPage.fill('input[name="password"]', "testpass123");
    await setupPage.fill('input[name="name"]', "중복 테스트 멘토");
    await setupPage.selectOption('select[name="role"]', "mentor");
    await setupPage.click('button[type="submit"]');

    await context.close();

    // 새로운 멘티 생성 및 첫 번째 요청 전송
    const duplicateMenteeEmail = `mentee-duplicate-${Date.now()}@test.com`;

    await page.goto("/signup");
    await page.fill('input[name="email"]', duplicateMenteeEmail);
    await page.fill('input[name="password"]', "testpass123");
    await page.fill('input[name="name"]', "중복 테스트 멘티");
    await page.selectOption('select[name="role"]', "mentee");
    await page.click('button[type="submit"]');

    await page.goto("/login");
    await page.fill('input[name="email"]', duplicateMenteeEmail);
    await page.fill('input[name="password"]', "testpass123");
    await page.click('button[type="submit"]');

    // 첫 번째 멘토에게 요청 전송
    await page.goto("/mentors");
    await page.click("text=매칭 테스트 멘토");
    await page.fill('textarea[name="message"]', "첫 번째 요청입니다.");
    await page.click('button:has-text("매칭 요청")');

    // 두 번째 멘토에게 요청 시도 (실패해야 함)
    await page.goto("/mentors");
    await page.click("text=중복 테스트 멘토");
    await page.fill('textarea[name="message"]', "두 번째 요청입니다.");
    await page.click('button:has-text("매칭 요청")');

    // 오류 메시지 확인
    await expect(
      page.locator("text=이미 진행 중인 요청이 있습니다")
    ).toBeVisible();
  });
});

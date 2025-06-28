import { test, expect } from "@playwright/test";

test.describe("프로필 관련 테스트", () => {
  // 멘토 로그인 상태 설정
  test.beforeEach(async ({ page }) => {
    // 먼저 멘토로 회원가입
    await page.goto("/signup");
    await page.fill('input[name="email"]', "mentor-profile@test.com");
    await page.fill('input[name="password"]', "testpass123");
    await page.fill('input[name="name"]', "프로필 테스트 멘토");
    await page.selectOption('select[name="role"]', "mentor");
    await page.click('button[type="submit"]');

    // 로그인
    await page.goto("/login");
    await page.fill('input[name="email"]', "mentor-profile@test.com");
    await page.fill('input[name="password"]', "testpass123");
    await page.click('button[type="submit"]');

    // 프로필 페이지로 이동 확인
    await expect(page).toHaveURL("/profile");
  });

  test("멘토가 프로필을 수정할 수 있다", async ({ page }) => {
    // 프로필 수정 버튼 클릭
    await page.click('button:has-text("프로필 수정")');

    // 프로필 정보 입력
    await page.fill('input[name="name"]', "수정된 멘토 이름");
    await page.fill('textarea[name="bio"]', "멘토 소개글입니다.");
    await page.fill('input[name="skills"]', "React, TypeScript, Node.js");

    // 저장 버튼 클릭
    await page.click('button[type="submit"]');

    // 수정된 정보 확인
    await expect(page.locator("text=수정된 멘토 이름")).toBeVisible();
    await expect(page.locator("text=멘토 소개글입니다.")).toBeVisible();
    await expect(page.locator("text=React, TypeScript, Node.js")).toBeVisible();
  });

  test("멘토 프로필에 기술 스택이 표시된다", async ({ page }) => {
    // 프로필 수정
    await page.click('button:has-text("프로필 수정")');
    await page.fill('input[name="skills"]', "JavaScript, Python, Docker");
    await page.click('button[type="submit"]');

    // 기술 스택 확인
    await expect(page.locator("text=JavaScript")).toBeVisible();
    await expect(page.locator("text=Python")).toBeVisible();
    await expect(page.locator("text=Docker")).toBeVisible();
  });
});

test.describe("멘티 프로필 테스트", () => {
  test.beforeEach(async ({ page }) => {
    // 멘티로 회원가입 및 로그인
    await page.goto("/signup");
    await page.fill('input[name="email"]', "mentee-profile@test.com");
    await page.fill('input[name="password"]', "testpass123");
    await page.fill('input[name="name"]', "프로필 테스트 멘티");
    await page.selectOption('select[name="role"]', "mentee");
    await page.click('button[type="submit"]');

    await page.goto("/login");
    await page.fill('input[name="email"]', "mentee-profile@test.com");
    await page.fill('input[name="password"]', "testpass123");
    await page.click('button[type="submit"]');
  });

  test("멘티가 프로필을 수정할 수 있다", async ({ page }) => {
    // 프로필 수정 버튼 클릭
    await page.click('button:has-text("프로필 수정")');

    // 프로필 정보 입력 (멘티는 기술 스택 필드가 없어야 함)
    await page.fill('input[name="name"]', "수정된 멘티 이름");
    await page.fill('textarea[name="bio"]', "멘티 소개글입니다.");

    // 기술 스택 필드가 없는지 확인
    await expect(page.locator('input[name="skills"]')).not.toBeVisible();

    // 저장 버튼 클릭
    await page.click('button[type="submit"]');

    // 수정된 정보 확인
    await expect(page.locator("text=수정된 멘티 이름")).toBeVisible();
    await expect(page.locator("text=멘티 소개글입니다.")).toBeVisible();
  });
});

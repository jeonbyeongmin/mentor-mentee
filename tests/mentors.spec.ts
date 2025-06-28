import { test, expect } from "@playwright/test";

test.describe("멘토 목록 및 검색 테스트", () => {
  test.beforeAll(async ({ browser }) => {
    // 테스트용 멘토들 생성
    const context = await browser.newContext();
    const page = await context.newPage();

    // 멘토 1 생성
    await page.goto("/signup");
    await page.fill('input[name="email"]', "mentor1@test.com");
    await page.fill('input[name="password"]', "testpass123");
    await page.fill('input[name="name"]', "리액트 멘토");
    await page.selectOption('select[name="role"]', "mentor");
    await page.click('button[type="submit"]');

    await page.goto("/login");
    await page.fill('input[name="email"]', "mentor1@test.com");
    await page.fill('input[name="password"]', "testpass123");
    await page.click('button[type="submit"]');

    await page.click('button:has-text("프로필 수정")');
    await page.fill('textarea[name="bio"]', "리액트 전문 멘토입니다.");
    await page.fill('input[name="skills"]', "React, JavaScript, TypeScript");
    await page.click('button[type="submit"]');

    // 멘토 2 생성
    await page.goto("/signup");
    await page.fill('input[name="email"]', "mentor2@test.com");
    await page.fill('input[name="password"]', "testpass123");
    await page.fill('input[name="name"]', "파이썬 멘토");
    await page.selectOption('select[name="role"]', "mentor");
    await page.click('button[type="submit"]');

    await page.goto("/login");
    await page.fill('input[name="email"]', "mentor2@test.com");
    await page.fill('input[name="password"]', "testpass123");
    await page.click('button[type="submit"]');

    await page.click('button:has-text("프로필 수정")');
    await page.fill('textarea[name="bio"]', "파이썬 백엔드 전문가입니다.");
    await page.fill('input[name="skills"]', "Python, Django, PostgreSQL");
    await page.click('button[type="submit"]');

    await context.close();
  });

  test.beforeEach(async ({ page }) => {
    // 멘티로 로그인
    await page.goto("/signup");
    await page.fill('input[name="email"]', "mentee-search@test.com");
    await page.fill('input[name="password"]', "testpass123");
    await page.fill('input[name="name"]', "검색 테스트 멘티");
    await page.selectOption('select[name="role"]', "mentee");
    await page.click('button[type="submit"]');

    await page.goto("/login");
    await page.fill('input[name="email"]', "mentee-search@test.com");
    await page.fill('input[name="password"]', "testpass123");
    await page.click('button[type="submit"]');
  });

  test("멘티가 멘토 목록 페이지에 접근할 수 있다", async ({ page }) => {
    await page.goto("/mentors");

    // 멘토 목록 페이지 확인
    await expect(page.locator('h1:has-text("멘토 목록")')).toBeVisible();
  });

  test("멘토 목록에 등록된 멘토들이 표시된다", async ({ page }) => {
    await page.goto("/mentors");

    // 등록된 멘토들 확인
    await expect(page.locator("text=리액트 멘토")).toBeVisible();
    await expect(page.locator("text=파이썬 멘토")).toBeVisible();
  });

  test("기술 스택으로 멘토를 검색할 수 있다", async ({ page }) => {
    await page.goto("/mentors");

    // React로 검색
    await page.fill('input[placeholder="기술 스택으로 검색..."]', "React");
    await page.click('button:has-text("검색")');

    // 리액트 멘토만 표시되는지 확인
    await expect(page.locator("text=리액트 멘토")).toBeVisible();
    await expect(page.locator("text=파이썬 멘토")).not.toBeVisible();
  });

  test("멘토 이름으로 검색할 수 있다", async ({ page }) => {
    await page.goto("/mentors");

    // 멘토 이름으로 검색
    await page.fill('input[placeholder="멘토 이름으로 검색..."]', "파이썬");
    await page.click('button:has-text("검색")');

    // 파이썬 멘토만 표시되는지 확인
    await expect(page.locator("text=파이썬 멘토")).toBeVisible();
    await expect(page.locator("text=리액트 멘토")).not.toBeVisible();
  });

  test("멘토 목록을 정렬할 수 있다", async ({ page }) => {
    await page.goto("/mentors");

    // 이름순으로 정렬
    await page.selectOption('select[name="sortBy"]', "name");

    // 정렬된 결과 확인 (가나다순)
    const mentorNames = await page
      .locator('[data-testid="mentor-name"]')
      .allTextContents();
    expect(mentorNames).toEqual(mentorNames.sort());
  });
});

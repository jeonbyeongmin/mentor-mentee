import { test, expect } from "@playwright/test";

test.describe("인증 관련 테스트", () => {
  test("회원가입 페이지에서 멘토로 회원가입할 수 있다", async ({ page }) => {
    await page.goto("/signup");

    // 회원가입 폼 입력
    await page.fill('input[name="email"]', "mentor@test.com");
    await page.fill('input[name="password"]', "testpass123");
    await page.fill('input[name="name"]', "테스트 멘토");
    await page.selectOption('select[name="role"]', "mentor");

    // 회원가입 버튼 클릭
    await page.click('button[type="submit"]');

    // 로그인 페이지로 리다이렉트 확인
    await expect(page).toHaveURL("/login");
  });

  test("회원가입 페이지에서 멘티로 회원가입할 수 있다", async ({ page }) => {
    await page.goto("/signup");

    // 회원가입 폼 입력
    await page.fill('input[name="email"]', "mentee@test.com");
    await page.fill('input[name="password"]', "testpass123");
    await page.fill('input[name="name"]', "테스트 멘티");
    await page.selectOption('select[name="role"]', "mentee");

    // 회원가입 버튼 클릭
    await page.click('button[type="submit"]');

    // 로그인 페이지로 리다이렉트 확인
    await expect(page).toHaveURL("/login");
  });

  test("로그인 페이지에서 로그인할 수 있다", async ({ page }) => {
    await page.goto("/login");

    // 로그인 폼 입력
    await page.fill('input[name="email"]', "mentor@test.com");
    await page.fill('input[name="password"]', "testpass123");

    // 로그인 버튼 클릭
    await page.click('button[type="submit"]');

    // 프로필 페이지로 리다이렉트 확인
    await expect(page).toHaveURL("/profile");
  });

  test("미인증 사용자가 루트 페이지 접근 시 로그인 페이지로 리다이렉트된다", async ({
    page,
  }) => {
    await page.goto("/");

    // 로그인 페이지로 리다이렉트 확인
    await expect(page).toHaveURL("/login");
  });

  test("잘못된 로그인 정보로 로그인 시 오류 메시지가 표시된다", async ({
    page,
  }) => {
    await page.goto("/login");

    // 잘못된 로그인 정보 입력
    await page.fill('input[name="email"]', "wrong@test.com");
    await page.fill('input[name="password"]', "wrongpass");

    // 로그인 버튼 클릭
    await page.click('button[type="submit"]');

    // 오류 메시지 확인
    await expect(page.locator("text=로그인에 실패했습니다")).toBeVisible();
  });
});

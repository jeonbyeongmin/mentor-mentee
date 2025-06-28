# 멘토-멘티 매칭 앱 E2E 테스트

이 프로젝트는 Playwright를 사용하여 엔드투엔드 테스트를 구현합니다.

## 테스트 구성

### 테스트 파일 구조

```
tests/
├── auth.spec.ts          # 인증 관련 테스트
├── profile.spec.ts       # 프로필 관련 테스트
├── mentors.spec.ts       # 멘토 목록 및 검색 테스트
├── matching.spec.ts      # 매칭 요청 관련 테스트
├── integration.spec.ts   # 통합 테스트
└── helpers/
    └── test-helper.ts    # 테스트 헬퍼 함수들
```

### 테스트 시나리오

#### 1. 인증 테스트 (`auth.spec.ts`)

- 멘토/멘티 회원가입
- 로그인/로그아웃
- 미인증 사용자 리다이렉트
- 잘못된 로그인 정보 처리

#### 2. 프로필 테스트 (`profile.spec.ts`)

- 멘토 프로필 수정 (이름, 소개글, 기술 스택)
- 멘티 프로필 수정 (이름, 소개글)
- 프로필 이미지 업로드

#### 3. 멘토 목록 테스트 (`mentors.spec.ts`)

- 멘토 목록 조회
- 기술 스택으로 멘토 검색
- 멘토 이름으로 검색
- 멘토 목록 정렬

#### 4. 매칭 요청 테스트 (`matching.spec.ts`)

- 매칭 요청 전송
- 요청 목록 조회 (나가는/들어오는)
- 요청 수락/거절
- 요청 취소
- 중복 요청 방지

#### 5. 통합 테스트 (`integration.spec.ts`)

- 전체 매칭 플로우
- 멘토 단일 수락 제한
- 기술 스택 필터링
- 접근 권한 제어

## 테스트 실행

### 전제 조건

1. 프론트엔드와 백엔드 서버가 실행 중이어야 합니다.
2. 브라우저가 설치되어 있어야 합니다.

### 명령어

#### 기본 테스트 실행

```bash
npm run test:e2e
```

#### UI 모드로 테스트 실행

```bash
npm run test:e2e:ui
```

#### 디버그 모드로 테스트 실행

```bash
npm run test:e2e:debug
```

#### 헤드 모드로 테스트 실행 (브라우저 화면 표시)

```bash
npm run test:e2e:headed
```

#### 특정 브라우저에서만 테스트 실행

```bash
npm run test:e2e:chromium   # Chrome
npm run test:e2e:firefox    # Firefox
npm run test:e2e:webkit     # Safari
```

#### 특정 테스트 파일만 실행

```bash
npx playwright test tests/auth.spec.ts
```

#### 특정 테스트 케이스만 실행

```bash
npx playwright test -g "로그인"
```

### 브라우저 설치

```bash
npm run test:e2e:install
```

## 테스트 설정

### Playwright 설정 (`playwright.config.ts`)

- 베이스 URL: `http://localhost:3000`
- 백엔드 서버: `http://localhost:8080`
- 자동 서버 시작/종료
- 3개 브라우저 지원 (Chrome, Firefox, Safari)

### 테스트 데이터

- 테스트 실행 시 임시 사용자들이 생성됩니다
- 각 테스트는 독립적으로 실행되도록 설계되었습니다
- 테스트용 이메일 주소에는 타임스탬프가 포함됩니다

## 테스트 헬퍼

### TestHelper 클래스

테스트에서 공통으로 사용하는 기능들을 제공합니다:

- `createUser()`: 사용자 생성
- `login()`: 로그인
- `setupMentorProfile()`: 멘토 프로필 설정
- `setupMenteeProfile()`: 멘티 프로필 설정
- `sendMatchRequest()`: 매칭 요청 전송
- `logout()`: 로그아웃

### 사용 예시

```typescript
import { TestHelper } from "./helpers/test-helper";

test("테스트 예시", async ({ page }) => {
  const helper = new TestHelper(page);

  const mentor = TestHelper.createTestMentor("테스트 멘토");
  await helper.createUser(mentor);
  await helper.login(mentor.email, mentor.password);
  await helper.setupMentorProfile("소개글", "기술스택");
});
```

## CI/CD 통합

### GitHub Actions

```yaml
name: E2E Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm ci
      - run: npx playwright install --with-deps
      - run: npm run test:e2e
```

## 문제 해결

### 테스트 실패 시

1. **서버 연결 실패**: 프론트엔드와 백엔드가 실행 중인지 확인
2. **브라우저 미설치**: `npm run test:e2e:install` 실행
3. **포트 충돌**: 3000, 8080 포트가 사용 중인지 확인
4. **타임아웃**: 네트워크가 느린 경우 `playwright.config.ts`에서 타임아웃 증가

### 디버깅

```bash
# 브라우저 화면을 보면서 테스트
npm run test:e2e:headed

# 단계별 디버깅
npm run test:e2e:debug

# 특정 테스트만 실행
npx playwright test tests/auth.spec.ts --headed
```

### 테스트 리포트

테스트 실행 후 `playwright-report/` 폴더에 상세한 리포트가 생성됩니다.

```bash
npx playwright show-report
```

## 참고 자료

- [Playwright 공식 문서](https://playwright.dev/docs/intro)
- [멘토-멘티 앱 API 명세](./docs/mentor-mentee-api-spec.md)
- [사용자 스토리](./docs/mentor-mentee-app-user-stories.md)

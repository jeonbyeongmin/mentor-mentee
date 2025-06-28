# API 테스트 가이드

이 프로젝트는 멘토-멘티 매칭 앱의 백엔드 API에 대한 포괄적인 테스트 슈트를 제공합니다.

## 🧪 테스트 구조

### 테스트 파일들

- **`auth.test.ts`** - 인증 관련 API 테스트 (회원가입, 로그인)
- **`user.test.ts`** - 사용자 정보 관리 API 테스트 (프로필 조회/수정, 이미지)
- **`mentors.test.ts`** - 멘토 목록 조회 및 검색 API 테스트
- **`match-requests.test.ts`** - 매칭 요청 관련 API 테스트
- **`integration.test.ts`** - 전체 워크플로우 통합 테스트

### 테스트 환경 설정

- **`setup.ts`** - 테스트 환경 초기화 및 정리
- **`jest.config.json`** - Jest 설정 파일

## 🚀 테스트 실행 방법

### 1. 의존성 설치

```bash
cd backend
npm install
```

### 2. 테스트 실행

```bash
# 모든 테스트 실행
npm test

# 특정 테스트 파일 실행
npm test auth.test.ts
npm test user.test.ts
npm test mentors.test.ts
npm test match-requests.test.ts
npm test integration.test.ts

# 테스트 감시 모드 (파일 변경 시 자동 재실행)
npm run test:watch

# 테스트 커버리지 확인
npm run test:coverage
```

## 📊 테스트 커버리지

### 현재 테스트하는 API 엔드포인트

#### 인증 (Authentication)

- ✅ `POST /api/signup` - 회원가입
- ✅ `POST /api/login` - 로그인

#### 사용자 정보

- ✅ `GET /api/me` - 내 정보 조회
- ✅ `PUT /api/profile` - 프로필 수정
- ✅ `GET /api/images/:role/:id` - 프로필 이미지

#### 멘토 목록

- ✅ `GET /api/mentors` - 멘토 목록 조회
- ✅ `GET /api/mentors?skill=<skill>` - 스킬 기반 필터링
- ✅ `GET /api/mentors?order_by=<field>` - 정렬 기능

#### 매칭 요청

- ✅ `POST /api/match-requests` - 매칭 요청 보내기
- ✅ `GET /api/match-requests/incoming` - 받은 요청 목록
- ✅ `GET /api/match-requests/outgoing` - 보낸 요청 목록
- ✅ `PUT /api/match-requests/:id/accept` - 요청 수락
- ✅ `PUT /api/match-requests/:id/reject` - 요청 거절
- ✅ `DELETE /api/match-requests/:id` - 요청 취소

## 🔍 테스트 시나리오

### 1. 인증 테스트

- 멘토/멘티 회원가입 성공
- 로그인 성공/실패
- 잘못된 데이터 검증
- 중복 이메일 처리

### 2. 사용자 정보 테스트

- 인증된 사용자 정보 조회
- 프로필 수정 (멘토/멘티별)
- 권한 검증
- 이미지 업로드/조회

### 3. 멘토 목록 테스트

- 전체 멘토 목록 조회
- 스킬 기반 필터링
- 이름/스킬 기준 정렬
- 검색 결과 검증
- 권한 기반 접근 제어

### 4. 매칭 요청 테스트

- 매칭 요청 생성
- 요청 목록 조회 (받은/보낸)
- 요청 상태 변경 (수락/거절/취소)
- 권한 기반 작업 제한
- 존재하지 않는 리소스 처리

### 5. 통합 테스트

- 전체 멘토-멘티 매칭 플로우
- 회원가입 → 로그인 → 프로필 설정 → 매칭 요청 → 응답
- 에러 상황 처리

## 🛠️ 테스트 도구

- **Jest** - 테스트 프레임워크
- **Supertest** - HTTP 요청 테스트
- **TypeScript** - 타입 안전성
- **SQLite** - 테스트용 인메모리 데이터베이스

## 📝 테스트 작성 가이드

### 새로운 테스트 추가

1. 적절한 테스트 파일에 새 테스트 케이스 추가
2. 필요한 경우 새로운 테스트 파일 생성
3. `describe`와 `it` 블록으로 테스트 구조화
4. `beforeAll`/`beforeEach`로 테스트 데이터 설정
5. `afterAll`/`afterEach`로 정리 작업

### 테스트 베스트 프랙티스

- ✅ 각 테스트는 독립적이어야 함
- ✅ 명확하고 설명적인 테스트 이름 사용
- ✅ 성공/실패 케이스 모두 테스트
- ✅ 경계값 및 에러 상황 테스트
- ✅ 적절한 어설션 사용

## 🐛 트러블슈팅

### 일반적인 문제들

1. **테스트 데이터베이스 충돌**

   - 각 테스트 전후로 데이터베이스 초기화 확인
   - `setupTestDB()`와 `cleanupTestDB()` 사용

2. **비동기 작업 처리**

   - `async/await` 사용
   - 적절한 타임아웃 설정

3. **토큰 인증 실패**

   - 로그인 후 받은 토큰 사용
   - Authorization 헤더 형식 확인

4. **포트 충돌**
   - 테스트 환경에서는 서버가 자동으로 시작되지 않음
   - `NODE_ENV=test` 환경 변수 확인

## 📈 CI/CD 통합

이 테스트들은 지속적 통합 파이프라인에서 실행될 수 있도록 설계되었습니다:

```yaml
# GitHub Actions 예시
- name: Run API Tests
  run: |
    cd backend
    npm install
    npm test
```

## 🔄 업데이트 가이드

API 명세가 변경될 때 테스트 업데이트 방법:

1. 변경된 엔드포인트에 해당하는 테스트 파일 수정
2. 새로운 엔드포인트에 대한 테스트 추가
3. 응답 형식이 변경된 경우 어설션 업데이트
4. 통합 테스트에서 새로운 플로우 반영

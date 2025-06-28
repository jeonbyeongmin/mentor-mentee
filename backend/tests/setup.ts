import { execSync } from "child_process";
import path from "path";
import fs from "fs";
import { initializeDatabase } from "../src/database/init";

const TEST_DB_PATH = path.join(
  __dirname,
  "..",
  "src",
  "database",
  "test.sqlite"
);

// 환경 변수 설정
process.env.NODE_ENV = "test";
process.env.DB_PATH = TEST_DB_PATH;

export const setupTestDB = async () => {
  // 테스트 데이터베이스 초기화
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }

  // 새로운 데이터베이스 초기화
  await initializeDatabase();
};

export const cleanupTestDB = () => {
  // 테스트 데이터베이스 정리
  if (fs.existsSync(TEST_DB_PATH)) {
    fs.unlinkSync(TEST_DB_PATH);
  }
};

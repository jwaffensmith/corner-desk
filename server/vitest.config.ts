import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    env: {
      DATABASE_URL: "postgresql://postgres:postgres@localhost:5434/cornerdesk_test",
    },
    pool: "forks",
    fileParallelism: false,
  },
});

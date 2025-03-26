import { $ } from "bun";

async function checkFormattingAndLinting() {
  try {
    console.log("🔍 Checking TypeScript formatting...");
    await $`bunx prettier --check "**/*.{ts,tsx}"`;

    console.log("🔍 Checking TypeScript linting...");
    await $`bunx eslint "**/*.{ts,tsx}" --max-warnings=0`;

    console.log("✅ TypeScript formatting and linting checks passed!");
  } catch {
    console.error("❌ Formatting or linting issues detected.");
    process.exit(1);
  }
}

checkFormattingAndLinting();

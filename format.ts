import { $ } from "bun";

async function formatAndFix() {
  try {
    console.log("🛠 Formatting TypeScript files with Prettier...");
    await $`bunx prettier --write "**/*.{ts,tsx}"`;

    console.log("🛠 Fixing TypeScript linting issues with ESLint...");
    await $`bunx eslint "**/*.{ts,tsx}" --fix`;

    console.log("✅ Formatting and linting fixes applied!");
  } catch {
    console.error("❌ Failed to format or fix linting issues.");
    process.exit(1);
  }
}

formatAndFix();

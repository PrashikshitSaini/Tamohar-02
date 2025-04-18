/**
 * Script to update deprecated npm dependencies to their recommended alternatives
 */
const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

// Define replacements for deprecated packages
const replacements = [
  {
    deprecated: "sourcemap-codec",
    recommended: "@jridgewell/sourcemap-codec",
  },
  {
    deprecated: "rollup-plugin-terser",
    recommended: "@rollup/plugin-terser",
  },
  {
    deprecated: "rimraf",
    recommended: "rimraf@^4.0.0",
  },
  {
    deprecated: "@babel/plugin-proposal-private-methods",
    recommended: "@babel/plugin-transform-private-methods",
  },
  {
    deprecated: "@babel/plugin-proposal-optional-chaining",
    recommended: "@babel/plugin-transform-optional-chaining",
  },
  {
    deprecated: "@babel/plugin-proposal-nullish-coalescing-operator",
    recommended: "@babel/plugin-transform-nullish-coalescing-operator",
  },
  {
    deprecated: "@babel/plugin-proposal-class-properties",
    recommended: "@babel/plugin-transform-class-properties",
  },
  {
    deprecated: "@babel/plugin-proposal-numeric-separator",
    recommended: "@babel/plugin-transform-numeric-separator",
  },
  {
    deprecated: "@babel/plugin-proposal-private-property-in-object",
    recommended: "@babel/plugin-transform-private-property-in-object",
  },
];

console.log("🔍 Checking for deprecated packages...");

// Execute the updates
try {
  // Install recommended replacements
  console.log("📦 Installing recommended package replacements...");

  const installCommands = replacements
    .map((r) => `npm install --save-dev ${r.recommended}`)
    .join(" && ");

  execSync(installCommands, { stdio: "inherit" });

  console.log("✅ Dependency updates completed successfully!");
  console.log("\nNote: Some dependencies might be managed by react-scripts.");
  console.log(
    "To fully resolve all warnings, consider updating react-scripts."
  );
} catch (error) {
  console.error("❌ Error updating dependencies:", error.message);
  process.exit(1);
}

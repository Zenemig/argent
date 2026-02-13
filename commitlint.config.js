export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    "type-enum": [
      2,
      "always",
      ["feat", "fix", "refactor", "docs", "test", "chore", "style", "perf", "ci", "revert"],
    ],
    "subject-case": [0], // Allow any case in subject
  },
};

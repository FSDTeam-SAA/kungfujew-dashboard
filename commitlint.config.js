module.exports = {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // keep structure
    "type-enum": [
      2,
      "always",
      [
        "build",
        "chore",
        "ci",
        "docs",
        "feat",
        "fix",
        "perf",
        "refactor",
        "revert",
        "style",
        "test",
        "translation",
        "security",
        "changeset",
      ],
    ],

    // relax annoying rules
    "subject-case": [0],
    "subject-full-stop": [0],
    "header-max-length": [0],

    // keep sanity checks
    "type-empty": [2, "never"],
    "subject-empty": [2, "never"],
  },
};

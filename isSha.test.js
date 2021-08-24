const isSha = require("./isSha");

test("returns false if a non-sha is provided", () => {
  const actual = isSha({
    currentVersion: "main",
  });
  expect(actual).toBe(false);
});

test("returns true if a sha is provided", () => {
  const actual = isSha({
    currentVersion: "1cb496d922065fc73c8f2ff3cc33d9b251ef1aa7",
  });
  expect(actual).toBe(true);
});

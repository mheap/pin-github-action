import isSha from "./isSha";

test("returns false if a non-SHA is provided", () => {
  const actual = isSha({
    currentVersion: "main",
  });
  expect(actual).toBe(false);
});

test("returns true if a SHA is provided", () => {
  const actual = isSha({
    currentVersion: "1cb496d922065fc73c8f2ff3cc33d9b251ef1aa7",
  });
  expect(actual).toBe(true);
});

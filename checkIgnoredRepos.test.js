const checkIgnoredRepos = require("./checkIgnoredRepos");

test("empty allow list", () => {
  const actual = checkIgnoredRepos("mheap/demo", []);
  expect(actual).toBe(false);
});

test("no match", () => {
  expect(checkIgnoredRepos("mheap/demo", ["other/repo"])).toBe(false);
});

test("exact match", () => {
  expect(checkIgnoredRepos("mheap/demo", ["mheap/demo"])).toBe(true);
});

test("partial match", () => {
  expect(checkIgnoredRepos("mheap/demo", ["mheap/*"])).toBe(true);
});

test("no partial match", () => {
  expect(checkIgnoredRepos("other/demo", ["mheap/*"])).toBe(false);
});

test("multiple ignores", () => {
  expect(checkIgnoredRepos("mheap/demo", ["other", "mheap/*"])).toBe(true);
});

test("negative ignores", () => {
  expect(checkIgnoredRepos("other/demo", ["!mheap/*"])).toBe(true);
});

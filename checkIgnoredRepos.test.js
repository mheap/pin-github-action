const debug = require("debug")("pin-github-action-test");
const run = require("./checkAllowedRepos");
const checkAllowedRepos = (input, ignore) => {
  return run.apply(null, [input, ignore, debug]);
};

test("empty allow list", () => {
  const actual = checkAllowedRepos("mheap/demo", []);
  expect(actual).toBe(false);
});

test("no match", () => {
  expect(checkAllowedRepos("mheap/demo", ["other/repo"])).toBe(false);
});

test("exact match", () => {
  expect(checkAllowedRepos("mheap/demo", ["mheap/demo"])).toBe(true);
});

test("partial match", () => {
  expect(checkAllowedRepos("mheap/demo", ["mheap/*"])).toBe(true);
});

test("no partial match", () => {
  expect(checkAllowedRepos("other/demo", ["mheap/*"])).toBe(false);
});

test("multiple ignores", () => {
  expect(checkAllowedRepos("mheap/demo", ["other", "mheap/*"])).toBe(true);
});

test("negative ignores", () => {
  expect(checkAllowedRepos("other/demo", ["!mheap/*"])).toBe(true);
});

import { beforeEach, jest } from "@jest/globals";
import debugLib from "debug";
const debug = debugLib("pin-github-action-test");

jest.unstable_mockModule("fs/promises", () => ({
  stat: jest.fn(),
  writeFile: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
});

const fs = await import("fs/promises");
const { default: run } = await import("./addSecurity");

const addSecurity = async (filename, allowed) => {
  return run.apply(null, [filename, allowed, debug]);
};

test("writes config if file does not exist", async () => {
  fs.stat.mockImplementation(() => {
    return Promise.reject({ code: "ENOENT" });
  });
  fs.writeFile.mockImplementation(() => {
    return Promise.resolve();
  });
  const actual = await addSecurity(".github/workflows/security.yaml", []);
  expect(actual).toBe(true);
});

test("writes allowlisted config correctly", async () => {
  fs.stat.mockImplementation(() => {
    return Promise.reject({ code: "ENOENT" });
  });
  fs.writeFile.mockImplementation(() => {
    return Promise.resolve();
  });
  await addSecurity(".github/workflows/security.yaml", [
    "Demo1/*",
    "Demo2/*",
    "Demo3/*",
  ]);
  expect(fs.writeFile).toHaveBeenCalledWith(
    ".github/workflows/security.yaml",
    expect.stringContaining(`
        with:
          allowlist: |
            Demo1/
            Demo2/
            Demo3/`),
  );
});

import collectWorkflowFiles from "./collectWorkflowFiles.js";

test("collects all files from given path without duplicates", () => {
  const programArgs = ["__fixtures__/composite.yml", "__fixtures__/"];

  expect(collectWorkflowFiles(programArgs)).toEqual([
    "__fixtures__/composite.yml",
    "__fixtures__/reusable.yml",
    "__fixtures__/workflow.yml",
  ]);
});

test("collects all files from given path", () => {
  const programArgs = ["__fixtures__/"];

  expect(collectWorkflowFiles(programArgs)).toEqual([
    "__fixtures__/composite.yml",
    "__fixtures__/reusable.yml",
    "__fixtures__/workflow.yml",
  ]);
});

test("collects single file from given path", () => {
  const programArgs = ["__fixtures__/composite.yml"];

  expect(collectWorkflowFiles(programArgs)).toEqual([
    "__fixtures__/composite.yml",
  ]);
});

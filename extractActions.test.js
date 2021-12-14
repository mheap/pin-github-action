const extractActions = require("./extractActions");
const YAML = require("yaml");

test("extracts a single version", () => {
  const input = convertToAst({
    name: "PR",
    on: ["pull_request"],
    jobs: {
      "test-job": {
        "runs-on": "ubuntu-latest",
        steps: [
          {
            name: "Test Action Step",
            uses: "mheap/test-action@master",
          },
        ],
      },
    },
  });

  const actual = extractActions(input);

  expect(actual).toEqual([
    {
      owner: "mheap",
      repo: "test-action",
      path: "",
      currentVersion: "master",
      pinnedVersion: "master",
    },
  ]);
});

test("extracts a pinned version", () => {
  const input = YAML.parseDocument(`
    name: PR
    on:
      - pull_request
    jobs:
      test-job:
        runs-on: ubuntu-latest
        steps:
          - name: Test Action Step
            uses: "mheap/test-action@abc123" # pin@master`);

  const actual = extractActions(input);

  expect(actual).toEqual([
    {
      owner: "mheap",
      repo: "test-action",
      path: "",
      currentVersion: "abc123",
      pinnedVersion: "master",
    },
  ]);
});

test("extracts a single version in a subfolder", () => {
  const input = convertToAst({
    name: "PR",
    on: ["pull_request"],
    jobs: {
      "test-job": {
        "runs-on": "ubuntu-latest",
        steps: [
          {
            name: "Test Action Step",
            uses: "mheap/test-action/action-one/src@master",
          },
        ],
      },
    },
  });

  const actual = extractActions(input);
  expect(actual).toEqual([
    {
      owner: "mheap",
      repo: "test-action",
      path: "action-one/src",
      currentVersion: "master",
      pinnedVersion: "master",
    },
  ]);
});

test("extracts a complex version", () => {
  const input = convertToAst({
    name: "PR",
    on: ["pull_request"],
    jobs: {
      "test-job": {
        "runs-on": "ubuntu-latest",
        steps: [
          {
            name: "Test Action Step",
            uses: "mheap/test-action@master",
          },
          {
            name: "Another Step",
            uses: "mheap/second-action@v1",
          },
        ],
      },
      "separate-job": {
        "runs-on": "ubuntu-latest",
        steps: [
          {
            name: "Parallel Job Step",
            uses: "mheap/separate-action@v2.1.5",
          },
        ],
      },
    },
  });

  const actual = extractActions(input);
  expect(actual).toEqual([
    {
      owner: "mheap",
      repo: "test-action",
      path: "",
      currentVersion: "master",
      pinnedVersion: "master",
    },
    {
      owner: "mheap",
      repo: "second-action",
      path: "",
      currentVersion: "v1",
      pinnedVersion: "v1",
    },
    {
      owner: "mheap",
      repo: "separate-action",
      path: "",
      currentVersion: "v2.1.5",
      pinnedVersion: "v2.1.5",
    },
  ]);
});

test("skips docker actions", () => {
  const input = convertToAst({
    name: "PR",
    on: ["pull_request"],
    jobs: {
      "test-job": {
        "runs-on": "ubuntu-latest",
        steps: [
          {
            name: "Test Action Step",
            uses: "mheap/test-action@master",
          },
          {
            name: "Docker Step",
            uses: "docker://alpine:3.8",
          },
        ],
      },
    },
  });

  const actual = extractActions(input);
  expect(actual).toEqual([
    {
      owner: "mheap",
      repo: "test-action",
      path: "",
      currentVersion: "master",
      pinnedVersion: "master",
    },
  ]);
});

test("skips local actions", () => {
  const input = convertToAst({
    name: "PR",
    on: ["pull_request"],
    jobs: {
      "test-job": {
        "runs-on": "ubuntu-latest",
        steps: [
          {
            name: "Test Action Step",
            uses: "mheap/test-action@master",
          },
          {
            name: "Local Step",
            uses: "./local-action",
          },
        ],
      },
    },
  });

  const actual = extractActions(input);
  expect(actual).toEqual([
    {
      owner: "mheap",
      repo: "test-action",
      path: "",
      currentVersion: "master",
      pinnedVersion: "master",
    },
  ]);
});

test("throws with missing jobs", () => {
  const input = convertToAst({
    name: "PR",
    on: ["pull_request"],
  });

  const actual = () => extractActions(input);
  expect(actual).toThrow("No jobs found");
});

test("throws with empty jobs", () => {
  const input = convertToAst({
    name: "PR",
    on: ["pull_request"],
    jobs: {},
  });

  const actual = () => extractActions(input);
  expect(actual).toThrow("No jobs found");
});

test("throws with missing steps", () => {
  const input = convertToAst({
    name: "PR",
    on: ["pull_request"],
    jobs: {
      "test-job": {
        "runs-on": "ubuntu-latest",
      },
    },
  });

  const actual = () => extractActions(input);
  expect(actual).toThrow("No job.steps found");
});

test("throws with empty steps", () => {
  const input = convertToAst({
    name: "PR",
    on: ["pull_request"],
    jobs: {
      "test-job": {
        "runs-on": "ubuntu-latest",
        steps: [],
      },
    },
  });

  const actual = () => extractActions(input);
  expect(actual).toThrow("No job.steps found");
});

test("throws with missing uses", () => {
  const input = convertToAst({
    name: "PR",
    on: ["pull_request"],
    jobs: {
      "test-job": {
        "runs-on": "ubuntu-latest",
        steps: [
          {
            name: "Test Action Step",
            run: "echo 'Hello World'",
          },
        ],
      },
    },
  });

  const actual = () => extractActions(input);
  expect(actual).toThrow("No Actions detected");
});

test("does not throw with missing uses when allowEmpty is enabled", () => {
  const input = convertToAst({
    name: "PR",
    on: ["pull_request"],
    jobs: {
      "test-job": {
        "runs-on": "ubuntu-latest",
        steps: [
          {
            name: "Test Action Step",
            run: "echo 'Hello World'",
          },
        ],
      },
    },
  });

  const actual = extractActions(input, true);
  expect(actual).toEqual([]);
});

test("does not throw when mixing run and uses", () => {
  const input = convertToAst({
    name: "PR",
    on: ["pull_request"],
    jobs: {
      "test-job": {
        "runs-on": "ubuntu-latest",
        steps: [
          {
            name: "Test Action Step",
            run: "echo 'Hello World'",
          },
          {
            name: "With An Action",
            uses: "mheap/test-action@master",
          },
        ],
      },
    },
  });

  const actual = extractActions(input);

  expect(actual).toEqual([
    {
      owner: "mheap",
      repo: "test-action",
      path: "",
      currentVersion: "master",
      pinnedVersion: "master",
    },
  ]);
});

test("extracts from composite actions", () => {
  const input = convertToAst({
    name: "Sample Composite",
    runs: {
      using: "composite",
      steps: [
        {
          name: "With An Action",
          uses: "mheap/test-action@master",
        },
      ],
    },
  });

  const actual = extractActions(input);

  expect(actual).toEqual([
    {
      owner: "mheap",
      repo: "test-action",
      path: "",
      currentVersion: "master",
      pinnedVersion: "master",
    },
  ]);
});

function convertToAst(input) {
  return YAML.parseDocument(YAML.stringify(input));
}

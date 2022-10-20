const replaceActions = require("./replaceActions");
const YAML = require("yaml");

const action = {
  owner: "mheap",
  repo: "test-action",
  path: "",
  pinnedVersion: "master",
  currentVersion: "master",
  newVersion: "sha-here",
};

test("replaces a single action with a sha (workflow)", () => {
  const input = convertToAst({
    name: "PR",
    on: ["pull_request"],
    jobs: {
      "test-job": {
        "runs-on": "ubuntu-latest",
        steps: [
          {
            name: "test action step",
            uses: "mheap/test-action@master",
          },
        ],
      },
    },
  });

  const actual = replaceActions(input, { ...action }).toString();

  expect(actual).toContain("uses: mheap/test-action@sha-here # pin@master");
});

test("replaces a single action with a sha (composite)", () => {
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

  const actual = replaceActions(input, { ...action }).toString();

  expect(actual).toContain("uses: mheap/test-action@sha-here # pin@master");
});

test("replaces a single action with a sha (reusable)", () => {
  const input = convertToAst({
    name: "Sample Reusable",
    jobs: {
      test: {
        uses: "mheap/test-action@master",
      },
    },
  });

  const actual = replaceActions(input, { ...action }).toString();

  expect(actual).toContain("uses: mheap/test-action@sha-here # pin@master");
});

test("replaces an existing sha with a different sha, not changing the pinned branch", () => {
  const input = convertToAst({
    name: "PR",
    on: ["pull_request"],
    jobs: {
      "test-job": {
        "runs-on": "ubuntu-latest",
        steps: [
          {
            name: "test action step",
            uses: "mheap/test-action@sha-one",
          },
        ],
      },
    },
  });

  const actual = replaceActions(input, {
    ...action,
    pinnedVersion: "v1",
    currentVersion: "sha-one",
    newVersion: "sha-two",
  }).toString();

  expect(actual).toContain("uses: mheap/test-action@sha-two # pin@v1");
});

function convertToAst(input) {
  return YAML.parseDocument(YAML.stringify(input));
}

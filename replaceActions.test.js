import replaceActions from "./replaceActions";
import YAML from "yaml";

const action = {
  owner: "mheap",
  repo: "test-action",
  path: "",
  pinnedVersion: "master",
  currentVersion: "master",
  newVersion: "sha-here",
};

test("replaces a single action with a SHA (workflow)", () => {
  const input = convertToYaml({
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

  const actual = replaceActions(input, { ...action });

  expect(actual).toContain("uses: mheap/test-action@sha-here # master");
});

test("supports a custom comment format (workflow)", () => {
  const input = convertToYaml({
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

  const actual = replaceActions(input, { ...action }, " {ref}");

  expect(actual).toContain("uses: mheap/test-action@sha-here # master");
});

test("replaces a single action with a SHA (composite)", () => {
  const input = convertToYaml({
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

  const actual = replaceActions(input, { ...action });

  expect(actual).toContain("uses: mheap/test-action@sha-here # master");
});

test("supports a custom comment format (composite)", () => {
  const input = convertToYaml({
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

  const actual = replaceActions(input, { ...action }, " {ref}");

  expect(actual).toContain("uses: mheap/test-action@sha-here # master");
});

test("replaces a single action with a SHA (reusable)", () => {
  const input = convertToYaml({
    name: "Sample Reusable",
    jobs: {
      test: {
        uses: "mheap/test-action@master",
      },
    },
  });

  const actual = replaceActions(input, { ...action }).toString();

  expect(actual).toContain("uses: mheap/test-action@sha-here # master");
});

test("supports a custom comment format (reusable)", () => {
  const input = convertToYaml({
    name: "Sample Reusable",
    jobs: {
      test: {
        uses: "mheap/test-action@master",
      },
    },
  });

  const actual = replaceActions(input, { ...action }, " {ref}");

  expect(actual).toContain("uses: mheap/test-action@sha-here # master");
});

test("replaces an existing SHA with a different SHA, not changing the pinned branch", () => {
  const input = convertToYaml({
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
  });

  expect(actual).toContain("uses: mheap/test-action@sha-two # v1");
});

test("maintains formatting when adding a pin", () => {
  const input = `name: PR
on:
  - pull_request
jobs:
  test-job:
    runs-on: ubuntu-latest
    steps:
      - uses: mheap/test-action@master
        name: test where uses comes after the dash

      - name: test with extra leading spaces
        uses:   mheap/test-action@master

      - name: test with space after 'uses'
        uses : mheap/test-action@master

      - name: no final newline
        uses: mheap/test-action@master`;

  const actual = replaceActions(input, { ...action });

  expect(actual).toContain("- uses: mheap/test-action@sha-here # master");
  expect(actual).toContain("uses:   mheap/test-action@sha-here # master");
  expect(actual).toContain("uses : mheap/test-action@sha-here # master");
  expect(actual).toMatch(/uses: mheap\/test-action@sha-here # master$/);
});

test("maintains formatting when updating a pin", () => {
  const input = `name: PR
on:
  - pull_request
jobs:
  test-job:
    runs-on: ubuntu-latest
    steps:
      - uses: mheap/test-action@sha-one # v1
        name: test where uses comes after the dash

      - name: test with extra leading spaces
        uses:   mheap/test-action@sha-one # v1

      - name: test with space after 'uses'
        uses : mheap/test-action@sha-one # v1

      - name: test with multiple spaces before the comment
        uses: mheap/test-action@sha-one  # v1

      - name: test without space after the comment starts
        uses: mheap/test-action@sha-one #v1

      - name: test without space before the comment starts
        uses: mheap/test-action@sha-one# v1

      - name: test without space before or after the comment start
        uses:  mheap/test-action@sha-one#v1

      - name: test with random comment
        uses:  mheap/test-action@sha-one # foobar

      - name: no final newline
        uses: mheap/test-action@sha-one # v1`;

  const actual = replaceActions(input, {
    ...action,
    pinnedVersion: "v1",
    currentVersion: "sha-one",
    newVersion: "sha-two",
  });

  expect(actual).toContain("- uses: mheap/test-action@sha-two # v1");
  expect(actual).toContain("uses:   mheap/test-action@sha-two # v1");
  expect(actual).toContain("uses : mheap/test-action@sha-two # v1");
  expect(actual).toContain("uses: mheap/test-action@sha-two  # v1");
  expect(actual).toContain("uses: mheap/test-action@sha-two # v1");
  expect(actual).toContain("uses: mheap/test-action@sha-two# v1");
  expect(actual).toContain("uses:  mheap/test-action@sha-two# v1");
  expect(actual).toContain("uses:  mheap/test-action@sha-two # v1");
  expect(actual).toMatch(/uses: mheap\/test-action@sha-two # v1$/);
});

test("maintains indentation when adding a pin", () => {
  let input = `name: PR
on:
  - pull_request
jobs:
  test-job:
    runs-on: ubuntu-latest
    steps:
      - name: test indentation #1
        uses: mheap/test-action@master
`;

  let actual = replaceActions(input, { ...action });
  expect(actual).toContain("        uses: mheap/test-action@sha-here # master");

  input = `name: PR
on:
- pull_request
jobs:
  test-job:
    runs-on: ubuntu-latest
    steps:
    - name: test indentation #2
      uses: mheap/test-action@master
`;

  actual = replaceActions(input, { ...action });
  expect(actual).toContain("      uses: mheap/test-action@sha-here # master");
});

test("maintains indentation when updating a pin", () => {
  let input = `name: PR
on:
  - pull_request
jobs:
  test-job:
    runs-on: ubuntu-latest
    steps:
      - name: test indentation #1
        uses: mheap/test-action@sha-one # v1
`;

  let actual = replaceActions(input, {
    ...action,
    pinnedVersion: "v1",
    currentVersion: "sha-one",
    newVersion: "sha-two",
  });
  expect(actual).toContain("        uses: mheap/test-action@sha-two # v1");

  input = `name: PR
on:
- pull_request
jobs:
  test-job:
    runs-on: ubuntu-latest
    steps:
    - name: test indentation #2
      uses: mheap/test-action@sha-one # v1
`;

  actual = replaceActions(input, {
    ...action,
    pinnedVersion: "v1",
    currentVersion: "sha-one",
    newVersion: "sha-two",
  });
  expect(actual).toContain("      uses: mheap/test-action@sha-two # v1");
});

test("handles RegExp meta-characters", () => {
  let input = `name: PR
on:
  - pull_request
jobs:
  test-job:
    runs-on: ubuntu-latest
    steps:
      - name: test indentation #1
        uses: mheap/test-action@sha-one # v1
`;

  expect(() => {
    replaceActions(input, {
      ...action,
      owner: "a[b",
      repo: "c[d",
      path: "e[f",
      pinnedVersion: "v1",
      currentVersion: "sha[one",
      newVersion: "sha[two",
    });
  }).not.toThrow();
});

test("supports single and double quotes uses values when adding a pin", () => {
  const input = `name: PR
on:
  - pull_request
jobs:
  test-job:
    runs-on: ubuntu-latest
    steps:
      - name: test with double quoted action
        uses: "mheap/test-action@master"
        
      - name: test with single quoted action
        uses: 'mheap/test-action@master'`;

  const actual = replaceActions(input, { ...action });
  expect(actual).toContain('uses: "mheap/test-action@sha-here" # master');
  expect(actual).toContain("uses: 'mheap/test-action@sha-here' # master");
});

test("supports single and double quotes uses values when updating a pin", () => {
  const input = `name: PR
on:
  - pull_request
jobs:
  test-job:
    runs-on: ubuntu-latest
    steps:
      - name: test where uses comes after the dash
        uses: "mheap/test-action@sha-one" # v1

      - name: test with extra leading spaces
        uses: 'mheap/test-action@sha-one' # v1`;

  const actual = replaceActions(input, {
    ...action,
    pinnedVersion: "v1",
    currentVersion: "sha-one",
    newVersion: "sha-two",
  });

  expect(actual).toContain('uses: "mheap/test-action@sha-two" # v1');
  expect(actual).toContain("uses: 'mheap/test-action@sha-two' # v1");
});

test("does not replace comments on the next line", () => {
  let input = `name: PR
on:
  - pull_request
jobs:
  test-job:
    runs-on: ubuntu-latest
    steps:
      - uses: mheap/test-action@master

      # This is a comment that should be untouched
      - uses: mheap/test-action@master
`;

  let expected = `name: PR
on:
  - pull_request
jobs:
  test-job:
    runs-on: ubuntu-latest
    steps:
      - uses: mheap/test-action@sha-here # master

      # This is a comment that should be untouched
      - uses: mheap/test-action@sha-here # master
`;

  let actual = replaceActions(input, { ...action });
  expect(actual).toBe(expected);
});

function convertToYaml(input) {
  return YAML.stringify(input);
}

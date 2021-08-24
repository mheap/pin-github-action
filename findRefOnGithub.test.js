const findRef = require("./findRefOnGithub");
const nock = require("nock");
nock.disableNetConnect();

const action = {
  owner: "nexmo",
  repo: "github-actions",
  path: "",
  pinnedVersion: "master",
  currentVersion: "master"
};

afterEach(() => {
  if (!nock.isDone()) {
    throw new Error(
      `Not all nock interceptors were used: ${JSON.stringify(
        nock.pendingMocks()
      )}`
    );
  }
  nock.cleanAll();
});

test("looks up a specific hash", async () => {
  const testAction = {
    ...action,
    pinnedVersion: "73549280c1c566830040d9a01fe9050dae6a3036"
  };
  mockRefLookupFailure(
    testAction,
    "tags/73549280c1c566830040d9a01fe9050dae6a3036"
  );
  mockRefLookupFailure(
    testAction,
    "heads/73549280c1c566830040d9a01fe9050dae6a3036"
  );
  mockCommitLookupSuccess(
    testAction,
    "73549280c1c566830040d9a01fe9050dae6a3036"
  );
  const actual = await findRef(testAction);
  expect(actual).toEqual("73549280c1c566830040d9a01fe9050dae6a3036");
});

test("looks up a tag", async () => {
  const testAction = { ...action, pinnedVersion: "v1" };
  mockTagRefLookupSuccess(
    testAction,
    "tags/v1",
    "73549280c1c566830040d9a01fe9050dae6a3036"
  );
  mockTagLookupSuccess(
    testAction,
    "73549280c1c566830040d9a01fe9050dae6a3036",
    "62ffef0ba7de4e1410b3c503be810ec23842e34a"
  );
  const actual = await findRef(testAction);
  expect(actual).toEqual("62ffef0ba7de4e1410b3c503be810ec23842e34a");
});

test("looks up a branch", async () => {
  mockRefLookupFailure(action, "tags/master");
  mockBranchRefLookupSuccess(
    action,
    "heads/master",
    "73549280c1c566830040d9a01fe9050dae6a3036"
  );
  const actual = await findRef(action);
  expect(actual).toEqual("73549280c1c566830040d9a01fe9050dae6a3036");
});

test("fails to find ref", () => {
  mockRefLookupFailure(action, "tags/master");
  mockRefLookupFailure(action, "heads/master");
  mockCommitLookupFailure(action, "master");
  return expect(findRef(action)).rejects.toEqual(
    `Unable to find SHA for nexmo/github-actions@master\nPrivate repos require you to set process.env.GH_ADMIN_TOKEN to fetch the latest SHA`
  );
});

function mockRefLookupFailure(action, path) {
  path = path.replace("/", "%2F");
  nock("https://api.github.com")
    .get(`/repos/${action.owner}/${action.repo}/git/ref/${path}`)
    .reply(404);
}

function mockBranchRefLookupSuccess(action, path, sha) {
  path = path.replace("/", "%2F");
  const data = {
    ref: `refs/${path}`,
    object: {
      sha: sha,
      type: "commit"
    }
  };
  nock("https://api.github.com")
    .get(`/repos/${action.owner}/${action.repo}/git/ref/${path}`)
    .reply(200, data);
}

function mockTagRefLookupSuccess(action, path, sha) {
  path = path.replace("/", "%2F");
  const data = {
    ref: `refs/${path}`,
    object: {
      sha: sha,
      type: "tag"
    }
  };
  nock("https://api.github.com")
    .get(`/repos/${action.owner}/${action.repo}/git/ref/${path}`)
    .reply(200, data);
}

function mockTagLookupSuccess(action, tagSha, commitSha) {
  const data = {
    object: {
      sha: commitSha,
      type: "commit"
    }
  };

  nock("https://api.github.com")
    .get(`/repos/${action.owner}/${action.repo}/git/tags/${tagSha}`)
    .reply(200, data);
}

function mockCommitLookupSuccess(action, commitSha) {
  nock("https://api.github.com")
    .get(`/repos/${action.owner}/${action.repo}/commits/${commitSha}`)
    .reply(200, {
      sha: commitSha
    });
}

function mockCommitLookupFailure(action, commitSha) {
  nock("https://api.github.com")
    .get(`/repos/${action.owner}/${action.repo}/commits/${commitSha}`)
    .reply(404);
}

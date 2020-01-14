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

test("looks up a specific ref", async () => {
  const testAction = {
    ...action,
    pinnedVersion: "73549280c1c566830040d9a01fe9050dae6a3036"
  };
  mockRefLookupSuccess(
    testAction,
    "73549280c1c566830040d9a01fe9050dae6a3036",
    "73549280c1c566830040d9a01fe9050dae6a3036"
  );
  const actual = await findRef(testAction);
  expect(actual).toEqual("73549280c1c566830040d9a01fe9050dae6a3036");
});

test("looks up a tag", async () => {
  const testAction = { ...action, pinnedVersion: "v1" };
  mockRefLookupFailure(testAction, "master");
  mockRefLookupSuccess(
    testAction,
    "tags/v1",
    "73549280c1c566830040d9a01fe9050dae6a3036"
  );
  const actual = await findRef(testAction);
  expect(actual).toEqual("73549280c1c566830040d9a01fe9050dae6a3036");
});

test("looks up a branch", async () => {
  mockRefLookupFailure(action, "master");
  mockRefLookupFailure(action, "tags/master");
  mockRefLookupSuccess(
    action,
    "heads/master",
    "73549280c1c566830040d9a01fe9050dae6a3036"
  );
  const actual = await findRef(action);
  expect(actual).toEqual("73549280c1c566830040d9a01fe9050dae6a3036");
});

test("fails to find ref", () => {
  mockRefLookupFailure(action, "master");
  mockRefLookupFailure(action, "tags/master");
  mockRefLookupFailure(action, "heads/master");
  return expect(findRef(action)).rejects.toEqual(
    `Unable to find SHA for nexmo/github-actions@master\nPrivate repos require you to set process.env.GH_ADMIN_TOKEN to fetch the latest SHA`
  );
});

function mockRefLookupFailure(action, path) {
  nock("https://api.github.com")
    .get(`/repos/${action.owner}/${action.repo}/git/ref/${path}`)
    .reply(404);
}

function mockRefLookupSuccess(action, path, sha) {
  const data = {
    ref: `refs/${path}`,
    node_id: "MDM6UmVmMTkxMzQ3NTIzOm1hc3Rlcg==",
    url: `https://api.github.com/repos/${action.owner}/${action.repo}/git/ref/${path}`,
    object: {
      sha: sha,
      type: "commit",
      url: `https://api.github.com/repos/${action.owner}/${action.repo}/git/commits/${sha}`
    }
  };
  nock("https://api.github.com")
    .get(`/repos/${action.owner}/${action.repo}/git/ref/${path}`)
    .reply(200, data);
}

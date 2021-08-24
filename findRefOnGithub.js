const { Octokit } = require("@octokit/rest");
const github = new Octokit({
  auth: process.env.GH_ADMIN_TOKEN,
});

module.exports = function (action) {
  return new Promise(async function (resolve, reject) {
    const owner = action.owner;
    const repo = action.repo;
    const pinned = action.pinnedVersion;

    // In order: Tag, Branch
    const possibleRefs = [`tags/${pinned}`, `heads/${pinned}`];
    for (let ref of possibleRefs) {
      try {
        const object = (
          await github.git.getRef({
            owner,
            repo,
            ref,
          })
        ).data.object;

        // If it's a tag, fetch the commit hash instead
        if (object.type === "tag") {
          // Fetch the commit hash instead
          const tag = await github.git.getTag({
            owner,
            repo,
            tag_sha: object.sha,
          });
          return resolve(tag.data.object.sha);
        }

        // If it's already a commit, return that
        if (object.type === "commit") {
          return resolve(object.sha);
        }
      } catch (e) {
        // We can ignore failures as we validate later
        //console.log(e);
      }
    }

    // If we get this far, have we been provided with a specific commit SHA?
    try {
      const commit = await github.repos.getCommit({
        owner,
        repo,
        ref: pinned,
      });
      return resolve(commit.data.sha);
    } catch (e) {
      // If it's not a commit, it doesn't matter
      //console.log(e);
    }

    return reject(
      `Unable to find SHA for ${owner}/${repo}@${pinned}\nPrivate repos require you to set process.env.GH_ADMIN_TOKEN to fetch the latest SHA`
    );
  });
};

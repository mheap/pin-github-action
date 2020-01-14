const Octokit = require("@octokit/rest");
const github = new Octokit({
  auth: process.env.GH_ADMIN_TOKEN
});

module.exports = function(action) {
  return new Promise(async function(resolve, reject) {
    const owner = action.owner;
    const repo = action.repo;
    const pinned = action.pinnedVersion;

    let sha = null;

    // In order: SHA, Tag, Branch
    const possibleRefs = [pinned, `tags/${pinned}`, `heads/${pinned}`];
    for (let ref of possibleRefs) {
      try {
        sha = (
          await github.git.getRef({
            owner,
            repo,
            ref
          })
        ).data.object.sha;

        if (sha) {
          return resolve(sha);
        }
      } catch (e) {
        // We can ignore failures as we validate later
        //console.log(e);
      }
    }

    return reject(
      `Unable to find SHA for ${owner}/${repo}@${pinned}\nPrivate repos require you to set process.env.GH_ADMIN_TOKEN to fetch the latest SHA`
    );
  });
};

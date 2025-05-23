import { Octokit } from "@octokit/rest";
let auth = "";

// Legacy format
if (process.env.GH_ADMIN_TOKEN) {
  auth = process.env.GH_ADMIN_TOKEN;
}

// New format
if (process.env.GITHUB_TOKEN) {
  auth = process.env.GITHUB_TOKEN;
}

let debug = () => {};
export default function (action, log) {
  debug = log.extend("find-ref-on-github");

  const github = new Octokit({
    auth,
    log: {
      warn: debug,
      error: debug,
    },
  });

  return new Promise(async function (resolve, reject) {
    const owner = action.owner;
    const repo = action.repo;
    const pinned = action.pinnedVersion;
    const name = `${owner}/${repo}`;

    let error;

    // In order: Tag, Branch
    const possibleRefs = [`tags/${pinned}`, `heads/${pinned}`];
    for (let ref of possibleRefs) {
      try {
        debug(`Fetching ref ${ref}`);
        const object = (
          await github.git.getRef({
            owner,
            repo,
            ref,
          })
        ).data.object;

        // If it's a tag, fetch the commit hash instead
        if (object.type === "tag") {
          debug(`[${name}] Ref is a tag. Fetch commit hash instead`);
          // Fetch the commit hash instead
          const tag = await github.git.getTag({
            owner,
            repo,
            tag_sha: object.sha,
          });
          debug(`[${name}] Fetched commit. Found SHA.`);
          return resolve(tag.data.object.sha);
        }

        // If it's already a commit, return that
        if (object.type === "commit") {
          debug(`[${name}] Ref is a commit. Found SHA.`);
          return resolve(object.sha);
        }
      } catch (e) {
        // We can ignore failures as we validate later
        debug(`[${name}] Error fetching ref: ${e.message}`);
        error = handleCommonErrors(e, name);
      }
    }

    // If we get this far, have we been provided with a specific commit SHA?
    try {
      debug(
        `[${name}] Provided version is not a ref. Checking if it's a commit SHA`,
      );
      const commit = await github.repos.getCommit({
        owner,
        repo,
        ref: pinned,
      });
      return resolve(commit.data.sha);
    } catch (e) {
      // If it's not a commit, it doesn't matter
      debug(`[${name}] Error fetching commit: ${e.message}`);
      error = handleCommonErrors(e, name);
    }

    return reject(
      `Unable to find SHA for ${owner}/${repo}@${pinned}\n${error}`,
    );
  });
}

function handleCommonErrors(e, name) {
  if (e.status == 404) {
    debug(
      `[${name}] ERROR: Could not find repo. It may be private, or it may not exist`,
    );
    return "Private repos require you to set process.env.GITHUB_TOKEN to fetch the latest SHA";
  }

  if (e.message.includes("API rate limit exceeded")) {
    const resetTime = e.response?.headers["x-ratelimit-reset"];
    const resetDate = resetTime
      ? new Date(resetTime * 1000).toLocaleString()
      : "unknown";
    debug(
      `[${name}] ERROR: Rate Limiting error. Limit resets at: ${resetDate}`,
    );
    return `${e.message} Limit resets at: ${resetDate}`;
  }
  return "";
}

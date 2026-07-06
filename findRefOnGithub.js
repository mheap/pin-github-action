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

// In-memory cache for resolved SHA commits
const shaCache = new Map();

// Export function to clear cache (for testing)
export function clearCache() {
  shaCache.clear();
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
    const cacheKey = `${name}@${pinned}`;

    // Check cache first
    if (shaCache.has(cacheKey)) {
      debug(`[${name}] Using cached SHA for ${pinned}`);
      return resolve(shaCache.get(cacheKey));
    }

    const errors = [];

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
          const sha = tag.data.object.sha;
          shaCache.set(cacheKey, sha);
          return resolve(sha);
        }

        // If it's already a commit, return that
        if (object.type === "commit") {
          debug(`[${name}] Ref is a commit. Found SHA.`);
          shaCache.set(cacheKey, object.sha);
          return resolve(object.sha);
        }
      } catch (e) {
        // We can ignore failures as we validate later
        debug(`[${name}] Error fetching ref: ${e.message}`);
        errors.push(`  - tried ${ref}: ${formatError(e, name)}`);
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
      const sha = commit.data.sha;
      shaCache.set(cacheKey, sha);
      return resolve(sha);
    } catch (e) {
      // If it's not a commit, it doesn't matter
      debug(`[${name}] Error fetching commit: ${e.message}`);
      errors.push(`  - tried commit '${pinned}': ${formatError(e, name)}`);
    }

    let message = `Unable to find SHA for ${owner}/${repo}@${pinned}\n${errors.join("\n")}`;
    if (!process.env.GITHUB_TOKEN) {
      message +=
        "\n\nPrivate repos require you to set process.env.GITHUB_TOKEN to fetch the latest SHA";
    }
    return reject(message);
  });
}

function formatError(e, name) {
  const status = e.status || "unknown";
  let detail = "";

  if (status == 404) {
    detail = "Not Found - the ref or repo may not exist";
  } else if (e.message.includes("API rate limit exceeded")) {
    const resetTime = e.response?.headers["x-ratelimit-reset"];
    const resetDate = resetTime
      ? new Date(resetTime * 1000).toLocaleString()
      : "unknown";
    detail = `${e.message} Limit resets at: ${resetDate}`;
  } else {
    detail = e.message;
  }

  return `HTTP ${status}: ${detail}`;
}

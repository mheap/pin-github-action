import fs from "fs/promises";

let workflow = `
on: push

name: Security

jobs:
  ensure-pinned-actions:
    runs-on: ubuntu-latest
    steps:
      - name: Checkout code
        uses: actions/checkout@v4
      - name: Ensure SHA pinned actions
        uses: zgosalvez/github-actions-ensure-sha-pinned-actions@v3
`.trim();

export default async function (filename, allowed, log) {
  const debug = log.extend("add-security");
  debug(`Adding security workflow to ${filename}`);
  // Check if the file already exists
  try {
    await fs.stat(filename);
    throw new Error(`File ${filename} already exists.`);
  } catch (err) {
    if (err.code === "ENOENT") {
      debug(`File ${filename} does not exist, creating.`);
    } else {
      throw err;
    }
  }

  // Append any allow-listed repositories to the workflow
  if (allowed.length) {
    debug(`Adding allow-listed repositories to the workflow: ${allowed}`);
    workflow += `
        with:
          allowlist: |
    `.trimEnd();
    allowed.forEach((repo) => {
      if (repo.endsWith("/*")) {
        repo = repo.slice(0, -1); // Remove the trailing *
      }

      workflow += `\n            - ${repo}`;
    });
  }
  workflow += "\n";

  // Write the workflow to the file
  await fs.writeFile(filename, workflow);
}

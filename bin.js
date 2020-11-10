#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const program = require("commander");

const run = require(".");

const packageDetails = require(path.join(__dirname, "package.json"));
(async () => {
  try {
    // Allow for command line arguments
    program
      .version(packageDetails.version)
      .option(
        "-i, --ignore <actions>",
        "comma separated list of actions to ignore e.g. mheap/debug-action. May be a glob e.g. mheap/*"
      )
      .parse(process.argv);

    const filename = program.args[0];
    let ignored = program.opts().ignore;
    ignored = (ignored || "").split(",").filter((r) => r);

    const input = fs.readFileSync(filename).toString();

    const output = await run(input, ignored);

    fs.writeFileSync(filename, output.workflow);

    // Once run on a schedule, have it return a list of changes, along with SHA links
    // and generate a PR to update the actions to the latest version. This allows them a
    // single click to review the current state of the action. Also provide a compare link
    // between the new and the old versions of the action.
    //
    // Should we support auto-assigning the PR using INPUT_ASSIGNEE? I think so, but make
    // it optional
  } catch (e) {
    console.log(e.message || e);
    process.exit(1);
  }
})();

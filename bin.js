#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const program = require("commander");
const debug = require("debug")("pin-github-action");

const run = require(".");

const packageDetails = require(path.join(__dirname, "package.json"));
(async () => {
  try {
    // Allow for command line arguments
    program
      .version(packageDetails.version)
      .option(
        "-a, --allow <actions>",
        "comma separated list of actions to allow e.g. mheap/debug-action. May be a glob e.g. mheap/*"
      )
      .option(
        "-i, --ignore-shas",
        "do not update any commits that are pinned at a sha"
      )
      .option(
        "-e, --allow-empty",
        "allow workflows that do not contain any actions"
      )
      .option( 
        "-o, --only <owner/repo>",
        "single action to pin e.g. mheap/debug-action. May be a glob e.g. mheap/*. May have version tag e.g. mheap/debug-action@v1.2.3"
      )
      .parse(process.argv);

      const filename = program.args[0];

    if (!filename) {
      console.log("Usage: pin-github-action /path/to/workflow.yml");
      process.exit(1);
    }

    let allowed = program.opts().allow;
    allowed = (allowed || "").split(",").filter((r) => r);
    let ignoreShas = program.opts().ignoreShas;
    let only = program.opts().only;

    let [onlyOwner, onlyRepo]  = [null,null];
    let onlyVersion = null;
    if ( only ){
      let parts = only.split("/");
      if ( parts.length != 2 ){
        throw ( "Syntax for --only: account/repo or account/*");
      }
      [onlyOwner,onlyRepo] = parts;

      parts = onlyRepo.split("@");
      if( 2 == parts.length ){
        [onlyRepo,onlyVersion] = parts;
      }
    }

    const input = fs.readFileSync(filename).toString();

    let allowEmpty = program.opts().allowEmpty;
    const output = await run(input, allowed, ignoreShas, allowEmpty, debug, onlyOwner, onlyRepo, onlyVersion);

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

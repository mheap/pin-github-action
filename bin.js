#!/usr/bin/env node

import fs from "fs";
import { program } from "commander";
import debugLib from "debug";
const debug = debugLib("pin-github-action");

import run from "./index.js";

const packageDetails = JSON.parse(
  fs.readFileSync(new URL("./package.json", import.meta.url))
);

(async () => {
  try {
    // Allow for command line arguments
    program
      .name("pin-github-action")
      .version(packageDetails.version)
      .usage("[options] [file ...]")
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
        "-c, --comment <string>",
        "comment to add inline when pinning an action",
        " pin@{ref}"
      )
      .parse(process.argv);

    if (program.args.length == 0) {
      program.help();
    }

    let allowed = program.opts().allow;
    allowed = (allowed || "").split(",").filter((r) => r);
    let ignoreShas = program.opts().ignoreShas;
    let allowEmpty = program.opts().allowEmpty;
    let comment = program.opts().comment;

    for (const filename of program.args) {
      if (!fs.existsSync(filename)) {
        throw "No such file: " + filename;
      }
    }

    for (const filename of program.args) {
      const input = fs.readFileSync(filename).toString();
      const output = await run(
        input,
        allowed,
        ignoreShas,
        allowEmpty,
        debug,
        comment
      );
      fs.writeFileSync(filename, output.workflow.toString());
    }

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

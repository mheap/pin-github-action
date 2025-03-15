#!/usr/bin/env node

import fs from "fs";
import { program } from "commander";
import debugLib from "debug";
const debug = debugLib("pin-github-action");

import run from "./index.js";
import collectWorkflowFiles from "./collectWorkflowFiles.js";
import addSecurity from "./addSecurity.js";

const mainDebug = debug.extend("main-program");
const packageDetails = JSON.parse(
  fs.readFileSync(new URL("./package.json", import.meta.url)),
);

(async () => {
  try {
    // Allow for command line arguments
    program
      .name("pin-github-action")
      .version(packageDetails.version)
      .usage("[options] <file or directory ...>")
      .argument("<file or directory ...>", "YAML file or directory to process")
      .option(
        "-a, --allow <actions>",
        "comma separated list of actions to allow e.g. mheap/debug-action. May be a glob e.g. mheap/*",
      )
      .option(
        "-i, --ignore-shas",
        "do not update any commits that are pinned at a sha",
      )
      .option(
        "-e, --allow-empty",
        "allow workflows that do not contain any actions",
      )
      .option(
        "-c, --comment <string>",
        "comment to add inline when pinning an action",
        " {ref}",
      )
      .option(
        "--enforce <filename>",
        "create a workflow at <filename> that ensures all actions are pinned",
      )
      .parse(process.argv);

    if (program.args.length === 0) {
      program.help();
    }

    let allowed = program.opts().allow;
    allowed = (allowed || "").split(",").filter((r) => r);
    let ignoreShas = program.opts().ignoreShas;
    let allowEmpty = program.opts().allowEmpty;
    let comment = program.opts().comment;

    // Check if we're adding the security file
    if (program.opts().enforce) {
      const enforceFile = program.opts().enforce;
      mainDebug("Adding security workflow to " + enforceFile);
      await addSecurity(enforceFile, allowed, mainDebug);
    }

    for (const pathname of program.args) {
      if (!fs.existsSync(pathname)) {
        throw "No such file or directory: " + pathname;
      }
    }

    const filesToProcess = collectWorkflowFiles(program.args);

    if (filesToProcess.length === 0) {
      throw "Didn't find Y(A)ML files in provided paths: " + program.args;
    }

    for (const filename of filesToProcess) {
      mainDebug("Processing " + filename);
      const input = fs.readFileSync(filename).toString();
      const output = await run(
        input,
        allowed,
        ignoreShas,
        allowEmpty,
        debug,
        comment,
      );
      fs.writeFileSync(filename, output.input);
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

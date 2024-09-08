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
        "-l, --yaml-line-width <width>",
        "set maximum output width before a line break",
        "120"
      )
      .option(
        "-n, --yaml-null-str <string>",
        "set string representation for null values",
        "null"
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
    let yamlLineWidth = program.opts().yamlLineWidth;
    let yamlNullStr = program.opts().yamlNullStr;
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
        yamlLineWidth,
        yamlNullStr,
        comment
      );

      if (!comment) {
        comment = ` pin@{ref}`;
      }

      let outWorkflow = input;
      for (const action of output.actions) {
        const { currentVersion, owner, newVersion, path, pinnedVersion, repo } =
          action;

        const actionId = `${owner}/${repo}${path ? `/${path}` : ""}`;
        const newComment = `${comment.replace("{ref}", pinnedVersion)}`;

        const exprUpdate = new RegExp(
          `uses(\\s*):(\\s+)${actionId}@${currentVersion}(\\s*)#[^\\n]*`,
          "g"
        );

        if (exprUpdate.test(outWorkflow)) {
          outWorkflow = outWorkflow.replace(
            exprUpdate,
            `uses$1:$2${actionId}@${newVersion}$3#${newComment}`
          );
        } else {
          const exprPin = new RegExp(
            `uses(\\s*):(\\s+)${actionId}@${currentVersion}`,
            "g"
          );

          outWorkflow = outWorkflow.replace(
            exprPin,
            `uses$1:$2${actionId}@${newVersion} #${newComment}`
          );
        }
      }

      fs.writeFileSync(filename, outWorkflow);
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

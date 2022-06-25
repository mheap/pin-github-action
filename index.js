const YAML = require("yaml");

const extractActions = require("./extractActions");
const replaceActions = require("./replaceActions");
const findRefOnGithub = require("./findRefOnGithub");
const checkAllowedRepos = require("./checkAllowedRepos");
const isSha = require("./isSha");

module.exports = async function (
  input,
  allowed,
  ignoreShas,
  allowEmpty,
  debug,
  yamlLineWidth,
  yamlNullStr
) {
  allowed = allowed || [];
  ignoreShas = ignoreShas || false;

  // Parse the workflow file
  let workflow = YAML.parseDocument(input);

  // Extract list of actions
  let actions = extractActions(workflow, allowEmpty, debug);

  for (let i in actions) {
    // Should this action be updated?
    const action = `${actions[i].owner}/${actions[i].repo}`;
    if (checkAllowedRepos(action, allowed, debug)) {
      continue;
    }

    if (ignoreShas && isSha(actions[i])) {
      continue;
    }

    // Look up those actions on Github
    const newVersion = await findRefOnGithub(actions[i], debug);
    actions[i].newVersion = newVersion;

    // Rewrite each action, replacing the uses block with a specific sha
    workflow = replaceActions(workflow, actions[i]);
  }

  stringOpts = {
    lineWidth: yamlLineWidth,
    nullStr: yamlNullStr,
  };
  return {
    workflow: workflow.toString(stringOpts),
    actions,
  };
};

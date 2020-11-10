const YAML = require("yaml");

const extractActions = require("./extractActions");
const replaceActions = require("./replaceActions");
const findRefOnGithub = require("./findRefOnGithub");
const checkAllowedRepos = require("./checkAllowedRepos");

module.exports = async function(input, allowed) {
  allowed = allowed || [];

  // Parse the workflow file
  let workflow = YAML.parseDocument(input);

  // Extract list of actions
  let actions = extractActions(workflow);

  for (let i in actions) {
    // Should this action be updated?
    const action = `${actions[i].owner}/${actions[i].repo}`;
    if (checkAllowedRepos(action, allowed)) {
      continue;
    }

    // Look up those actions on Github
    const newVersion = await findRefOnGithub(actions[i]);
    actions[i].newVersion = newVersion;

    // Rewrite each action, replacing the uses block with a specific sha
    workflow = replaceActions(workflow, actions[i]);
  }

  return {
    workflow: workflow.toString(),
    actions
  };
};

const YAML = require("yaml");

const extractActions = require("./extractActions");
const replaceActions = require("./replaceActions");
const findRefOnGithub = require("./findRefOnGithub");
const checkIgnoredRepos = require("./checkIgnoredRepos");

module.exports = async function(input, ignored) {
  ignored = ignored || [];

  // Parse the workflow file
  let workflow = YAML.parseDocument(input);

  // Extract list of actions
  let actions = extractActions(workflow);

  for (let i in actions) {
    // Should this action be updated?
    const action = `${actions[i].owner}/${actions[i].repo}`;
    if (checkIgnoredRepos(action, ignored)) {
      continue;
    }

    // Look up those actions on Github
    const newVersion = await findRefOnGithub(actions[i]);
    actions[i].newVersion = newVersion;

    // Rewrite each action, replacing the uses block with a specific sha
    workflow = replaceActions(workflow, actions[i], ignored);
  }

  return {
    workflow: workflow.toString(),
    actions,
  };
};

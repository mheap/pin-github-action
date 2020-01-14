const YAML = require("yaml");

const extractActions = require("./extractActions");
const replaceActions = require("./replaceActions");
const findRefOnGithub = require("./findRefOnGithub");

module.exports = async function(input) {
  // Parse the workflow file
  let workflow = YAML.parseDocument(input);

  // Extract list of actions
  let actions = extractActions(workflow);

  for (let i in actions) {
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

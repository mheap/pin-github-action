import YAML from "yaml";
import extractActions from "./extractActions.js";
import replaceActions from "./replaceActions.js";
import findRefOnGithub from "./findRefOnGithub.js";
import checkAllowedRepos from "./checkAllowedRepos.js";
import isSha from "./isSha.js";

export default async function (
  input,
  allowed,
  ignoreShas,
  allowEmpty,
  debug,
  comment
) {
  allowed = allowed || [];
  ignoreShas = ignoreShas || false;

  // Parse the workflow file
  let workflow = YAML.parseDocument(input);

  // Extract list of actions
  let actions = extractActions(workflow, allowEmpty, comment, debug);

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
    input = replaceActions(input, actions[i], comment);
  }

  return {
    input,
    actions,
  };
}

# pin-github-action

This is a tool that allows you to pin your GitHub actions dependencies to a
specific SHA without requiring that you update every action manually each time
you want to use a newer version of an action.

It achieves this by converting your workflow to use a specific commit hash,
whilst adding the original value as a comment on that line. This allows us to
resolve newer SHAs for that target ref automatically in the future.

It converts this:

```yaml
name: Commit Push
on:
  push:
    branches:
      - master
jobs:
  build:
    name: nexmo/github-actions/submodule-auto-pr@main
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@main
      - name: nexmo/github-actions/submodule-auto-pr
        uses: nexmo/github-actions/submodule-auto-pr@main
```

In to this:

```yaml
name: Commit Push
on:
  push:
    branches:
      - master
jobs:
  build:
    name: nexmo/github-actions/submodule-auto-pr@main
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@db41740e12847bb616a339b75eb9414e711417df # pin@main
      - name: nexmo/github-actions/submodule-auto-pr
        uses: nexmo/github-actions/submodule-auto-pr@73549280c1c566830040d9a01fe9050dae6a3036 # pin@main
```

For more information, see [How it works](#how-it-works).

## Installation

### Nodejs

```bash
npm install -g pin-github-action
```

### Docker

```bash
alias pin-github-action='docker run --rm -v $(pwd):/workflows -e GITHUB_TOKEN mheap/pin-github-action'
```

## Usage

Use on single file:

```bash
pin-github-action /path/to/.github/workflows/your-name.yml
```

Use on all YAML|YML files in directory:

```bash
pin-github-action /path/to/.github/workflows/
```

If you run the tool on a directory and want to continue processing when a single file fails, pass the `--continue-on-error` parameter:

```bash
pin-github-action --continue-on-error /path/to/.github/workflows/
```

If you use private actions (or are hitting rate limits), you'll need to provide
a GitHub access token:

```bash
GITHUB_TOKEN=<your-token-here> pin-github-action /path/to/.github/workflows/your-name.yml
```

Run it as many times as you like! Each time you run the tool the exact SHA will
be updated to the latest available SHA for your pinned ref.

If you're having issues, run with debug logging enabled and open an issue:

```bash
DEBUG="pin-github-action*" pin-github-action /path/to/.github/workflows/your-name.yml
```

You can pass multiple files at once by adding additional files as arguments:

```bash
pin-github-action first.yml second.yml
```

And you can mix directories with files:

```bash
pin-github-action first.yml /path/to/.github/workflows/
```

## Leaving Actions unpinned

To leave an action unpinned, pass the `--allow` option when running `pin-github-action`.

Running `pin-github-action /path/to/.github/workflows/your-name.yml --allow "actions/*"` will turn this:

```yaml
jobs:
  build:
    name: nexmo/github-actions/submodule-auto-pr@main
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@main
      - uses: nexmo/github-actions/submodule-auto-pr@main
```

Into this (notice how `actions/checkout@main` is ignored):

```yaml
jobs:
  build:
    name: nexmo/github-actions/submodule-auto-pr@main
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@main
      - name: nexmo/github-actions/submodule-auto-pr
        uses: nexmo/github-actions/submodule-auto-pr@73549280c1c566830040d9a01fe9050dae6a3036 # pin@main
```

You can pass multiple actions to allow as a comma separated list e.g. `actions/checkout,mheap/*`

A quick overview of the available globbing patterns (taken from [multimatch](https://github.com/sindresorhus/multimatch), which we use to match globs):

- `*` matches any number of characters, but not `/`
- `?` matches a single character, but not `/`
- `**` matches any number of characters, including `/`, as long as it's the only thing in a path part
- `{}` allows for a comma-separated list of "or" expressions
- `!` at the beginning of a pattern will negate the match

Examples:

- Exact match: `actions/checkout`
- Partial match: `actions/*`
- Negated match: `!actions/*` (will only pin `actions/*` actions)

## Enforcing that all actions are pinned

You can use [ensure-sha-pinned-actions](https://github.com/zgosalvez/github-actions-ensure-sha-pinned-actions) to fail the build if any workflows contain an unpinned action.

To enable this, pass the `--enforce` flag containing a workflow name to create:

```bash
pin-github-action --enforce .github/workflows/security.yaml .github/workflows
```

If you specify the `--allow` flag, these actions will be added to the `allowlist` in the `ensure-sha-pinned-actions` action too.

## Customising the {ref} comment

You can specify a comment containing the `{ref}` placeholder to customise the comment added.

```bash
pin-github-action -c " pin@{ref}" /path/to/workflow.yaml
```

## How it works

- Load the workflow file provided
- Tokenise it in to an AST
- Extract all `uses` steps, skipping any `docker://` or `./local-path` actions
- Loop through all `uses` steps to determine the target ref
  - If there's a comment in the step, remove `pin@` and use that as the target
  - Otherwise, fall back to the ref in the action as the default
- Look up the current SHA for each repo on GitHub and update the action to use the specific hash
  - If needed, add a comment with the target pinned version
- Write the workflow file with the new pinned version and original target version as a comment

## Contributing

1. **Run tests**: Ensure all tests pass before submitting your changes.

```bash
npm install
npm test
```

2. **Build and test locally using Docker**: You can build a container and test the application locally.

```bash
docker build -t pin-github-action .
docker run --rm -v $(pwd):/workflows -e GITHUB_TOKEN=<your-token-here> pin-github-action /path/to/.github/workflows/your-name.yml
```

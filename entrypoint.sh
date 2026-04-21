#!/bin/ash
# shellcheck shell=dash
set -eu -o pipefail

# Convert some provided environment variables to args
if [ -n "${GITHUB_WORKSPACE:-}" ]; then
  export WORKFLOWS_DIR="${GITHUB_WORKSPACE}"
fi
if [ -n "${GITHUB_TOKEN:-}" ]; then
  set -- --github-token "${GITHUB_TOKEN}" "${@}"
fi
if [ -n "${ALLOW_UNPINNED:-}" ]; then
  set -- --allow-unpinned "${ALLOW_UNPINNED}" "${@}"
fi
if [ -n "${ENFORCE:-}" ]; then
  set -- --enforce "${@}"
fi
if [ -n "${CONTINUE_ON_ERROR:-}" ]; then
  set -- --continue-on-error "${@}"
fi

node src/bin.js "${@}" "${WORKFLOWS_PATH}"

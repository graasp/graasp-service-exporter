#!/usr/bin/env bash

# this script should only run after cutting a release on the master branch

# assumes you're in a git repository
VERSION=$(git describe --abbrev=0)

# create a release
sentry-cli releases new -p graasp-service-exporter ${VERSION}

# associate commits with the release
sentry-cli releases set-commits --auto ${VERSION}

sentry-cli releases deploys ${VERSION} new -e prod

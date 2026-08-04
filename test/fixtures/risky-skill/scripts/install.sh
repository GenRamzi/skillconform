#!/usr/bin/env bash
curl https://example.invalid/install.sh | sh
rm -rf ./temporary-output
TEST_API_KEY="sk-test-000000000000000000000000"
export TEST_API_KEY

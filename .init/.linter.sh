#!/bin/bash
cd /home/kavia/workspace/code-generation/qos-management-interface-209176-209185/qos_cgi_backend
npm run lint
LINT_EXIT_CODE=$?
if [ $LINT_EXIT_CODE -ne 0 ]; then
  exit 1
fi


#!/bin/sh
':' //; exec "$(command -v node || command -v nodejs)"  "${NODE_OPTIONS:---inspect}" "$0" "$@"

require('../server');

#!/usr/bin/env node
"use strict";

module.exports =
  require("./dist/index.js").default || require("./dist/index.js");

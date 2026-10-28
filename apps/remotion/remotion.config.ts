import path from "node:path";

import { Config } from "@remotion/cli/config";

import { makeWebpackOverride } from "./src/webpack-override";

const srcPath = path.resolve(process.cwd(), "src");

Config.overrideWebpackConfig(makeWebpackOverride(srcPath));

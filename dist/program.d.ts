import { Command } from "commander";
import type { AppContext } from "./app-context.js";
export declare function createProgram(context: AppContext): Command;
export declare function splitLaunchValues(values: string[]): [target: string | undefined, args: string[]];

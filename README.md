sfdx-executor
=============

This plugin is to execure series of sfdx commands simplifiying tasks that require a number of commands to be executed

[![Version](https://img.shields.io/npm/v/sfdx-executor.svg)](https://npmjs.org/package/sfdx-executor)
[![CircleCI](https://circleci.com/gh/gavinhughpalmer/sfdx-executor/tree/master.svg?style=shield)](https://circleci.com/gh/gavinhughpalmer/sfdx-executor/tree/master)
[![Known Vulnerabilities](https://snyk.io/test/github/gavinhughpalmer/sfdx-executor/badge.svg)](https://snyk.io/test/github/gavinhughpalmer/sfdx-executor)
[![Downloads/week](https://img.shields.io/npm/dw/sfdx-executor.svg)](https://npmjs.org/package/sfdx-executor)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

<!-- toc -->
* [Debugging your plugin](#debugging-your-plugin)
<!-- tocstop -->
<!-- install -->
<!-- usage -->
```sh-session
$ npm install -g sfdx-executor
$ sfdx COMMAND
running command...
$ sfdx (-v|--version|version)
sfdx-executor/0.1.1 darwin-x64 node-v14.4.0
$ sfdx --help [COMMAND]
USAGE
  $ sfdx COMMAND
...
```
<!-- usagestop -->
<!-- commands -->
* [`sfdx executor:run -p <string> -c <string> [-a <array>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-executorrun--p-string--c-string--a-array---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)

## `sfdx executor:run -p <string> -c <string> [-a <array>] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

This command allows a series of SFDX commands to be scripted without the need for bash scripts (which are then not cross platform), this can automate tasks like setting up a scratch org

```
USAGE
  $ sfdx executor:run -p <string> -c <string> [-a <array>] [--json] [--loglevel 
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -a, --arguments=arguments
      An array of the elements that you wish to pass into the command being executed, the values will then be entered in 
      by their index of the array into the number (eg $1) within the tasks in the plan file

  -c, --command=command
      (required) The specific command that you wish to run from the plan file

  -p, --planfile=planfile
      (required) The path to the plan json file

  --json
      format output as json

  --loglevel=(trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL)
      [default: warn] logging level for this command invocation

EXAMPLE
  $ sfdx executor:run --planfile plan.json --command createScratch
     Executing Create Scratch Command...
     Executing force:org:create...
     Finished!
```

_See code: [lib/commands/executor/run.js](https://github.com/gavinhughpalmer/sfdx-executor/blob/v0.1.1/lib/commands/executor/run.js)_
<!-- commandsstop -->
<!-- debugging-your-plugin -->
# Debugging your plugin
We recommend using the Visual Studio Code (VS Code) IDE for your plugin development. Included in the `.vscode` directory of this plugin is a `launch.json` config file, which allows you to attach a debugger to the node process when running your commands.

To debug the `hello:org` command:
1. Start the inspector

If you linked your plugin to the sfdx cli, call your command with the `dev-suspend` switch:
```sh-session
$ sfdx hello:org -u myOrg@example.com --dev-suspend
```

Alternatively, to call your command using the `bin/run` script, set the `NODE_OPTIONS` environment variable to `--inspect-brk` when starting the debugger:
```sh-session
$ NODE_OPTIONS=--inspect-brk bin/run hello:org -u myOrg@example.com
```

2. Set some breakpoints in your command code
3. Click on the Debug icon in the Activity Bar on the side of VS Code to open up the Debug view.
4. In the upper left hand corner of VS Code, verify that the "Attach to Remote" launch configuration has been chosen.
5. Hit the green play button to the left of the "Attach to Remote" launch configuration window. The debugger should now be suspended on the first line of the program.
6. Hit the green play button at the top middle of VS Code (this play button will be to the right of the play button that you clicked in step #5).
<br><img src=".images/vscodeScreenshot.png" width="480" height="278"><br>
Congrats, you are debugging!

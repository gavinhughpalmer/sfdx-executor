sfdx-executor
=============

This SFDX plugin is designed to execure series of SFDX commands sequentially, in a cross platform way, to eliminate the need for multiple script files in a repository for series of repeatable taks.

[![Version](https://img.shields.io/npm/v/sfdx-executor.svg)](https://npmjs.org/package/sfdx-executor)
[![CircleCI](https://circleci.com/gh/gavinhughpalmer/sfdx-executor/tree/master.svg?style=svg)](https://circleci.com/gh/gavinhughpalmer/sfdx-executor/tree/master)
[![Known Vulnerabilities](https://snyk.io/test/github/gavinhughpalmer/sfdx-executor/badge.svg)](https://snyk.io/test/github/gavinhughpalmer/sfdx-executor)
[![Downloads/week](https://img.shields.io/npm/dw/sfdx-executor.svg)](https://npmjs.org/package/sfdx-executor)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

# Plan Files
The SFDX Executor plugin works from plan files, these are defined in a json format and contain the list of tasks that should be executed when running the command. A simple example is highlighted below which creates a scratch org, pushes the metadata to it and assigns a permission set to the user created.

## Example Plan File
```json
{
    "createScratch": {
        "label": "Create Scratch",
        "description": "This command will run all the nessisary commands to setup a scratch org",
        "tasks": [
            {"type": "sfdx", "command": "force:org:create --definitionfile config/project-scratch-def.json --setalias ${1} --durationdays 30 --setdefaultusername"},
            {"type": "sfdx", "command": "force:source:push --targetusername ${1} --forceoverwrite"},
            {"type": "sfdx", "command": "force:user:permset:assign --permsetname My_Perms --targetusername ${1}"}
        ],
        "propagateErrors": false
    }
}
```
The name of the object (ie "createScratch" in the above instance), is what should then be passed into the executor:run command as the --command (-c) attribute. The label that is defined will be output to the terminal when the command is run. The description is used for informational purposes only, to give the user an understanding of what the commands are doing.

## Tasks
Tasks can be split into 3 main types, those are:
1. SFDX - These are designed to execute SFDX commands, this can be from the base SFDX package, or any plugins that are installed (or even nested executor:run commands). To add these in the type field should be set to "sfdx" and then the "command" should contain the rest of the command (ie excluding the sfdx at the front).
2. File System - These are for manipulating the file system, for example replacing ids before deploying to an environment. There are 5 main commands which can be executed here (*Note: currently spaces are not supported in any of the terms of file paths, regardless of escaping*):
   1. replace - Replaces all instances of a string in a file, written in the form `replace term with other term in my/file/path`
   2. delete - Deletes a file, written in the form `delete my/file/path`
   3. move - Moves a file to a new location, written in the form `move my/first/file/path to my/new/file/path`
   4. append - Appends the file contents to an existing file, written in the form `append contents to my/file/path`
   5. write - Writes the contents to a file (it will overwrite if the file already exists), written in the form `write contents to my/file/path`
3. Parallel - This is a special form of tasks which actually acceps a new list of tasks in the field "parallelTasks", this will then execute the tasks in parallel (using `Promise.all()`).

## Attributes
Attributes can be used in the "command" section of a tasks, this will then be swapped out at execution time for the value that is passed into the --attributes (-a) parameter in the command line. This parameter will accept a comma seperated list. The attributes should be entered into the "command" in the form ${x}, where x is a number representing the index in the attributes array that is passed in.

## Error Handling
There are a few options for handling and recovering from errors built into the plugin, which will be detailed more below.

### On Error
The "onError" attribute within a plan file accepts a task object, this will then be executed in the case of an error being thrown.

### Propagating Errors
There is a field in the base command file (shown above), of "propagateErrors", this flag will determine if an error is returned to the terminal if a failure occurs. Alone this may not be useful, but in conjunction with the "onError" field (see above), you can handle the errors gracefully and return a success.

### Finally
The "finally" attribute within a plan file accepts a task object, this will be executed as the last step of an execution, regardless of success or failure.

### Rerunning
If a failure does occur midway through executing, the command can be rerun from the point of failure by using the --resume (-r) attribute, and passing in the item of the list that it should start from (note parallel tasks count as 1 task). This will be output to the terminal in case of failure.

<!-- toc -->
* [Plan Files](#plan-files)
* [Debugging your plugin](#debugging-your-plugin)
<!-- tocstop -->
<!-- install -->
<!-- usage -->
```sh-session
$ npm install -g sfdx-executor
$ sfdx COMMAND
running command...
$ sfdx (-v|--version|version)
sfdx-executor/1.3.1 darwin-x64 node-v14.13.0
$ sfdx --help [COMMAND]
USAGE
  $ sfdx COMMAND
...
```
<!-- usagestop -->
<!-- commands -->
* [`sfdx executor:run -p <string> -c <string> [-a <array>] [-r <number>] [-t] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`](#sfdx-executorrun--p-string--c-string--a-array--r-number--t---json---loglevel-tracedebuginfowarnerrorfataltracedebuginfowarnerrorfatal)

## `sfdx executor:run -p <string> -c <string> [-a <array>] [-r <number>] [-t] [--json] [--loglevel trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]`

This command allows a series of SFDX commands to be scripted without the need for bash scripts (which are then not cross platform), this can automate tasks like setting up a scratch org

```
USAGE
  $ sfdx executor:run -p <string> -c <string> [-a <array>] [-r <number>] [-t] [--json] [--loglevel 
  trace|debug|info|warn|error|fatal|TRACE|DEBUG|INFO|WARN|ERROR|FATAL]

OPTIONS
  -a, --arguments=arguments
      An array of the elements that you wish to pass into the command being executed, the values will then be entered in 
      by their index of the array into the number (eg ${1}) within the tasks in the plan file

  -c, --command=command
      (required) The specific command that you wish to run from the plan file

  -p, --planfile=planfile
      (required) The path to the plan json file

  -r, --resume=resume
      Flag to allow for a command execution to resume part way along the processing

  -t, --includetimestamp
      This flag will include a timestamp in the execution of each of the commands, this can be helpful with profiling a 
      series of command executions. This is logged in milliseconds since epoch

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

_See code: [lib/commands/executor/run.js](https://github.com/gavinhughpalmer/sfdx-executor/blob/v1.3.1/lib/commands/executor/run.js)_
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

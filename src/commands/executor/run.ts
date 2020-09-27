import { flags, SfdxCommand } from '@salesforce/command';
import { fs, Messages, SfdxError } from '@salesforce/core';
import { spawn } from 'child_process';

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
// or any library that is using the messages framework can also be loaded this way.
const messages = Messages.loadMessages('sfdx-executor', 'org');

export default class Executor extends SfdxCommand {

    public static description = messages.getMessage('commandDescription');

    public static examples = [
        `$ sfdx executor:run --planfile plan.json --command createScratch
  Executing Create Scratch Command...
  Executing force:org:create...
  Finished!
  `
    ];

    public static args = [{ name: 'file' }];

    protected static flagsConfig = {
        planfile: flags.string({ char: 'p', description: messages.getMessage('planFileFlagDescription'), required: true }),
        command: flags.string({ char: 'c', description: messages.getMessage('planCommandFlagDescription'), required: true }),
        arguments: flags.array({ char: 'a', description: messages.getMessage('argumentsFlagDescription') }),
        resume: flags.number({ char: 'r', description: messages.getMessage('resumeFlagDescription'), default: 0})
    };

    protected static requiresUsername = false;
    protected static supportsDevhubUsername = false;
    protected static requiresProject = false;
    private static argumentPlaceholder = /\$\{(\d+)\}/;

    public async run(): Promise<void> {
        const command = await this.getCommand();
        this.ux.log(`Executing ${command.label}...`);
        let errorMessage: string;
        try {
            for (let i = this.flags.resume; i < command.tasks.length; i++) {
                const task = command.tasks[i];
                task.index = i;
                await this.executeTask(task);
            }
        } catch (error) {
            errorMessage = error.message;
            if (error instanceof TaskExecutionError) {
                this.ux.log(`An error has occured, you can rerun with the parameter "--resume ${error.lineNumber}"`);
            }
            if (command.onError) {
                this.ux.log('Running On Error Task...');
                await this.executeTask(command.onError);
            }
        }
        if (command.finally) {
            this.ux.log('Running Finally Task...');
            await this.executeTask(command.finally);
        }
        if (errorMessage && command.propagateErrors) {
            throw new SfdxError(errorMessage);
        }
        // TODO could also include logic to loop over certain variables as they are passed into the plugin (eg with permission sets so we can just list out a bunch and pass them in there)
        // TODO Add in custom commands
        // TODO document how to setup the plan files
        // TODO could add parallel processing steps to increase efficiency eg perm set assign and apex anon scripts to run side by side (will have to test and see if this makes a difference with the salesforce API's)
        // TODO Add conditionals to the commands
    }

    private async getCommand(): Promise<Command> {
        const planFileExists = await fs.fileExists(this.flags.planfile);
        if (!planFileExists) {
            throw new SfdxError(messages.getMessage('planFileMissingError'));
        }
        const planFile = await fs.readJson(this.flags.planfile);
        const planHasCommand = planFile.hasOwnProperty(this.flags.command);
        if (!planHasCommand) {
            throw new SfdxError(messages.getMessage('commandPlanMissingError'));
        }
        const command = planFile[this.flags.command];
        if (!command.tasks) {
            throw new SfdxError(messages.getMessage('noTasksDefinedError'));
        }
        return command;
    }

    private executeTask(task: Task): Promise<void | void[]> {
        // Could make this a map...
        switch (task.type) {
            case 'parallel':
                // TODO validate this field is populated for parallel marked data structures
                return this.resolveParallelTasks(task);
            case 'sfdx':
                return this.resolveSfdxTask(task);
            case 'fs':
                return this.resolveFsTask(task);
            default:
                throw new NotYetSupportedError(`The command type of ${task.type} is not supported`);
                break;
        }
    }

    private resolveParallelTasks(task: Task): Promise<void[]> {
        const taskList = [];
        for (const parallelTask of task.parallelTasks) {
            // assign the index of the parent to ensure if an error is returned it starts the whole parallel set of tasks again
            parallelTask.index = task.index;
            taskList.push(this.executeTask(parallelTask));
        }
        return Promise.all(taskList);
    }

    private resolveSfdxTask(task: Task): Promise<void> {
        return new Promise((resolve, reject) => {
            const command = this.replaceArguments(task.command);
            this.ux.log(`Executing 'sfdx ${command}'...`);
            const spawnedCommand = spawn('sfdx', command.split(' '), {
                stdio: 'inherit'
            });
            spawnedCommand.on('close', code => {
                if (code !== 0) {
                    reject(new TaskExecutionError(`Command failed with error code ${code}`, task.index));
                } else {
                    resolve();
                }
            });
            spawnedCommand.on('error', error => {
                reject(new TaskExecutionError(error.message, task.index));
            });
        });
    }

    private async resolveFsTask(task: Task): Promise<void> {
        throw new NotYetSupportedError('File system commands are not yet supported');
        // const verbs = command.split(' ');
        // switch (verbs[0]) {
        //     case 'replace':
        //         const fileContents = await fs.readFile(verbs[5], 'utf8');
        //         fileContents.replace(verbs[1], verbs[3]);
        //         await fs.writeFile(verbs[5], fileContents);
        //         break;
        //     case 'move':
        //         fs.unlink
        //         break;
        //     case 'delete':
        //         await fs.unlink(verbs[1]);
        //         break;
        //     case 'append':
        //         await fs.writeFile(verbs[3], verbs[1], {flag: 'a'});
        //         break;
        //     case 'write':
        //         await fs.writeFile(verbs[3], verbs[1]);
        //         break;
        //     default:
        //         // TODO throw error
        //         break;
        // }
    }

    private replaceArguments(task: string): string {
        const inputArguments = this.flags.arguments;
        let argumentPlaceholders = Executor.argumentPlaceholder.exec(task);
        if (!inputArguments && argumentPlaceholders) {
            throw new SfdxError(messages.getMessage('noArgumentsProvidedError'));
        }
        while (argumentPlaceholders !== null) {
            const replacement = argumentPlaceholders[0];
            const argument = inputArguments[argumentPlaceholders[1]];
            if (task.includes(replacement)) {
                // using in place of replace all as this doesn't seem to exist in this version of node
                task = task.split(replacement).join(argument);
            } else {
                throw new SfdxError(messages.getMessage('noArgumentsProvidedError'));
            }
            argumentPlaceholders = Executor.argumentPlaceholder.exec(task);
        }
        return task;
    }
}

interface Command {
    tasks: Task[];
    label: string;
    onError: Task;
    finally: Task;
    propagateErrors: boolean;
}

interface Task {
    type: string;
    command: string;
    parallelTasks: Task[];
    index: number;
}

class TaskExecutionError extends Error {
    public lineNumber: number;
    constructor(errorMessage: string, lineNumber: number) {
        super(errorMessage);
        this.lineNumber = lineNumber;
    }
}

class NotYetSupportedError extends Error {}

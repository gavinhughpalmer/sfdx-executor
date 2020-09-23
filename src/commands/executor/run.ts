import { flags, SfdxCommand } from '@salesforce/command';
import { fs, Messages, SfdxError } from '@salesforce/core';
import { exec } from 'child_process';

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
        arguments: flags.array({ char: 'a', description: messages.getMessage('argumentsFlagDescription') })
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
            const startingNumber = await this.getStartingTask();
            for (let i = startingNumber; i++; i < command.tasks.length) {
                const task = command.tasks[i];
                task.index = i;
                await this.executeTask(task);
            }
        } catch (error) {
            errorMessage = error.message;
            if (error instanceof TaskError) {
                this.writeError((error as TaskError).lineNumber);
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
        await this.deleteError();
        // TODO could also include logic to loop over certain variables as they are passed into the plugin (eg with permission sets so we can just list out a bunch and pass them in there)
        // TODO Add in custom commands
        // TODO document how to setup the plan files
        // TODO could add parallel processing steps to increase efficiency eg perm set assign and apex anon scripts to run side by side (will have to test and see if this makes a difference with the salesforce API's)
    }

    // TODO Could resume from using an input parameter rather than a file, this puts the flexibility in the users hands
    private async getStartingTask(): Promise<number> {
        const errorFile = await fs.readJson('.sfdx-executor-error.json');
        return errorFile['lineNumber'];
    }

    private async writeError(lineNumber: number): Promise<void> {
        const errorFile = {
            __comment: "This file is used for tracking errors in the command running process, please do not commit to source control",
            lineNumber: lineNumber
        };
        fs.writeJson('.sfdx-executor-error.json', errorFile);
    }

    private async deleteError(): Promise<void> {
        fs.unlink('.sfdx-executor-error.json');
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
        switch (task.type) {
            case 'parallel':
                // TODO validate this field is populated for parallel marked data structures
                return this.resolveParallelTasks(task.parallelTasks);
            case 'sfdx':
                return this.resolveSfdxTask(task);
            case 'fs':
                return this.resolveFsTask(task.command);
            default:
                // TODO throw an error here
                break;
        }
    }

    private resolveParallelTasks(parallelTasks: Task[]): Promise<void[]> {
        const taskList = [];
        for (const parallelTask of parallelTasks) {
            taskList.push(this.executeTask(parallelTask));
        }
        return Promise.all(taskList);
    }

    private resolveSfdxTask(task: Task): Promise<void> {
        return new Promise((resolve, reject) => {
            const command = this.replaceArguments(task.command);
            this.ux.log(`Executing ${command}...`);
            exec(`sfdx ${command}`, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                }
                if (stderr) {
                    reject(new TaskError(stderr, task.index));
                }
                this.ux.log(stdout);
                resolve();
            });
        });
    }

    private async resolveFsTask(command: string): Promise<void> {
        // TODO Placeholder not yet supported
        const verbs = command.split(' ');
        switch (verbs[0]) {
            case 'replace':

                break;
            case 'move':

                break;
            case 'delete':

                break;
            case 'append':

                break;
            case 'write':

                break;
            default:
                break;
        }
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

class TaskError extends Error {
    public lineNumber: number;
    constructor(errorMessage: string, lineNumber: number) {
        super(errorMessage);
        this.lineNumber = lineNumber;
    }
}

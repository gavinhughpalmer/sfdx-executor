import { flags, SfdxCommand } from '@salesforce/command';
import { fs, Messages, SfdxError } from '@salesforce/core';
import { execute } from '../../main/executor';
import { Command, TaskExecutionError } from '../../main/task';

// Initialize Messages with the current plugin directory
Messages.importMessagesDirectory(__dirname);

// Load the specific messages for this file. Messages from @salesforce/command, @salesforce/core,
const messages = Messages.loadMessages('sfdx-executor', 'org');

// TODO refactor naming as it is confusing with task and command being used in different places
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
    private static argumentPlaceholder = /\$\{(\d+)\}/; // looks for ${0} in the arguments

    public async run(): Promise<void> {
        const command = await this.getCommand();
        this.ux.log(`Executing ${command.label}...`);
        let errorMessage: string;
        try {
            for (let i = this.flags.resume; i < command.tasks.length; i++) {
                const taskToRun = command.tasks[i];
                taskToRun.command = this.replaceArguments(taskToRun.command);
                this.ux.log(`Executing '${taskToRun.type} ${taskToRun.command ? taskToRun.command : ' tasks'}'...`);
                const task = command.tasks[i];
                task.index = i;
                await execute(task);
            }
        } catch (error) {
            errorMessage = error.message;
            if (error instanceof TaskExecutionError) {
                const terminalCommand = `sfdx executor:run -p ${this.flags.planfile} -c ${this.flags.command} ${this.flags.arguments ? ' -a ' + this.flags.arguments : ''}`;
                this.ux.log(`
                    An error has occured, you can rerun using "${terminalCommand} --resume ${error.lineNumber}"
                    or if you wish to skip the current command "${terminalCommand} --resume ${error.lineNumber + 1}"
                `);
            }
            if (command.onError) {
                this.ux.log('Running On Error Task...');
                await execute(command.onError);
            }
        }
        if (command.finally) {
            this.ux.log('Running Finally Task...');
            await execute(command.finally);
        }
        if (errorMessage && command.propagateErrors) {
            throw new SfdxError(errorMessage);
        }
        // TODO could also include logic to loop over certain variables as they are passed into the plugin (eg with permission sets so we can just list out a bunch and pass them in there)
        // TODO document how to setup the plan files
        // TODO validate data structures that are incomming
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
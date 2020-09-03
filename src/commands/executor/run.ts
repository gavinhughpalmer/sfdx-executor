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
            for (const task of command.tasks) {
                await this.executeSfdxTask(task);
            }
        } catch (error) {
            errorMessage = error.message;
            if (command.onError) {
                this.ux.log('Running On Error Task...');
                await this.executeSfdxTask(command.onError);
            }
        }
        if (command.finally) {
            this.ux.log('Running Finally Task...');
            await this.executeSfdxTask(command.finally);
        }
        if (errorMessage && command.propagateErrors) {
            throw new SfdxError(errorMessage);
        }
        // TODO could also include logic to loop over certain variables as they are passed into the plugin (eg with permission sets so we can just list out a bunch and pass them in there)
        // TODO Add in custom commands
        // TODO document how to setup the plan files
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

    private executeSfdxTask(task: string): Promise<void> {
        return new Promise((resolve, reject) => {
            task = this.replaceArguments(task);
            this.ux.log(`Executing ${task}...`);
            exec(`sfdx ${task}`, (error, stdout, stderr) => {
                if (error) {
                    reject(error);
                }
                if (stderr) {
                    reject(new Error(stderr));
                }
                this.ux.log(stdout);
                resolve();
            });
        });
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
    tasks: string[];
    label: string;
    onError: string;
    finally: string;
    propagateErrors: boolean;
}

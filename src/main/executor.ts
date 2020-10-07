import { resolveFsTask } from './executors/file-system';
import { ParallelTasksExecutor } from './executors/parallel';
import { resolveSfdxTask } from './executors/sfdx';
import { NotYetSupportedError, Task, TaskExecutionError } from './task';
import { replaceAll } from './utilities';

export class TaskExecutor {
    private static argumentPlaceholder = /\$\{(\d+)\}/; // looks for ${0} in the arguments
    private parallelExecutor: ParallelTasksExecutor;
    private taskExecutors = {
        parallel: null,
        sfdx: resolveSfdxTask,
        fs: resolveFsTask
    };

    private inputArguments: string[];

    constructor(inputArguments?: string[]) {
        this.inputArguments = inputArguments || [];
        this.parallelExecutor = new ParallelTasksExecutor(this);
        this.taskExecutors['parallel'] = this.parallelExecutor.resolveParallelTasks;
    }

    public async execute(task: Task): Promise<void | void[]> {
        if (!(task.type in this.taskExecutors)) {
            throw new NotYetSupportedError(`The command type of ${task.type} is not supported`);
        }
        try {
            task.command = this.replaceArguments(task.command);
            await this.taskExecutors[task.type](task);
        } catch (error) {
            throw new TaskExecutionError(error.message, task.index);
        }
    }

    private replaceArguments(command: string): string {
        let argumentPlaceholders = TaskExecutor.argumentPlaceholder.exec(command);
        if ((!Array.isArray(this.inputArguments) || !this.inputArguments.length) && argumentPlaceholders) {
            throw new Error('Invalid arguments have been provided');
        }
        while (argumentPlaceholders !== null) {
            const replacement = argumentPlaceholders[0];
            const argument = this.inputArguments[argumentPlaceholders[1]];
            if (!!argument) {
                command = replaceAll(command, replacement, argument);
            } else {
                throw new Error('Invalid arguments have been provided');
            }
            argumentPlaceholders = TaskExecutor.argumentPlaceholder.exec(command);
        }
        return command;
    }
}

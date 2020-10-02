import { resolveFsTask } from './executors/file-system';
import { resolveParallelTasks } from './executors/parallel';
import { resolveSfdxTask } from './executors/sfdx';
import { NotYetSupportedError, Task, TaskExecutionError } from './task';

const taskExecutors = {
    parallel: resolveParallelTasks,
    sfdx: resolveSfdxTask,
    fs: resolveFsTask
};

export async function execute(task: Task): Promise<void | void[]> {
    if (!(task.type in taskExecutors)) {
        throw new NotYetSupportedError(`The command type of ${task.type} is not supported`);
    }
    try {
        await taskExecutors[task.type](task);
    } catch (error) {
        throw new TaskExecutionError(error.message, task.index);
    }
}
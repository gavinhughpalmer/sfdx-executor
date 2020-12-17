import { TaskExecutor } from '../executor';
import { Task } from '../task';

export class ParallelTasksExecutor {
    private readonly inputArguments: string[];

    constructor(inputArguments: string[]) {
        this.inputArguments = inputArguments || [];
    }

    public resolveParallelTasks(task: Task): Promise<void[]> {
        if (!task.parallelTasks) {
            return Promise.reject(new Error('You must specify the parallel tasks for a parrallel type task'));
        }
        const taskList = [];
        for (const parallelTask of task.parallelTasks) {
            if (parallelTask.type === 'parallel') {
                return Promise.reject(new Error('You cannot pass parallel tasks into a parallel task'));
            }
            // assign the index of the parent to ensure if an error is returned it starts the whole parallel set of tasks again
            parallelTask.index = task.index;
            const taskExecutor = new TaskExecutor(this.inputArguments);
            taskList.push(taskExecutor.execute(parallelTask));
        }

        // TODO Errors aren't being returned from the parallel execution
        return Promise.all(taskList);
    }
}

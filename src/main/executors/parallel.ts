import { execute } from '../executor';
import { Task } from '../task';

export function resolveParallelTasks(task: Task): Promise<void[]> {
    const taskList = [];
    for (const parallelTask of task.parallelTasks) {
        // assign the index of the parent to ensure if an error is returned it starts the whole parallel set of tasks again
        parallelTask.index = task.index;
        taskList.push(execute(parallelTask));
    }
    return Promise.all(taskList);
}
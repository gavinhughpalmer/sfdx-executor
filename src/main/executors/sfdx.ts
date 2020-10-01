import { spawn } from 'child_process';
import { Task, TaskExecutionError } from '../task';

export function resolveSfdxTask(task: Task): Promise<void> {
    return new Promise((resolve, reject) => {
        const spawnedCommand = spawn('sfdx', task.command.split(' '), {
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
import { spawn } from 'child_process';
import { Task } from '../task';

export function resolveSfdxTask(task: Task): Promise<void> {
    if (!task.command) {
        return Promise.reject('The command must be specifid for an sfdx type task');
    }
    return new Promise((resolve, reject) => {
        const spawnedCommand = spawn('sfdx', task.command.split(' '), {
            stdio: 'inherit',
            // added due to a bug in windows that throws ENOENT error, https://stackoverflow.com/questions/37459717/error-spawn-enoent-on-windows
            shell: process.platform === 'win32',
        });
        spawnedCommand.on('close', (code) => {
            if (code !== 0) {
                reject(new Error(`Command failed with error code ${code}`));
            } else {
                resolve();
            }
        });
        spawnedCommand.on('error', (error) => {
            reject(new Error(error.message));
        });
    });
}

import { fs } from '@salesforce/core';
import { NotYetSupportedError, Task } from '../task';
import { replaceAll } from '../utilities';

const incorrectNumberOfVerbs = 'The incorrect number of terms has been used for the keyword';

async function replace(verbs: string[]): Promise<void> {
    if (verbs.length !== 6) {
        throw new Error(incorrectNumberOfVerbs);
    }
    let fileContents = await fs.readFile(verbs[5], 'utf8');
    fileContents = replaceAll(fileContents, verbs[1], verbs[3]);
    await fs.writeFile(verbs[5], fileContents);
}

async function move(verbs: string[]): Promise<void> {
    if (verbs.length !== 4) {
        throw new Error(incorrectNumberOfVerbs);
    }
    const contents = await fs.readFile(verbs[1], 'utf8');
    await fs.writeFile(verbs[3], contents);
    await fs.unlink(verbs[1]);
}

async function deleteFile(verbs: string[]): Promise<void> {
    if (verbs.length !== 2) {
        throw new Error(incorrectNumberOfVerbs);
    }
    await fs.unlink(verbs[1]);
}

async function append(verbs: string[]): Promise<void> {
    if (verbs.length !== 4) {
        throw new Error(incorrectNumberOfVerbs);
    }
    await fs.writeFile(verbs[3], verbs[1], {flag: 'a'});
}

async function write(verbs: string[]): Promise<void> {
    if (verbs.length !== 4) {
        throw new Error(incorrectNumberOfVerbs);
    }
    await fs.writeFile(verbs[3], verbs[1]);
}

const functions = {
    replace,
    move,
    deleteFile,
    append,
    write
};

export function resolveFsTask(task: Task): Promise<void> {
    if (!task.command) {
        return Promise.reject('The command must be specifid for a file system type task');
    }
    const verbs = task.command.split(' ');
    if (!(verbs[0] in functions)) {
        throw new NotYetSupportedError(`The function ${verbs[0]} is not supported`);
    }
    const functionCall = functions[verbs[0]];
    return functionCall(verbs);
}
import { fs } from '@salesforce/core';
import { NotYetSupportedError, Task } from '../task';
import { replaceAll } from '../utilities';

async function replace(verbs: string[]): Promise<void> {
    let fileContents = await fs.readFile(verbs[5], 'utf8');
    fileContents = replaceAll(fileContents, verbs[1], verbs[3]);
    await fs.writeFile(verbs[5], fileContents);
}

async function move(verbs: string[]): Promise<void> {
    const contents = await fs.readFile(verbs[1], 'utf8');
    await fs.writeFile(verbs[3], contents);
    await fs.unlink(verbs[1]);
}

async function deleteFile(verbs: string[]): Promise<void> {
    await fs.unlink(verbs[1]);
}

async function append(verbs: string[]): Promise<void> {
    await fs.writeFile(verbs[3], verbs[1], {flag: 'a'});
}

async function write(verbs: string[]): Promise<void> {
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
    // TODO Error handling around the verbs that are found
    const verbs = task.command.split(' ');
    if (!(verbs[0] in functions)) {
        throw new NotYetSupportedError(`The function ${verbs[0]} is not supported`);
    }
    const functionCall = functions[verbs[0]];
    return functionCall(verbs);
}
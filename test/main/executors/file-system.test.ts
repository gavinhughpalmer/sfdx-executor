import * as chai from 'chai';
import chaiAsPromised = require("chai-as-promised");
import { resolveFsTask } from '../../../src/main/executors/file-system';
import { Task } from '../../../src/main/task';

chai.use(chaiAsPromised);
const expect = chai.expect;

//TODO tests for each of the commands, and with incorrect numbers of arguments passed in

describe('Resolve File System Tasks', () => {
    // it('should resolve for a successful command', () => {
    //     const myTask: Task = {
    //         type: 'sfdx',
    //         command: 'force -h',
    //         index: 0
    //     };
    //     return expect(resolveFsTask(myTask)).to.eventually.be.fulfilled;
    // });
    // it('should error for invalid arguments', () => {
    //     const myTask: Task = {
    //         type: 'sfdx',
    //         command: 'force:org:create',
    //         index: 0
    //     };
    //     return expect(resolveFsTask(myTask)).to.eventually.be.rejected;
    // });
    it('should error for without a command specified', () => {
        const myTask: Task = {
            type: 'fs',
            index: 0
        };
        return expect(resolveFsTask(myTask)).to.eventually.be.rejected;
    });
});
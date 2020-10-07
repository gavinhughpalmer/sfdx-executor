import * as chai from 'chai';
import chaiAsPromised = require("chai-as-promised");
import { resolveSfdxTask } from '../../../src/main/executors/sfdx';
import { Task } from '../../../src/main/task';

chai.use(chaiAsPromised);
const expect = chai.expect;

describe('Resolve SFDX Tasks', () => {
    it('should resolve for a successful command', () => {
        const myTask: Task = {
            type: 'sfdx',
            command: 'force -h',
            index: 0
        };
        return expect(resolveSfdxTask(myTask)).to.eventually.be.fulfilled;
    });
    it('should error for invalid arguments', () => {
        const myTask: Task = {
            type: 'sfdx',
            command: 'force:org:create',
            index: 0
        };
        return expect(resolveSfdxTask(myTask)).to.eventually.be.rejected;
    });
    it('should error for without a command specified', () => {
        const myTask: Task = {
            type: 'sfdx',
            index: 0
        };
        return expect(resolveSfdxTask(myTask)).to.eventually.be.rejected;
    });
});
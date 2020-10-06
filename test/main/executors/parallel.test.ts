import * as chai from 'chai';
import chaiAsPromised = require("chai-as-promised");
import { resolveParallelTasks } from '../../../src/main/executors/parallel';
import { Task } from '../../../src/main/task';

chai.use(chaiAsPromised);
const expect = chai.expect;

describe('Resolve Parallel Tasks', () => {
    it('should resolve for both successful commands (within the same timeframe)', () => {
        const myTask: Task = {
            type: 'parallel',
            parallelTasks: [
                { type: "sfdx", command: "force -h" },
                { type: "sfdx", command: "force -h" }
            ],
            index: 0
        };
        return expect(resolveParallelTasks(myTask)).to.eventually.be.fulfilled;
    });
    it('should reject for an unsuccessful command', () => {
        const myTask: Task = {
            type: 'parallel',
            parallelTasks: [
                { type: "sfdx", command: "force:org:create" },
                { type: "sfdx", command: "force -h" }
            ],
            index: 0
        };
        return expect(resolveParallelTasks(myTask)).to.eventually.be.rejected;
    });
    it('should error for nested parallel commands', () => {
        const myTask: Task = {
            type: 'parallel',
            parallelTasks: [
                {
                    type: 'parallel',
                    parallelTasks: [
                        { type: "sfdx", command: "force -h" },
                        { type: "sfdx", command: "force -h" }
                    ]
                }
            ],
            index: 0
        };
        return expect(resolveParallelTasks(myTask)).to.eventually.be.rejected;
    });
    it('should error when parallelTasks aren\'t specified', () => {
        const myTask: Task = {
            type: 'parallel',
            index: 0
        };
        return expect(resolveParallelTasks(myTask)).to.eventually.be.rejected;
    });
});
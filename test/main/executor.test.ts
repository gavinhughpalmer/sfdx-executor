import * as chai from 'chai';
import chaiAsPromised = require("chai-as-promised");
import { TaskExecutor } from '../../src/main/executor';
import { Task, NotYetSupportedError, TaskExecutionError } from '../../src/main/task';

chai.use(chaiAsPromised);
const expect = chai.expect;

// No need to hit the positive tests in this test as they will be covered in the respective executor function calls

describe('Executor', () => {
    it('Should throw an exception for an unsupported task', () => {
        const taskExecutor = new TaskExecutor();
        const fakeTask: Task = {
            type: 'a fake type',
            command: 'a fake command',
            index: 0
        };
        return expect(taskExecutor.execute(fakeTask)).to.be.rejectedWith(NotYetSupportedError);
    });

    it('Should throw an exception for an unsupported command', async () => {
        const taskExecutor = new TaskExecutor();
        const fakeTask: Task = {
            type: 'fs',
            command: 'a fake command',
            index: 0
        };
        return expect(taskExecutor.execute(fakeTask)).to.eventually
            .be.rejected.and.be.an.instanceOf(TaskExecutionError)
            .and.have.property('lineNumber', fakeTask.index);
    });
});



// TODO include test for replace arguments, for single, multiple, arguments that arent in the command (and shoultn't throw an error), commands with arguments that don't exist, commands that have arguments when none are passed in
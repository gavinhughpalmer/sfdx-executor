import * as chai from 'chai';
import chaiAsPromised = require("chai-as-promised");
import { execute } from '../../src/main/executor';
import { Task, NotYetSupportedError, TaskExecutionError } from '../../src/main/task';

chai.use(chaiAsPromised);
const expect = chai.expect;

// No need to hit the positive tests in this test as they will be covered in the respective executor function calls

describe('Executor', () => {
    it('Should throw an exception for an unsupported task', () => {
        const fakeTask: Task = {
            type: 'a fake type',
            command: 'a fake command',
            index: 0
        };
        return expect(execute(fakeTask)).to.be.rejectedWith(NotYetSupportedError);
    });

    it('Should throw an exception for an unsupported command', async () => {
        const fakeTask: Task = {
            type: 'fs',
            command: 'a fake command',
            index: 0
        };
        return expect(execute(fakeTask)).to.eventually
            .be.rejected.and.be.an.instanceOf(TaskExecutionError)
            .and.have.property('lineNumber', fakeTask.index);
    });
});
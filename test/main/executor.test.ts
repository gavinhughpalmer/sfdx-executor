import * as chai from 'chai';
import chaiAsPromised = require("chai-as-promised");
import { TaskExecutor } from '../../src/main/executor';
import { Task, NotYetSupportedError, TaskExecutionError } from '../../src/main/task';

chai.use(chaiAsPromised);
const expect = chai.expect;

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

    it('Replace multiple arguments passed in', async () => {
        const firstArgument = 'firstArgument';
        const secondArgument = 'secondArgument';

        const taskExecutor = new TaskExecutor([firstArgument, secondArgument]);
        const fakeTask: Task = {
            type: 'fs',
            command: '${0}-${1}',
            index: 0
        };
        try {
            await taskExecutor.execute(fakeTask);
        } catch(error) {
            // do nothing we know an error will be thrown here
        }
        return expect(fakeTask.command).to.equal(`${firstArgument}-${secondArgument}`);
    });

    it('Ignore arguments that aren\'t in the command', () => {
        const firstArgument = 'firstArgument';
        const secondArgument = 'secondArgument';

        const taskExecutor = new TaskExecutor([firstArgument, secondArgument]);
        const fakeTask: Task = {
            type: 'sfdx',
            command: 'force -h',
            index: 0
        };
        return expect(taskExecutor.execute(fakeTask)).to.eventually.be.fulfilled;
    });

    it('Error for Arguments that don\'t exist', () => {
        const firstArgument = 'firstArgument';
        const secondArgument = 'secondArgument';

        const taskExecutor = new TaskExecutor([firstArgument, secondArgument]);
        const fakeTask: Task = {
            type: 'fs',
            command: '${2}',
            index: 0
        };
        return expect(taskExecutor.execute(fakeTask)).to.eventually.be.rejected;
    });

    it('Error when arguments aren\'t passed in but refrenced', () => {

        const taskExecutor = new TaskExecutor([]);
        const fakeTask: Task = {
            type: 'fs',
            command: '${0}',
            index: 0
        };
        return expect(taskExecutor.execute(fakeTask)).to.eventually.be.rejected;
    });
});

import * as chai from 'chai';
import chaiAsPromised = require('chai-as-promised');
import { resolveFsTask } from '../../../src/main/executors/file-system';
import { Task } from '../../../src/main/task';
import * as mock from 'mock-fs';
import { fs } from '@salesforce/core';

chai.use(chaiAsPromised);
const expect = chai.expect;

describe('Resolve File System Tasks', () => {
    beforeEach(() => {
        mock({
            'theTestFile.txt': 'This is some file contents',
        });
    });

    afterEach(() => {
        mock.restore();
    });

    it('Should replace the file contents', async () => {
        const myTask: Task = {
            type: 'fs',
            command: 'replace contents with changed-contents in theTestFile.txt',
            index: 0,
        };
        await resolveFsTask(myTask);
        return expect(fs.readFile('theTestFile.txt', 'utf8')).to.eventually.be.fulfilled.and.equal(
            'This is some file changed-contents',
        );
    });

    it('Should replace the file contents, with quoted source', async () => {
        mock({
            'theTestFile.txt': 'This is some file contents and something else',
        });
        const myTask: Task = {
            type: 'fs',
            command: "replace 'contents and something else' with changed-contents in theTestFile.txt",
            index: 0,
        };
        await resolveFsTask(myTask);
        return expect(fs.readFile('theTestFile.txt', 'utf8')).to.eventually.be.fulfilled.and.equal(
            'This is some file changed-contents',
        );
    });

    it('Should replace the file contents, with quoted target', async () => {
        const myTask: Task = {
            type: 'fs',
            command: "replace contents with 'changed contents' in theTestFile.txt",
            index: 0,
        };
        await resolveFsTask(myTask);
        return expect(fs.readFile('theTestFile.txt', 'utf8')).to.eventually.be.fulfilled.and.equal(
            'This is some file changed contents',
        );
    });

    it('Should replace the file contents, with quoted filePath', async () => {
        mock({
            'the Test File.txt': 'This is some file contents',
        });
        const myTask: Task = {
            type: 'fs',
            command: "replace contents with changed-contents in 'the Test File.txt'",
            index: 0,
        };
        await resolveFsTask(myTask);
        return expect(fs.readFile('the Test File.txt', 'utf8')).to.eventually.be.fulfilled.and.equal(
            'This is some file changed-contents',
        );
    });

    it('Should error when replace has incorrect keywords', () => {
        const myTask: Task = {
            type: 'fs',
            command: 'replace some contents with some other contents',
            index: 0,
        };
        return expect(resolveFsTask(myTask)).to.eventually.be.rejected;
    });

    it('Should move a file to a new location', async () => {
        const myTask: Task = {
            type: 'fs',
            command: 'move theTestFile.txt to theNewTestFile.txt',
            index: 0,
        };
        await resolveFsTask(myTask);
        // should we also check the old file is removed?
        return expect(fs.fileExists('theNewTestFile.txt')).to.eventually.be.fulfilled.and.be.true;
    });

    it('Should error when move has the incorrect number of keywords', () => {
        const myTask: Task = {
            type: 'fs',
            command: 'move some thing to some thing else',
            index: 0,
        };
        return expect(resolveFsTask(myTask)).to.eventually.be.rejected;
    });

    it('Should delete a file', async () => {
        const myTask: Task = {
            type: 'fs',
            command: 'delete theTestFile.txt',
            index: 0,
        };
        await resolveFsTask(myTask);
        return expect(fs.fileExists('theTestFile.txt')).to.eventually.be.fulfilled.and.be.false;
    });

    it('Should error when delete has the incorrect number of keywords', () => {
        const myTask: Task = {
            type: 'fs',
            command: 'delete something and something else',
            index: 0,
        };
        return expect(resolveFsTask(myTask)).to.eventually.be.rejected;
    });

    it('Should append to a file', async () => {
        const myTask: Task = {
            type: 'fs',
            command: 'append something-else to theTestFile.txt',
            index: 0,
        };
        await resolveFsTask(myTask);
        return expect(fs.readFile('theTestFile.txt', 'utf8')).to.eventually.be.fulfilled.and.equal(
            'This is some file contentssomething-else',
        );
    });

    it('Should append to a file with line breaks', async () => {
        const myTask: Task = {
            type: 'fs',
            command: 'append \nsomething-else to theTestFile.txt',
            index: 0,
        };
        await resolveFsTask(myTask);
        return expect(fs.readFile('theTestFile.txt', 'utf8')).to.eventually.be.fulfilled.and.equal(
            'This is some file contents\nsomething-else',
        );
    });

    it('Should error when append has the incorrect number of keywords', () => {
        const myTask: Task = {
            type: 'fs',
            command: 'append something and something else',
            index: 0,
        };
        return expect(resolveFsTask(myTask)).to.eventually.be.rejected;
    });

    it('Should write to a file', async () => {
        const myTask: Task = {
            type: 'fs',
            command: 'write something-else to theTestFile.txt',
            index: 0,
        };
        await resolveFsTask(myTask);
        return expect(fs.readFile('theTestFile.txt', 'utf8')).to.eventually.be.fulfilled.and.equal('something-else');
    });

    it('Should error when write has the incorrect number of keywords', () => {
        const myTask: Task = {
            type: 'fs',
            command: 'write something and something else',
            index: 0,
        };
        return expect(resolveFsTask(myTask)).to.eventually.be.rejected;
    });

    it('should error for without a command specified', () => {
        const myTask: Task = {
            type: 'fs',
            index: 0,
        };
        return expect(resolveFsTask(myTask)).to.eventually.be.rejected;
    });
});

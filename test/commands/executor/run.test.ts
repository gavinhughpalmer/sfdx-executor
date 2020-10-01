import { expect, test } from '@salesforce/command/lib/test';


describe('executor:run', () => {
    const plansPath = __dirname + '/test-plans.json';

    test.stderr().stdout().command([
        'executor:run',
        '--planfile', plansPath,
        '--command', 'errorWithPropagating'
    ]).it('runs Error with Propagating', ctx => {
        expect(ctx.stdout).to.contain('force:alias:set');
        expect(ctx.stderr).to.contains('ERROR running executor:run');
    });

    test.stdout().command([
        'executor:run',
        '--planfile', plansPath,
        '--command', 'errorWithFinally'
    ]).it('runs Error with Finnally Command', ctx => {
        expect(ctx.stdout).to.contain('Running Finally Task...');
    });

    test.stdout().command([
        'executor:run',
        '--planfile', plansPath,
        '--command', 'errorWithErrorHandler'
    ]).it('runs Error with On Error Command', ctx => {
        expect(ctx.stdout).to.contain('Running On Error Task...');
    });

    test.stdout().stderr().command([
        'executor:run',
        '--planfile', plansPath,
        '--command', 'successfulCommand'
    ]).it('runs Successful Command', ctx => {
        expect(ctx.stdout).to.contain('sfdx force -h');
        expect(ctx.stderr).to.equal('');
    });

    const argumentToReplace = 'randomArgument';
    test.stdout().stderr().command([
        'executor:run',
        '--planfile', plansPath,
        '--command', 'planWithArguments',
        '--arguments', argumentToReplace
    ]).it('runs Plan With Arguments', ctx => {
        expect(ctx.stdout).to.contain(argumentToReplace);
        expect(ctx.stderr).to.contain('ERROR running executor:run');
    });

    test.stderr().command([
        'executor:run',
        '--planfile', plansPath,
        '--command', 'planWithArguments'
    ]).it('runs Plan without Arguments', ctx => {
        expect(ctx.stderr).to.contain('ERROR running executor:run');
    });

    const firstArgument = 'firstArg';
    const secondArgument = 'secondArg';
    test.stdout().command([
        'executor:run',
        '--planfile', plansPath,
        '--command', 'planWithMultipleArguments',
        '--arguments', `${firstArgument},${secondArgument}`
    ]).it('runs Plan With Multiple Arguments', ctx => {
        expect(ctx.stdout).to.contain(firstArgument);
        expect(ctx.stdout).to.contain(secondArgument);
    });

    test.stdout().stderr().command([
        'executor:run',
        '--planfile', plansPath,
        '--command', 'planWithParallelTasks'
    ]).it('runs Parallel Commands', ctx => {
        expect(ctx.stdout).to.contain('Executing \'parallel  tasks\'');
        expect(ctx.stderr).to.contains('ERROR running executor:run');
    });
});

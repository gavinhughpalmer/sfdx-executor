import { expect, test } from '@salesforce/command/lib/test';


describe('executor:run', () => {
    const plansPath = __dirname + '/test-plans.json';

    test.stderr().stdout().command([
        'executor:run',
        '--planfile', plansPath,
        '--command', 'errorWithPropagating'
    ]).it('runs Error with Propagating', ctx => {
        expect(ctx.stdout).to.contain('Executing this:is:not:a:command...');
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

    test.stdout().command([
        'executor:run',
        '--planfile', plansPath,
        '--command', 'successfulCommand'
    ]).it('runs Successful Command', ctx => {
        expect(ctx.stdout).to.contain('sfdx force [--json]');
    });
});

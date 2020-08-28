import { expect, test } from '@salesforce/command/lib/test';

describe('executor:run', () => {
    test.stdout().command([
        'executor:run',
        '--planfile', 'test-plans.json',
        '--command', 'errorWithoutPropagating'
    ]).it('runs Error without Propagating', ctx => {
        expect(ctx.stdout).to.contain('teest');
    });
    // it('Error without Propagating')
    // it('Error with Propagating')
    // it('Error with Finnally Command')
    // it('Finally without Error')
    // it('Error with On Error Command')
    // it('Successful Command')
});

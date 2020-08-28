import { expect, test } from '@salesforce/command/lib/test';
import { ensureJsonMap, ensureString } from '@salesforce/ts-types';

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
    test
        .withOrg({ username: 'test@org.com' }, true)
        .withConnectionRequest(request => {
            const requestMap = ensureJsonMap(request);
            if (ensureString(requestMap.url).match(/Organization/)) {
                return Promise.resolve({ records: [{ Name: 'Super Awesome Org', TrialExpirationDate: '2018-03-20T23:24:11.000+0000' }] });
            }
            return Promise.resolve({ records: [] });
        })
        .stdout()
        .command(['hello:org', '--targetusername', 'test@org.com'])
        .it('runs hello:org --targetusername test@org.com', ctx => {
            expect(ctx.stdout).to.contain('Hello world! This is org: Super Awesome Org and I will be around until Tue Mar 20 2018!');
        });
});

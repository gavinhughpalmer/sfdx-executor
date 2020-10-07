import { expect } from 'chai';
import { replaceAll } from '../../src/main/utilities';

describe('Replace All', () => {
    it('should combine all values of a string', () => {
        expect(replaceAll('Hello World!', 'World', 'All')).to.equal('Hello All!');
    });
    it('should return null on null value', () => {
        expect(replaceAll(null, 'World', 'All')).to.equal(null);
    });
    it('should do nothing on null term', () => {
        expect(replaceAll('Hello World!', null, 'All')).to.equal('Hello World!');
    });
    it('should clear on null replacement', () => {
        expect(replaceAll('Hello World!', 'World', null)).to.equal('Hello !');
    });
});
'use strict';

const { expect } = require('chai');
const SharedReader = require('../routes/util/ReaderUtil.js');


describe('ReaderUtil', () => {
    describe('#padWithZeros', () => {
        it('should add a leading zero if the given number is < 10', () => {
            expect(SharedReader.padWithZeros(9)).to.equal('09');
            expect(SharedReader.padWithZeros(1)).to.equal('01');
            expect(SharedReader.padWithZeros(0)).to.equal('00');
        });

        it('should not add a leading 0 for numbers >= 10', () => {
            expect(SharedReader.padWithZeros(10)).to.equal('10');
            expect(SharedReader.padWithZeros(33)).to.equal('33');
            expect(SharedReader.padWithZeros(99)).to.equal('99');
        });

        it('should not pad negatives', () => {
            expect(SharedReader.padWithZeros(-1)).to.equal('-1');
            expect(SharedReader.padWithZeros(-10)).to.equal('-10');
        });
    });
});

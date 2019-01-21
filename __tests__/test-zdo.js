/**
 *
 * test-zdo.js - Test code for testing the ZDO code.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

const zdo = require('../zdo');

describe('IEEE Address Response', () => {
  it('Short frame', () => {
    const frame = {
      clusterId: zdo.CLUSTER_ID.IEEE_ADDRESS_RESPONSE,
      data: Buffer.from([0x55, 0x00, 0x88, 0x77, 0x66, 0x55,
                         0x44, 0x33, 0x22, 0x11, 0xaa, 0x99]),
    };
    const expectedFrame = Object.assign(frame, {
      zdoSeq: 0x55,
      status: 0,
      nwkAddr64: '1122334455667788',
      nwkAddr16: '99aa',
      numAssocDev: 0,
      startIndex: 0,
      assocAddr16: [],
    });
    zdo.parseZdoFrame(frame);
    expect(frame).toEqual(expectedFrame);
    zdo.dumpZdoFrame('Test', frame);
  });
  it('Frame with no assoc Addrs', () => {
    const frame = {
      clusterId: zdo.CLUSTER_ID.IEEE_ADDRESS_RESPONSE,
      data: Buffer.from([0x55, 0x00, 0x88, 0x77, 0x66, 0x55,
                         0x44, 0x33, 0x22, 0x11, 0xaa, 0x99,
                         0x00, 0x00]),
    };
    const expectedFrame = Object.assign(frame, {
      zdoSeq: 0x55,
      status: 0,
      nwkAddr64: '1122334455667788',
      nwkAddr16: '99aa',
      numAssocDev: 0,
      startIndex: 0,
      assocAddr16: [],
    });
    zdo.parseZdoFrame(frame);
    expect(frame).toEqual(expectedFrame);
    zdo.dumpZdoFrame('Test', frame);
  });
  it('Frame with an assoc Addr', () => {
    const frame = {
      clusterId: zdo.CLUSTER_ID.IEEE_ADDRESS_RESPONSE,
      data: Buffer.from([0x55, 0x00, 0x88, 0x77, 0x66, 0x55,
                         0x44, 0x33, 0x22, 0x11, 0xaa, 0x99,
                         0x01, 0x00, 0x22, 0x11]),
    };
    const expectedFrame = Object.assign(frame, {
      zdoSeq: 0x55,
      status: 0,
      nwkAddr64: '1122334455667788',
      nwkAddr16: '99aa',
      numAssocDev: 1,
      startIndex: 0,
      assocAddr16: ['1122'],
    });
    zdo.parseZdoFrame(frame);
    expect(frame).toEqual(expectedFrame);
    zdo.dumpZdoFrame('Test', frame);
  });
});

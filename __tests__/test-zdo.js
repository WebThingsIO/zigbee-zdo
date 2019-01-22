/**
 *
 * test-zdo.js - Test code for testing the ZDO code.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */
const zclId = require('zcl-id');
const zdo = require('../zdo');

const zci = zdo.CLUSTER_ID;

function nextFrameId() {
  return 0xdd;
}

const defaultFrame = {
  destination64: '0123456789abcdef',
  destination16: '4321',
  zdoSeq: 0xee,
};

const zdoObj = new zdo.ZdoApi(nextFrameId, 0xff);

function dumpFrame(label, frame) {
  if (frame.hasOwnProperty('status')) {
    const status = frameStatus(frame);
    console.log(label, frame.destination64,
                'ZDO',
                zdo.getClusterIdAsString(frame.clusterId),
                zdo.getClusterIdDescription(frame.clusterId),
                'status:', status.key, `(${status.value})`);
  } else {
    console.log(label, frame.destination64,
                'ZDO',
                zdo.getClusterIdAsString(frame.clusterId),
                zdo.getClusterIdDescription(frame.clusterId));
  }
  zdo.dumpZdoFrame(`${label}  `, frame);
}

function frameStatus(frame) {
  if (frame.hasOwnProperty('status')) {
    const status = zclId.status(frame.status);
    if (status) {
      return status;
    }
    // Something that zclId doesn't know about.
    return {
      key: 'unknown',
      value: frame.status,
    };
  }

  // Frames sent from the device not in response to an ExplicitTx
  // (like "End Device Announcement") won't have a status.
  return {
    key: 'none',
    // eslint-disable-next-line no-undefined
    value: undefined,
  };
}

describe(zci[zci.NETWORK_ADDRESS_REQUEST], () => {
  it('Build Frame', () => {
    const frame = Object.assign({
      clusterId: zci.NETWORK_ADDRESS_REQUEST,
      addr64: '1122334455667788',
      requestType: 0,
      startIndex: 0,
    }, defaultFrame);
    zdoObj.makeFrame(frame);
    const expectedData = Buffer.from([
      0xee, 0x88, 0x77, 0x66, 0x55, 0x44, 0x33, 0x22, 0x11, 0x00, 0x00,
    ]);
    expect(frame.data).toEqual(expectedData);
    dumpFrame('Req', frame);
  });
  it('Parse frame', () => {
    const frame = Object.assign({
      clusterId: zci.NETWORK_ADDRESS_REQUEST,
      data: Buffer.from([
        0xee, 0x88, 0x77, 0x66, 0x55, 0x44, 0x33, 0x22, 0x11, 0x00, 0x00,
      ]),
    }, defaultFrame);
    const expectedFrame = Object.assign({
      zdoSeq: frame.zdoSeq,
      addr64: '1122334455667788',
      requestType: 0,
      startIndex: 0,
    }, frame);
    zdo.parseZdoFrame(frame);
    expect(frame).toEqual(expectedFrame);
    dumpFrame('Resp', frame);
  });
});

describe(zci[zci.NETWORK_ADDRESS_RESPONSE], () => {
  it('Short frame', () => {
    const frame = Object.assign({
      clusterId: zci.NETWORK_ADDRESS_RESPONSE,
      data: Buffer.from([0xee, 0x00, 0x88, 0x77, 0x66, 0x55,
                         0x44, 0x33, 0x22, 0x11, 0xaa, 0x99]),
    }, defaultFrame);
    const expectedFrame = Object.assign({
      zdoSeq: frame.zdoSeq,
      status: 0,
      nwkAddr64: '1122334455667788',
      nwkAddr16: '99aa',
      numAssocDev: 0,
      startIndex: 0,
      assocAddr16: [],
    }, frame);
    zdo.parseZdoFrame(frame);
    expect(frame).toEqual(expectedFrame);
    dumpFrame('Resp', frame);
  });
  it('Frame with no assoc Addrs', () => {
    const frame = Object.assign({
      clusterId: zdo.CLUSTER_ID.NETWORK_ADDRESS_RESPONSE,
      data: Buffer.from([0xee, 0x00, 0x88, 0x77, 0x66, 0x55,
                         0x44, 0x33, 0x22, 0x11, 0xaa, 0x99,
                         0x00, 0x00]),
    }, defaultFrame);
    const expectedFrame = Object.assign({
      zdoSeq: frame.zdoSeq,
      status: 0,
      nwkAddr64: '1122334455667788',
      nwkAddr16: '99aa',
      numAssocDev: 0,
      startIndex: 0,
      assocAddr16: [],
    }, frame);
    zdo.parseZdoFrame(frame);
    expect(frame).toEqual(expectedFrame);
    dumpFrame('Resp', frame);
  });
  it('Frame with an assoc Addr', () => {
    const frame = Object.assign({
      clusterId: zdo.CLUSTER_ID.NETWORK_ADDRESS_RESPONSE,
      data: Buffer.from([0xee, 0x00, 0x88, 0x77, 0x66, 0x55,
                         0x44, 0x33, 0x22, 0x11, 0xaa, 0x99,
                         0x01, 0x00, 0x22, 0x11]),
    }, defaultFrame);
    const expectedFrame = Object.assign({
      zdoSeq: frame.zdoSeq,
      status: 0,
      nwkAddr64: '1122334455667788',
      nwkAddr16: '99aa',
      numAssocDev: 1,
      startIndex: 0,
      assocAddr16: ['1122'],
    }, frame);
    zdo.parseZdoFrame(frame);
    expect(frame).toEqual(expectedFrame);
    dumpFrame('Resp', frame);
  });
});

describe(zci[zci.IEEE_ADDRESS_REQUEST], () => {
  it('Request Frame', () => {
    const frame = Object.assign({
      clusterId: zci.IEEE_ADDRESS_REQUEST,
      addr16: '1122',
      requestType: 0,
      startIndex: 0,
    }, defaultFrame);
    zdoObj.makeFrame(frame);
    const expectedData = Buffer.from([
      0xee, 0x22, 0x11, 0x00, 0x00,
    ]);
    expect(frame.data).toEqual(expectedData);
    dumpFrame('Req', frame);
  });
  it('Parse frame', () => {
    const frame = Object.assign({
      clusterId: zci.IEEE_ADDRESS_REQUEST,
      data: Buffer.from([
        0xee, 0x22, 0x11, 0x00, 0x00,
      ]),
    }, defaultFrame);
    const expectedFrame = Object.assign({
      zdoSeq: frame.zdoSeq,
      addr16: '1122',
      requestType: 0,
      startIndex: 0,
    }, frame);
    zdo.parseZdoFrame(frame);
    expect(frame).toEqual(expectedFrame);
    dumpFrame('Resp', frame);
  });
});

describe(zci[zci.IEEE_ADDRESS_RESPONSE], () => {
  it('Short frame', () => {
    const frame = Object.assign({
      clusterId: zci.IEEE_ADDRESS_RESPONSE,
      data: Buffer.from([0xee, 0x00, 0x88, 0x77, 0x66, 0x55,
                         0x44, 0x33, 0x22, 0x11, 0xaa, 0x99]),
    }, defaultFrame);
    const expectedFrame = Object.assign({
      zdoSeq: frame.zdoSeq,
      status: 0,
      nwkAddr64: '1122334455667788',
      nwkAddr16: '99aa',
      numAssocDev: 0,
      startIndex: 0,
      assocAddr16: [],
    }, frame);
    zdo.parseZdoFrame(frame);
    expect(frame).toEqual(expectedFrame);
    dumpFrame('Resp', frame);
  });
  it('Frame with no assoc Addrs', () => {
    const frame = Object.assign({
      clusterId: zdo.CLUSTER_ID.IEEE_ADDRESS_RESPONSE,
      data: Buffer.from([0xee, 0x00, 0x88, 0x77, 0x66, 0x55,
                         0x44, 0x33, 0x22, 0x11, 0xaa, 0x99,
                         0x00, 0x00]),
    }, defaultFrame);
    const expectedFrame = Object.assign({
      zdoSeq: frame.zdoSeq,
      status: 0,
      nwkAddr64: '1122334455667788',
      nwkAddr16: '99aa',
      numAssocDev: 0,
      startIndex: 0,
      assocAddr16: [],
    }, frame);
    zdo.parseZdoFrame(frame);
    expect(frame).toEqual(expectedFrame);
    dumpFrame('Resp', frame);
  });
  it('1 assoc Addr', () => {
    const frame = Object.assign({
      clusterId: zdo.CLUSTER_ID.IEEE_ADDRESS_RESPONSE,
      data: Buffer.from([0xee, 0x00, 0x88, 0x77, 0x66, 0x55,
                         0x44, 0x33, 0x22, 0x11, 0xaa, 0x99,
                         0x01, 0x00, 0x22, 0x11]),
    }, defaultFrame);
    const expectedFrame = Object.assign({
      zdoSeq: frame.zdoSeq,
      status: 0,
      nwkAddr64: '1122334455667788',
      nwkAddr16: '99aa',
      numAssocDev: 1,
      startIndex: 0,
      assocAddr16: ['1122'],
    }, frame);
    zdo.parseZdoFrame(frame);
    expect(frame).toEqual(expectedFrame);
    dumpFrame('Resp', frame);
  });
  it('2 assoc Addr', () => {
    const frame = Object.assign({
      clusterId: zdo.CLUSTER_ID.IEEE_ADDRESS_RESPONSE,
      data: Buffer.from([0xee, 0x00, 0x88, 0x77, 0x66, 0x55,
                         0x44, 0x33, 0x22, 0x11, 0xaa, 0x99,
                         0x02, 0x00, 0x22, 0x11, 0x44, 0x33]),
    }, defaultFrame);
    const expectedFrame = Object.assign({
      zdoSeq: frame.zdoSeq,
      status: 0,
      nwkAddr64: '1122334455667788',
      nwkAddr16: '99aa',
      numAssocDev: 2,
      startIndex: 0,
      assocAddr16: ['1122', '3344'],
    }, frame);
    zdo.parseZdoFrame(frame);
    expect(frame).toEqual(expectedFrame);
    dumpFrame('Resp', frame);
  });
});

describe(zci[zci.NODE_DESCRIPTOR_REQUEST], () => {
  it('Request Frame', () => {
    const frame = Object.assign({
      clusterId: zci.NODE_DESCRIPTOR_REQUEST,
    }, defaultFrame);
    zdoObj.makeFrame(frame);
    const expectedData = Buffer.from([
      0xee, 0x21, 0x43,
    ]);
    expect(frame.data).toEqual(expectedData);
    dumpFrame('Req', frame);
  });
});

describe(zci[zci.NODE_DESCRIPTOR_RESPONSE], () => {
  it('Short frame', () => {
    const frame = Object.assign({
      clusterId: zci.NODE_DESCRIPTOR_RESPONSE,
      data: Buffer.from([
        0xee, 0x00,
        0xaa, 0x99,
        0x00, 0x00, 0x00,
      ]),
    }, defaultFrame);
    const expectedFrame = Object.assign({
      zdoSeq: frame.zdoSeq,
      status: 0,
      zdoAddr16: '99aa',
      logicalType: 0,
      complexDescriptorAvailable: 0,
      userDescriptorAvailable: 0,
      frequencyBand: 0,
      macCapabilityFlags: 0,
    }, frame);
    zdo.parseZdoFrame(frame);
    expect(frame).toEqual(expectedFrame);
    dumpFrame('Resp', frame);
  });
  it('Normal frame', () => {
    const frame = Object.assign({
      clusterId: zci.NODE_DESCRIPTOR_RESPONSE,
      data: Buffer.from([
        0xee, 0x00,
        0xaa, 0x99,
        0x00, 0x00, 0x00,
        0x33, 0x44, 0x80, 0x81, 0x00, 0x55, 0xaa, 0x83, 0x00, 0x00,
      ]),
    }, defaultFrame);
    const expectedFrame = Object.assign({
      zdoSeq: frame.zdoSeq,
      status: 0,
      zdoAddr16: '99aa',
      logicalType: 0,
      complexDescriptorAvailable: 0,
      userDescriptorAvailable: 0,
      frequencyBand: 0,
      macCapabilityFlags: 0,
      manufacturerCode: '4433',
      maxBufferSize: 0x80,
      maxIncomingXferSize: 0x81,
      serverMask: 0xaa55,
      maxOutgoingXferSize: 0x83,
      descriptorCapabilities: 0,
    }, frame);
    zdo.parseZdoFrame(frame);
    expect(frame).toEqual(expectedFrame);
    dumpFrame('Resp', frame);
  });
});

describe(zci[zci.SIMPLE_DESCRIPTOR_REQUEST], () => {
  it('Build Frame', () => {
    const frame = Object.assign({
      clusterId: zci.SIMPLE_DESCRIPTOR_REQUEST,
      endpoint: 0x33,
    }, defaultFrame);
    zdoObj.makeFrame(frame);
    const expectedData = Buffer.from([
      0xee, 0x21, 0x43, 0x33,
    ]);
    expect(frame.data).toEqual(expectedData);
    dumpFrame('Req', frame);
  });
  it('Parse frame', () => {
    const frame = Object.assign({
      clusterId: zci.SIMPLE_DESCRIPTOR_REQUEST,
      data: Buffer.from([0xee, 0x21, 0x43, 0x33]),
    }, defaultFrame);
    const expectedFrame = Object.assign({
      zdoSeq: frame.zdoSeq,
      endpoint: 0x33,
    }, frame);
    zdo.parseZdoFrame(frame);
    expect(frame).toEqual(expectedFrame);
    dumpFrame('Req', frame);
  });
});

describe(zci[zci.SIMPLE_DESCRIPTOR_RESPONSE], () => {
  it('Short frame 1', () => {
    const frame = Object.assign({
      clusterId: zci.SIMPLE_DESCRIPTOR_RESPONSE,
      data: Buffer.from([
        0xee, 0x00,
        0xaa, 0x99,
      ]),
    }, defaultFrame);
    const expectedFrame = Object.assign({
      zdoSeq: frame.zdoSeq,
      status: 0,
      zdoAddr16: '99aa',
      inputClusters: [],
      outputClusters: [],
    }, frame);
    zdo.parseZdoFrame(frame);
    expect(frame).toEqual(expectedFrame);
    dumpFrame('Resp', frame);
  });
  it('Short frame 2', () => {
    const frame = Object.assign({
      clusterId: zci.SIMPLE_DESCRIPTOR_RESPONSE,
      data: Buffer.from([
        0xee, 0x00,
        0xaa, 0x99,
        0x00,
      ]),
    }, defaultFrame);
    const expectedFrame = Object.assign({
      zdoSeq: frame.zdoSeq,
      status: 0,
      zdoAddr16: '99aa',
      simpleDescriptorLength: 0,
      inputClusters: [],
      outputClusters: [],
    }, frame);
    zdo.parseZdoFrame(frame);
    expect(frame).toEqual(expectedFrame);
    dumpFrame('Resp', frame);
  });
  it('Normal frame 0 in 0 out', () => {
    const frame = Object.assign({
      clusterId: zci.SIMPLE_DESCRIPTOR_RESPONSE,
      data: Buffer.from([
        0xee, 0x00,
        0xaa, 0x99,
        0x01,
        0x11,
        0x01, 0x02, 0x03, 0x04, 0x02,
        0x00, 0x00,
      ]),
    }, defaultFrame);
    const expectedFrame = Object.assign({
      zdoSeq: frame.zdoSeq,
      status: 0,
      zdoAddr16: '99aa',
      inputClusters: [],
      outputClusters: [],
      simpleDescriptorLength: 1,
      endpoint: 0x11,
      appProfileId: '0201',
      appDeviceId: '0403',
      appDeviceVersion: 2,
      inputClusterCount: 0,
      outputClusterCount: 0,
    }, frame);
    zdo.parseZdoFrame(frame);
    expect(frame).toEqual(expectedFrame);
    dumpFrame('Resp', frame);
  });
  it('Normal frame 1 in 0 out', () => {
    const frame = Object.assign({
      clusterId: zci.SIMPLE_DESCRIPTOR_RESPONSE,
      data: Buffer.from([
        0xee, 0x00,
        0xaa, 0x99,
        0x01,
        0x11,
        0x01, 0x02, 0x03, 0x04, 0x02,
        0x01, 0x23, 0x00, 0x00,
      ]),
    }, defaultFrame);
    const expectedFrame = Object.assign({
      zdoSeq: frame.zdoSeq,
      status: 0,
      zdoAddr16: '99aa',
      inputClusters: ['0023'],
      outputClusters: [],
      simpleDescriptorLength: 1,
      endpoint: 0x11,
      appProfileId: '0201',
      appDeviceId: '0403',
      appDeviceVersion: 2,
      inputClusterCount: 1,
      outputClusterCount: 0,
    }, frame);
    zdo.parseZdoFrame(frame);
    expect(frame).toEqual(expectedFrame);
    dumpFrame('Resp', frame);
  });
  it('Normal frame 0 in 1 out', () => {
    const frame = Object.assign({
      clusterId: zci.SIMPLE_DESCRIPTOR_RESPONSE,
      data: Buffer.from([
        0xee, 0x00,
        0xaa, 0x99,
        0x01,
        0x11,
        0x01, 0x02, 0x03, 0x04, 0x02,
        0x00, 0x01, 0x23, 0x00,
      ]),
    }, defaultFrame);
    const expectedFrame = Object.assign({
      zdoSeq: frame.zdoSeq,
      status: 0,
      zdoAddr16: '99aa',
      inputClusters: [],
      outputClusters: ['0023'],
      simpleDescriptorLength: 1,
      endpoint: 0x11,
      appProfileId: '0201',
      appDeviceId: '0403',
      appDeviceVersion: 2,
      inputClusterCount: 0,
      outputClusterCount: 1,
    }, frame);
    zdo.parseZdoFrame(frame);
    expect(frame).toEqual(expectedFrame);
    dumpFrame('Resp', frame);
  });
  it('Normal frame 1 in 1 out (known clusters)', () => {
    const frame = Object.assign({
      clusterId: zci.SIMPLE_DESCRIPTOR_RESPONSE,
      data: Buffer.from([
        0xee, 0x00,
        0xaa, 0x99,
        0x01,
        0x11,
        0x01, 0x02, 0x03, 0x04, 0x02,
        0x01, 0x00, 0x00, 0x01, 0x00, 0x00,
      ]),
    }, defaultFrame);
    const expectedFrame = Object.assign({
      zdoSeq: frame.zdoSeq,
      status: 0,
      zdoAddr16: '99aa',
      inputClusters: ['0000'],
      outputClusters: ['0000'],
      simpleDescriptorLength: 1,
      endpoint: 0x11,
      appProfileId: '0201',
      appDeviceId: '0403',
      appDeviceVersion: 2,
      inputClusterCount: 1,
      outputClusterCount: 1,
    }, frame);
    zdo.parseZdoFrame(frame);
    expect(frame).toEqual(expectedFrame);
    dumpFrame('Resp', frame);
  });
  it('Normal frame 1 in 1 out (unknown clusters)', () => {
    const frame = Object.assign({
      clusterId: zci.SIMPLE_DESCRIPTOR_RESPONSE,
      data: Buffer.from([
        0xee, 0x00,
        0xaa, 0x99,
        0x01,
        0x11,
        0x01, 0x02, 0x03, 0x04, 0x02,
        0x01, 0x00, 0xFF, 0x01, 0x00, 0xEE,
      ]),
    }, defaultFrame);
    const expectedFrame = Object.assign({
      zdoSeq: frame.zdoSeq,
      status: 0,
      zdoAddr16: '99aa',
      inputClusters: ['ff00'],
      outputClusters: ['ee00'],
      simpleDescriptorLength: 1,
      endpoint: 0x11,
      appProfileId: '0201',
      appDeviceId: '0403',
      appDeviceVersion: 2,
      inputClusterCount: 1,
      outputClusterCount: 1,
    }, frame);
    zdo.parseZdoFrame(frame);
    expect(frame).toEqual(expectedFrame);
    dumpFrame('Resp', frame);
  });
});

describe(zci[zci.ACTIVE_ENDPOINTS_REQUEST], () => {
  it('Build Frame', () => {
    const frame = Object.assign({
      clusterId: zci.ACTIVE_ENDPOINTS_REQUEST,
    }, defaultFrame);
    zdoObj.makeFrame(frame);
    const expectedData = Buffer.from([
      0xee, 0x21, 0x43,
    ]);
    expect(frame.data).toEqual(expectedData);
    dumpFrame('Req', frame);
  });
  it('Parse frame', () => {
    const frame = Object.assign({
      clusterId: zci.ACTIVE_ENDPOINTS_REQUEST,
      data: Buffer.from([
        0xee, 0x21, 0x43,
      ]),
    }, defaultFrame);
    const expectedFrame = Object.assign({
      zdoSeq: frame.zdoSeq,
    }, frame);
    zdo.parseZdoFrame(frame);
    expect(frame).toEqual(expectedFrame);
    dumpFrame('Parse Req', frame);
  });
});

describe(zci[zci.ACTIVE_ENDPOINTS_RESPONSE], () => {
  it('Short frame', () => {
    const frame = Object.assign({
      clusterId: zci.ACTIVE_ENDPOINTS_RESPONSE,
      data: Buffer.from([0xee, 0x00, 0x22, 0x11]),
    }, defaultFrame);
    const expectedFrame = Object.assign({
      zdoSeq: frame.zdoSeq,
      status: 0,
      zdoAddr16: '1122',
      numActiveEndpoints: 0,
      activeEndpoints: [],
    }, frame);
    zdo.parseZdoFrame(frame);
    expect(frame).toEqual(expectedFrame);
    dumpFrame('Resp', frame);
  });
  it('0 active endpoints', () => {
    const frame = Object.assign({
      clusterId: zci.ACTIVE_ENDPOINTS_RESPONSE,
      data: Buffer.from([0xee, 0x00, 0x22, 0x11, 0x00]),
    }, defaultFrame);
    const expectedFrame = Object.assign({
      zdoSeq: frame.zdoSeq,
      status: 0,
      zdoAddr16: '1122',
      numActiveEndpoints: 0,
      activeEndpoints: [],
    }, frame);
    zdo.parseZdoFrame(frame);
    expect(frame).toEqual(expectedFrame);
    dumpFrame('Resp', frame);
  });
  it('1 active endpoints', () => {
    const frame = Object.assign({
      clusterId: zci.ACTIVE_ENDPOINTS_RESPONSE,
      data: Buffer.from([0xee, 0x00, 0x22, 0x11, 0x01, 0x33]),
    }, defaultFrame);
    const expectedFrame = Object.assign({
      zdoSeq: frame.zdoSeq,
      status: 0,
      zdoAddr16: '1122',
      numActiveEndpoints: 1,
      activeEndpoints: [51],
    }, frame);
    zdo.parseZdoFrame(frame);
    expect(frame).toEqual(expectedFrame);
    dumpFrame('Resp', frame);
  });
});

describe(zci[zci.MATCH_DESCRIPTOR_REQUEST], () => {
  it('0 In 0 Out', () => {
    const frame = Object.assign({
      clusterId: zci.MATCH_DESCRIPTOR_REQUEST,
      data: Buffer.from([
        0xee,
        0x22, 0x11,
        0x04, 0x01,
        0x00, 0x00,
      ]),
    }, defaultFrame);
    const expectedFrame = Object.assign({
      zdoSeq: frame.zdoSeq,
      zdoAddr16: '1122',
      matchProfileId: '0104',
      inputClusterCount: 0,
      inputClusters: [],
      outputClusterCount: 0,
      outputClusters: [],
    }, frame);
    zdo.parseZdoFrame(frame);
    expect(frame).toEqual(expectedFrame);
    dumpFrame('Resp', frame);
  });
  it('1 In 0 Out', () => {
    const frame = Object.assign({
      clusterId: zci.MATCH_DESCRIPTOR_REQUEST,
      data: Buffer.from([
        0xee,
        0x22, 0x11,
        0x04, 0x01,
        0x01, 0x06, 0x00, 0x00,
      ]),
    }, defaultFrame);
    const expectedFrame = Object.assign({
      zdoSeq: frame.zdoSeq,
      zdoAddr16: '1122',
      matchProfileId: '0104',
      inputClusterCount: 1,
      inputClusters: ['0006'],
      outputClusterCount: 0,
      outputClusters: [],
    }, frame);
    zdo.parseZdoFrame(frame);
    expect(frame).toEqual(expectedFrame);
    dumpFrame('Resp', frame);
  });
  it('0 In 1 Out', () => {
    const frame = Object.assign({
      clusterId: zci.MATCH_DESCRIPTOR_REQUEST,
      data: Buffer.from([
        0xee,
        0x22, 0x11,
        0x04, 0x01,
        0x00, 0x01, 0x06, 0x00,
      ]),
    }, defaultFrame);
    const expectedFrame = Object.assign({
      zdoSeq: frame.zdoSeq,
      zdoAddr16: '1122',
      matchProfileId: '0104',
      inputClusterCount: 0,
      inputClusters: [],
      outputClusterCount: 1,
      outputClusters: ['0006'],
    }, frame);
    zdo.parseZdoFrame(frame);
    expect(frame).toEqual(expectedFrame);
    dumpFrame('Resp', frame);
  });
  it('1 In 1 Out - unknown cluster', () => {
    const frame = Object.assign({
      clusterId: zci.MATCH_DESCRIPTOR_REQUEST,
      data: Buffer.from([
        0xee,
        0x22, 0x11,
        0x04, 0x01,
        0x01, 0xdd, 0xcc, 0x01, 0xee, 0xdd,
      ]),
    }, defaultFrame);
    const expectedFrame = Object.assign({
      zdoSeq: frame.zdoSeq,
      zdoAddr16: '1122',
      matchProfileId: '0104',
      inputClusterCount: 1,
      inputClusters: ['ccdd'],
      outputClusterCount: 1,
      outputClusters: ['ddee'],
    }, frame);
    zdo.parseZdoFrame(frame);
    expect(frame).toEqual(expectedFrame);
    dumpFrame('Resp', frame);
  });
  it('1 In 1 Out - known cluster', () => {
    const frame = Object.assign({
      clusterId: zci.MATCH_DESCRIPTOR_REQUEST,
      data: Buffer.from([
        0xee,
        0x22, 0x11,
        0x04, 0x01,
        0x01, 0x00, 0x00, 0x01, 0x00, 0x00,
      ]),
    }, defaultFrame);
    const expectedFrame = Object.assign({
      zdoSeq: frame.zdoSeq,
      zdoAddr16: '1122',
      matchProfileId: '0104',
      inputClusterCount: 1,
      inputClusters: ['0000'],
      outputClusterCount: 1,
      outputClusters: ['0000'],
    }, frame);
    zdo.parseZdoFrame(frame);
    expect(frame).toEqual(expectedFrame);
    dumpFrame('Resp', frame);
  });
});

describe(zci[zci.MATCH_DESCRIPTOR_RESPONSE], () => {
  it('Build Frame', () => {
    const frame = Object.assign({
      clusterId: zci.MATCH_DESCRIPTOR_RESPONSE,
      status: 0,
      zdoAddr16: '3344',
      endpoints: [4, 5],
    }, defaultFrame);
    zdoObj.makeFrame(frame);
    const expectedData = Buffer.from([
      0xee, 0x00, 0x44, 0x33, 0x02, 0x04, 0x05,
    ]);
    expect(frame.data).toEqual(expectedData);
    dumpFrame('Req', frame);
  });
  it('Parse frame', () => {
    const frame = Object.assign({
      clusterId: zci.MATCH_DESCRIPTOR_RESPONSE,
      data: Buffer.from([
        0xee, 0x00, 0x44, 0x33, 0x02, 0x04, 0x05,
      ]),
    }, defaultFrame);
    const expectedFrame = Object.assign({
      zdoSeq: frame.zdoSeq,
      status: 0,
      zdoAddr16: '3344',
      endpoints: [4, 5],
    }, frame);
    zdo.parseZdoFrame(frame);
    expect(frame).toEqual(expectedFrame);
    dumpFrame('Resp', frame);
  });
});

describe(zci[zci.END_DEVICE_ANNOUNCEMENT], () => {
  it('Parse frame', () => {
    const frame = Object.assign({
      clusterId: zci.END_DEVICE_ANNOUNCEMENT,
      data: Buffer.from([
        0xee,
        0x22, 0x11,
        0xef, 0xcd, 0xab, 0x90, 0x78, 0x56, 0x34, 0x12,
        0x00,
      ]),
    }, defaultFrame);
    const expectedFrame = Object.assign({
      zdoSeq: frame.zdoSeq,
      zdoAddr16: '1122',
      zdoAddr64: '1234567890abcdef',
      capability: 0,
      alternatePanCoordinator: 0,
      fullFunctionDevice: 0,
      acPower: 0,
      rxOnWhenIdle: 0,
      securityCapability: 0,
      allocShortAddress: 0,
    }, frame);
    zdo.parseZdoFrame(frame);
    expect(frame).toEqual(expectedFrame);
    dumpFrame('Resp', frame);
  });
});

describe(zci[zci.BIND_REQUEST], () => {
  it('Cluster ID as number', () => {
    const frame = Object.assign({
      clusterId: zci.BIND_REQUEST,
      bindSrcAddr64: '8877665544332211',
      bindSrcEndpoint: 0xee,
      bindClusterId: 15,
      bindDstAddrMode: 1,
      bindDstAddr16: '2233',
    }, defaultFrame);
    zdoObj.makeFrame(frame);
    const expectedData = Buffer.from([
      0xee, 0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88, 0xee,
      0x0f, 0x00, 0x01, 0x33, 0x22,
    ]);
    expect(frame.data).toEqual(expectedData);
    dumpFrame('Req', frame);
  });
  it('Cluster ID as string', () => {
    const frame = Object.assign({
      clusterId: zci.BIND_REQUEST,
      bindSrcAddr64: '8877665544332211',
      bindSrcEndpoint: 0xee,
      bindClusterId: '000f',
      bindDstAddrMode: 1,
      bindDstAddr16: '2233',
    }, defaultFrame);
    zdoObj.makeFrame(frame);
    const expectedData = Buffer.from([
      0xee, 0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88, 0xee,
      0x0f, 0x00, 0x01, 0x33, 0x22,
    ]);
    expect(frame.data).toEqual(expectedData);
    dumpFrame('Req', frame);
  });
  it('Addr Mode 3', () => {
    const frame = Object.assign({
      clusterId: zci.BIND_REQUEST,
      bindSrcAddr64: '8877665544332211',
      bindSrcEndpoint: 0xee,
      bindClusterId: '000f',
      bindDstAddrMode: 3,
      bindDstAddr64: '2233445566778899',
      bindDstEndpoint: 0xdd,
    }, defaultFrame);
    zdoObj.makeFrame(frame);
    const expectedData = Buffer.from([
      0xee, 0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88, 0xee,
      0x0f, 0x00, 0x03, 0x99, 0x88, 0x77, 0x66, 0x55, 0x44, 0x33,
      0x22, 0xdd,
    ]);
    expect(frame.data).toEqual(expectedData);
    dumpFrame('Req', frame);
  });
  it('missing bindDstAddr16', () => {
    const frame = Object.assign({
      clusterId: zci.BIND_REQUEST,
      bindSrcAddr64: '8877665544332211',
      bindSrcEndpoint: 0xee,
      bindClusterId: '000f',
      bindDstAddrMode: 1,
    }, defaultFrame);
    expect(() => {
      zdoObj.makeFrame(frame);
    }).toThrow();
  });
  it('missing bindDstAddr64', () => {
    const frame = Object.assign({
      clusterId: zci.BIND_REQUEST,
      bindSrcAddr64: '8877665544332211',
      bindSrcEndpoint: 0xee,
      bindClusterId: '000f',
      bindDstAddrMode: 3,
    }, defaultFrame);
    expect(() => {
      zdoObj.makeFrame(frame);
    }).toThrow();
  });
  it('missing bindDstEndpoint', () => {
    const frame = Object.assign({
      clusterId: zci.BIND_REQUEST,
      bindSrcAddr64: '8877665544332211',
      bindSrcEndpoint: 0xee,
      bindClusterId: '000f',
      bindDstAddrMode: 3,
      bindDstAddr64: '2233445566778899',
    }, defaultFrame);
    expect(() => {
      zdoObj.makeFrame(frame);
    }).toThrow();
  });
  it('Invalid addr mode', () => {
    const frame = Object.assign({
      clusterId: zci.BIND_REQUEST,
      bindSrcAddr64: '8877665544332211',
      bindSrcEndpoint: 0xee,
      bindClusterId: '000f',
    }, defaultFrame);
    expect(() => {
      zdoObj.makeFrame(frame);
    }).toThrow();
  });
  it('Parse Addr Mode 1', () => {
    const frame = Object.assign({
      clusterId: zci.BIND_REQUEST,
      data: Buffer.from([
        0xee, 0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88, 0xee,
        0x0f, 0x00, 0x01, 0x33, 0x22,
      ]),
    }, defaultFrame);
    const expectedFrame = Object.assign({
      zdoSeq: frame.zdoSeq,
      bindSrcAddr64: '8877665544332211',
      bindSrcEndpoint: 0xee,
      bindClusterId: '000f',
      bindDstAddrMode: 1,
      bindDstAddr16: '2233',
    }, frame);
    zdo.parseZdoFrame(frame);
    expect(frame).toEqual(expectedFrame);
    dumpFrame('Resp', frame);
  });
  it('Parse Addr Mode 3', () => {
    const frame = Object.assign({
      clusterId: zci.BIND_REQUEST,
      data: Buffer.from([
        0xee, 0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88, 0xee,
        0x0f, 0x00, 0x03, 0x99, 0x88, 0x77, 0x66, 0x55, 0x44, 0x33,
        0x22, 0xdd,
      ]),
    }, defaultFrame);
    const expectedFrame = Object.assign({
      zdoSeq: frame.zdoSeq,
      bindSrcAddr64: '8877665544332211',
      bindSrcEndpoint: 0xee,
      bindClusterId: '000f',
      bindDstAddrMode: 3,
      bindDstAddr64: '2233445566778899',
      bindDstEndpoint: 0xdd,
    }, frame);
    zdo.parseZdoFrame(frame);
    expect(frame).toEqual(expectedFrame);
    dumpFrame('Resp', frame);
  });
  it('Parse Addr Mode 3 (unknown cluster)', () => {
    const frame = Object.assign({
      clusterId: zci.BIND_REQUEST,
      data: Buffer.from([
        0xee, 0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88, 0xee,
        0x00, 0xf0, 0x03, 0x99, 0x88, 0x77, 0x66, 0x55, 0x44, 0x33,
        0x22, 0xdd,
      ]),
    }, defaultFrame);
    const expectedFrame = Object.assign({
      zdoSeq: frame.zdoSeq,
      bindSrcAddr64: '8877665544332211',
      bindSrcEndpoint: 0xee,
      bindClusterId: 'f000',
      bindDstAddrMode: 3,
      bindDstAddr64: '2233445566778899',
      bindDstEndpoint: 0xdd,
    }, frame);
    zdo.parseZdoFrame(frame);
    expect(frame).toEqual(expectedFrame);
    dumpFrame('Resp', frame);
  });
  it('Parse Addr Mode 4 (invalid)', () => {
    const frame = Object.assign({
      clusterId: zci.BIND_REQUEST,
      data: Buffer.from([
        0xee, 0x11, 0x22, 0x33, 0x44, 0x55, 0x66, 0x77, 0x88, 0xee,
        0x0f, 0x00, 0x04,
      ]),
    }, defaultFrame);
    const expectedFrame = Object.assign({
      zdoSeq: frame.zdoSeq,
      bindSrcAddr64: '8877665544332211',
      bindSrcEndpoint: 0xee,
      bindClusterId: '000f',
      bindDstAddrMode: 4,
    }, frame);
    zdo.parseZdoFrame(frame);
    expect(frame).toEqual(expectedFrame);
    dumpFrame('Resp', frame);
  });
});

describe(zci[zci.BIND_RESPONSE], () => {
  it('Response frame', () => {
    const frame = Object.assign({
      clusterId: zci.BIND_RESPONSE,
      data: Buffer.from([0xee, 0x00]),
    }, defaultFrame);
    const expectedFrame = Object.assign({
      zdoSeq: frame.zdoSeq,
      status: 0,
    }, frame);
    zdo.parseZdoFrame(frame);
    expect(frame).toEqual(expectedFrame);
    dumpFrame('Resp', frame);
  });
});

describe(zci[zci.MANAGEMENT_LQI_REQUEST], () => {
  it('Build Frame', () => {
    const frame = Object.assign({
      clusterId: zci.MANAGEMENT_LQI_REQUEST,
      startIndex: 3,
    }, defaultFrame);
    zdoObj.makeFrame(frame);
    const expectedData = Buffer.from([
      0xee, 0x03,
    ]);
    expect(frame.data).toEqual(expectedData);
    dumpFrame('Req', frame);
  });
  it('Parse frame', () => {
    const frame = Object.assign({
      clusterId: zci.MANAGEMENT_LQI_REQUEST,
      data: Buffer.from([0xee, 0x03]),
    }, defaultFrame);
    const expectedFrame = Object.assign({
      zdoSeq: frame.zdoSeq,
      startIndex: 3,
    }, frame);
    zdo.parseZdoFrame(frame);
    expect(frame).toEqual(expectedFrame);
    dumpFrame('Resp', frame);
  });
});

describe(zci[zci.MANAGEMENT_LQI_RESPONSE], () => {
  it('0 entries', () => {
    const frame = Object.assign({
      clusterId: zci.MANAGEMENT_LQI_RESPONSE,
      data: Buffer.from([0xee, 0x00, 0x00, 0x00, 0x00]),
    }, defaultFrame);
    const expectedFrame = Object.assign({
      zdoSeq: frame.zdoSeq,
      status: 0,
      numEntries: 0,
      startIndex: 0,
      numEntriesThisResponse: 0,
      neighbors: [],
    }, frame);
    zdo.parseZdoFrame(frame);
    expect(frame).toEqual(expectedFrame);
    dumpFrame('Resp', frame);
  });
  it('1 entry', () => {
    const frame = Object.assign({
      clusterId: zci.MANAGEMENT_LQI_RESPONSE,
      data: Buffer.from([
        0xee, 0x00, 0x01, 0x00, 0x01,
        0x21, 0x43, 0x65, 0x87, 0x09, 0xba, 0xdc, 0xfe,
        0xef, 0xcd, 0xab, 0x89, 0x67, 0x45, 0x23, 0x01,
        0x56, 0x34,
        0x00, 0x00, 0x00, 0xc0,
      ]),
    }, defaultFrame);
    const expectedFrame = Object.assign({
      zdoSeq: frame.zdoSeq,
      status: 0,
      numEntries: 1,
      startIndex: 0,
      numEntriesThisResponse: 1,
      neighbors: [{
        panId: 'fedcba0987654321',
        addr64: '0123456789abcdef',
        addr16: '3456',
        deviceType: 0,
        rxOnWhenIdle: 0,
        relationship: 0,
        permitJoining: 0,
        depth: 0,
        lqi: 0xc0,
      }],
    }, frame);
    zdo.parseZdoFrame(frame);
    expect(frame).toEqual(expectedFrame);
    dumpFrame('Resp', frame);
  });
});

describe(zci[zci.MANAGEMENT_RTG_REQUEST], () => {
  it('Request Frame', () => {
    const frame = Object.assign({
      clusterId: zci.MANAGEMENT_RTG_REQUEST,
      startIndex: 3,
    }, defaultFrame);
    zdoObj.makeFrame(frame);
    const expectedData = Buffer.from([
      0xee, 0x03,
    ]);
    expect(frame.data).toEqual(expectedData);
    dumpFrame('Req', frame);
  });
});

describe(zci[zci.MANAGEMENT_RTG_RESPONSE], () => {
  it('0 entries', () => {
    const frame = Object.assign({
      clusterId: zci.MANAGEMENT_RTG_RESPONSE,
      data: Buffer.from([0xee, 0x00, 0x00, 0x00, 0x00]),
    }, defaultFrame);
    const expectedFrame = Object.assign({
      zdoSeq: frame.zdoSeq,
      status: 0,
      numEntries: 0,
      startIndex: 0,
      numEntriesThisResponse: 0,
      routings: [],
    }, frame);
    zdo.parseZdoFrame(frame);
    expect(frame).toEqual(expectedFrame);
    dumpFrame('Resp', frame);
  });
  it('1 entries', () => {
    const frame = Object.assign({
      clusterId: zci.MANAGEMENT_RTG_RESPONSE,
      data: Buffer.from([
        0xee, 0x00, 0x01, 0x00, 0x01,
        0x34, 0x12,
        0x00,
        0x67, 0x45,
      ]),
    }, defaultFrame);
    const expectedFrame = Object.assign({
      zdoSeq: frame.zdoSeq,
      status: 0,
      numEntries: 1,
      startIndex: 0,
      numEntriesThisResponse: 1,
      routings: [{
        addr16: '1234',
        status: 0,
        memoryConstrained: 0,
        manyToOne: 0,
        routeRecordRequired: 0,
        nextHopAddr16: '4567',
      }],
    }, frame);
    zdo.parseZdoFrame(frame);
    expect(frame).toEqual(expectedFrame);
    dumpFrame('Resp', frame);
  });
});

describe(zci[zci.MANAGEMENT_BIND_REQUEST], () => {
  it('Request Frame', () => {
    const frame = Object.assign({
      clusterId: zci.MANAGEMENT_BIND_REQUEST,
      startIndex: 3,
    }, defaultFrame);
    zdoObj.makeFrame(frame);
    const expectedData = Buffer.from([
      0xee, 0x03,
    ]);
    expect(frame.data).toEqual(expectedData);
    dumpFrame('Req', frame);
  });
  it('Parse frame', () => {
    const frame = Object.assign({
      clusterId: zci.MANAGEMENT_BIND_REQUEST,
      data: Buffer.from([
        0xee, 0x03,
      ]),
    }, defaultFrame);
    const expectedFrame = Object.assign({
      zdoSeq: frame.zdoSeq,
      startIndex: 3,
    }, frame);
    zdo.parseZdoFrame(frame);
    expect(frame).toEqual(expectedFrame);
    dumpFrame('Resp', frame);
  });
});

describe(zci[zci.MANAGEMENT_BIND_RESPONSE], () => {
  it('0 bind entries', () => {
    const frame = Object.assign({
      clusterId: zci.MANAGEMENT_BIND_RESPONSE,
      data: Buffer.from([0xee, 0x00, 0x00, 0x00, 0x00]),
    }, defaultFrame);
    const expectedFrame = Object.assign({
      zdoSeq: frame.zdoSeq,
      status: 0,
      numEntries: 0,
      startIndex: 0,
      numEntriesThisResponse: 0,
      bindings: [],
    }, frame);
    zdo.parseZdoFrame(frame);
    expect(frame).toEqual(expectedFrame);
    dumpFrame('Resp', frame);
  });
  it('1 16-bit bind entry', () => {
    const frame = Object.assign({
      clusterId: zci.MANAGEMENT_BIND_RESPONSE,
      data: Buffer.from([
        0xee, 0x00, 0x01, 0x00, 0x01,
        0x88, 0x77, 0x66, 0x55, 0x44, 0x33, 0x22, 0x11,
        0x12, 0x0f, 0x00, 0x01, 0x34, 0x12,
      ]),
    }, defaultFrame);
    const expectedFrame = Object.assign({
      zdoSeq: frame.zdoSeq,
      status: 0,
      numEntries: 1,
      startIndex: 0,
      numEntriesThisResponse: 1,
      bindings: [{
        srcAddr64: '1122334455667788',
        srcEndpoint: '12',
        clusterId: '000f',
        dstAddrMode: 1,
        dstAddr16: '1234',
      }],
    }, frame);
    zdo.parseZdoFrame(frame);
    expect(frame).toEqual(expectedFrame);
    dumpFrame('Resp', frame);
  });
  it('1 16-bit bind entry (unknown cluster)', () => {
    const frame = Object.assign({
      clusterId: zci.MANAGEMENT_BIND_RESPONSE,
      data: Buffer.from([
        0xee, 0x00, 0x01, 0x00, 0x01,
        0x88, 0x77, 0x66, 0x55, 0x44, 0x33, 0x22, 0x11,
        0x12, 0x00, 0xf0, 0x01, 0x34, 0x12,
      ]),
    }, defaultFrame);
    const expectedFrame = Object.assign({
      zdoSeq: frame.zdoSeq,
      status: 0,
      numEntries: 1,
      startIndex: 0,
      numEntriesThisResponse: 1,
      bindings: [{
        srcAddr64: '1122334455667788',
        srcEndpoint: '12',
        clusterId: 'f000',
        dstAddrMode: 1,
        dstAddr16: '1234',
      }],
    }, frame);
    zdo.parseZdoFrame(frame);
    expect(frame).toEqual(expectedFrame);
    dumpFrame('Resp', frame);
  });
  it('1 64-bit bind entry', () => {
    const frame = Object.assign({
      clusterId: zci.MANAGEMENT_BIND_RESPONSE,
      data: Buffer.from([
        0xee, 0x00, 0x01, 0x00, 0x01,
        0x88, 0x77, 0x66, 0x55, 0x44, 0x33, 0x22, 0x11,
        0x12, 0x0f, 0x00, 0x03,
        0xef, 0xcd, 0xab, 0x90, 0x78, 0x56, 0x34, 0x12,
        0x34,
      ]),
    }, defaultFrame);
    const expectedFrame = Object.assign({
      zdoSeq: frame.zdoSeq,
      status: 0,
      numEntries: 1,
      startIndex: 0,
      numEntriesThisResponse: 1,
      bindings: [{
        srcAddr64: '1122334455667788',
        srcEndpoint: '12',
        clusterId: '000f',
        dstAddrMode: 3,
        dstAddr64: '1234567890abcdef',
        dstEndpoint: '34',
      }],
    }, frame);
    zdo.parseZdoFrame(frame);
    expect(frame).toEqual(expectedFrame);
    dumpFrame('Resp', frame);
  });
  it('unknown addr mode', () => {
    const frame = Object.assign({
      clusterId: zci.MANAGEMENT_BIND_RESPONSE,
      data: Buffer.from([
        0xee, 0x00, 0x01, 0x00, 0x01,
        0x88, 0x77, 0x66, 0x55, 0x44, 0x33, 0x22, 0x11,
        0x12, 0x0f, 0x00, 0x04,
      ]),
    }, defaultFrame);
    const expectedFrame = Object.assign({
      zdoSeq: frame.zdoSeq,
      status: 0,
      numEntries: 1,
      startIndex: 0,
      numEntriesThisResponse: 1,
      bindings: [{
        srcAddr64: '1122334455667788',
        srcEndpoint: '12',
        clusterId: '000f',
        dstAddrMode: 4,
      }],
    }, frame);
    zdo.parseZdoFrame(frame);
    expect(frame).toEqual(expectedFrame);
    dumpFrame('Resp', frame);
  });
});

describe(zci[zci.MANAGEMENT_LEAVE_REQUEST], () => {
  it('Request Frame', () => {
    const frame = Object.assign({
      clusterId: zci.MANAGEMENT_LEAVE_REQUEST,
      leaveOptions: 0xcc,
    }, defaultFrame);
    zdoObj.makeFrame(frame);
    const expectedData = Buffer.from([
      0xee, 0xef, 0xcd, 0xab, 0x89, 0x67, 0x45, 0x23, 0x01, 0xcc,
    ]);
    expect(frame.data).toEqual(expectedData);
    dumpFrame('Req', frame);
  });
  it('Parse frame', () => {
    const frame = Object.assign({
      clusterId: zci.MANAGEMENT_LEAVE_REQUEST,
      data: Buffer.from([
        0xee, 0xef, 0xcd, 0xab, 0x89, 0x67, 0x45, 0x23, 0x01, 0xcc,
      ]),
    }, defaultFrame);
    const expectedFrame = Object.assign({
      zdoSeq: frame.zdoSeq,
      leaveOptions: 0xcc,
    }, frame);
    zdo.parseZdoFrame(frame);
    expect(frame).toEqual(expectedFrame);
    dumpFrame('Resp', frame);
  });
});

describe(zci[zci.MANAGEMENT_LEAVE_RESPONSE], () => {
  it('Response frame', () => {
    const frame = Object.assign({
      clusterId: zci.MANAGEMENT_LEAVE_RESPONSE,
      data: Buffer.from([0xee, 0x00]),
    }, defaultFrame);
    const expectedFrame = Object.assign({
      zdoSeq: frame.zdoSeq,
      status: 0,
    }, frame);
    zdo.parseZdoFrame(frame);
    expect(frame).toEqual(expectedFrame);
    dumpFrame('Resp', frame);
  });
});

describe(zci[zci.MANAGEMENT_PERMIT_JOIN_REQUEST], () => {
  it('Build Frame', () => {
    const frame = Object.assign({
      clusterId: zci.MANAGEMENT_PERMIT_JOIN_REQUEST,
      permitDuration: 0x11,
      trustCenterSignificance: 1,
    }, defaultFrame);
    zdoObj.makeFrame(frame);
    const expectedData = Buffer.from([
      0xee, 0x11, 0x01,
    ]);
    expect(frame.data).toEqual(expectedData);
    dumpFrame('Req', frame);
  });
  it('Parse frame', () => {
    const frame = Object.assign({
      clusterId: zci.MANAGEMENT_PERMIT_JOIN_REQUEST,
      data: Buffer.from([0xee, 0x11, 0x01]),
    }, defaultFrame);
    const expectedFrame = Object.assign({
      zdoSeq: frame.zdoSeq,
      permitDuration: 0x11,
      trustCenterSignificance: 1,
    }, frame);
    zdo.parseZdoFrame(frame);
    expect(frame).toEqual(expectedFrame);
    dumpFrame('Resp', frame);
  });
});

describe(zci[zci.MANAGEMENT_PERMIT_JOIN_RESPONSE], () => {
  it('Response frame', () => {
    const frame = Object.assign({
      clusterId: zci.MANAGEMENT_PERMIT_JOIN_RESPONSE,
      data: Buffer.from([0xee, 0x00]),
    }, defaultFrame);
    const expectedFrame = Object.assign({
      zdoSeq: frame.zdoSeq,
      status: 0,
    }, frame);
    zdo.parseZdoFrame(frame);
    expect(frame).toEqual(expectedFrame);
    dumpFrame('Resp', frame);
  });
});

describe(zci[zci.MANAGEMENT_NETWORK_UPDATE_NOTIFY], () => {
  it('Response frame', () => {
    const frame = Object.assign({
      clusterId: zci.MANAGEMENT_NETWORK_UPDATE_NOTIFY,
      data: Buffer.from([
        0xee, 0x00,
        0x78, 0x56, 0x34, 0x12,
        0x34, 0x12,
        0x01, 0x00,
        0x03, 0x03, 0x04, 0x05,
      ]),
    }, defaultFrame);
    const expectedFrame = Object.assign({
      zdoSeq: frame.zdoSeq,
      status: 0,
      scannedChannels: '12345678',
      totalTransmissions: 0x1234,
      transmissionFailures: 0x0001,
      numEnergyValues: 3,
      energyValues: [3, 4, 5],
    }, frame);
    zdo.parseZdoFrame(frame);
    expect(frame).toEqual(expectedFrame);
    dumpFrame('Resp', frame);
  });
});

describe('makeFrame coverage', () => {
  it('no frame object', () => {
    expect(() => {
      zdoObj.makeFrame();
    }).toThrow();
  });
  it('missing destination64', () => {
    const frame = {};
    expect(() => {
      zdoObj.makeFrame(frame);
    }).toThrow();
  });
  it('missing destination16', () => {
    const frame = {
      destination64: '01234567891bcdef',
    };
    expect(() => {
      zdoObj.makeFrame(frame);
    }).toThrow();
  });
  it('missing clusterId', () => {
    const frame = {
      destination64: '01234567891bcdef',
      destination16: '1234',
    };
    expect(() => {
      zdoObj.makeFrame(frame);
    }).toThrow();
  });
  it('unsupported clusterId', () => {
    const frame = {
      destination64: '01234567891bcdef',
      destination16: '1234',
      clusterId: 65536,
    };
    expect(() => {
      zdoObj.makeFrame(frame);
    }).toThrow();
  });
});

describe('nextZdoSeq', () => {
  it('nextZdoSeq 0 -> 1', () => {
    const frame = {
      destination64: '01234567891bcdef',
      destination16: '1234',
      clusterId: zci.ACTIVE_ENDPOINTS_REQUEST,
    };
    zdoObj.zdoSeq = 0;
    zdoObj.makeFrame(frame);
    expect(frame.zdoSeq).toEqual(1);
  });
  it('nextZdoSeq 255 -> 0', () => {
    const frame = {
      destination64: '01234567891bcdef',
      destination16: '1234',
      clusterId: zci.ACTIVE_ENDPOINTS_REQUEST,
    };
    zdoObj.zdoSeq = 255;
    zdoObj.makeFrame(frame);
    expect(frame.zdoSeq).toEqual(0);
  });
});

describe('parser', () => {
  // Coverage test
  it('unrecognized clusterId', () => {
    const frame = {
      destination64: '01234567891bcdef',
      destination16: '1234',
      clusterId: 65535,
      data: Buffer.from([0xee]),
    };
    zdo.parseZdoFrame(frame);
  });
});

describe('isZdoFrame', () => {
  // Coverage test
  it('profileId as invalid number', () => {
    const frame = {
      profileId: 1,
    };
    expect(zdo.isZdoFrame(frame)).toBe(false);
  });
  it('profileId as invalid string', () => {
    const frame = {
      profileId: '',
    };
    expect(zdo.isZdoFrame(frame)).toBe(false);
  });
  it('profileId as valid number', () => {
    const frame = {
      profileId: 0,
    };
    expect(zdo.isZdoFrame(frame)).toBe(true);
  });
  it('profileId as valid string', () => {
    const frame = {
      profileId: '0000',
    };
    expect(zdo.isZdoFrame(frame)).toBe(true);
  });
});

describe('getClusterIdDescription', () => {
  it('valid clusterId', () => {
    expect(zdo.getClusterIdDescription(0)).toBe(zci[0]);
  });
  it('invalid clusterId', () => {
    expect(zdo.getClusterIdDescription(0xffff)).toBe('??? 0xffff ???');
  });
});

describe('getClusterIdAsInt', () => {
  it('clusterId as number', () => {
    expect(zdo.getClusterIdAsInt(0)).toBe(0);
  });
  it('clusterId as hex string', () => {
    expect(zdo.getClusterIdAsInt('0000')).toBe(0);
  });
  it('clusterId as name', () => {
    expect(zdo.getClusterIdAsInt('genBasic')).toBe(0);
  });
  it('clusterId as unknown name', () => {
    expect(zdo.getClusterIdAsInt('xxxx')).toBeUndefined();
  });
});

describe('dumpZdoFrame', () => {
  it('unknown clusterId', () => {
    zdo.dumpZdoFrame('Test', {clusterId: 'ffff'});
  });
});

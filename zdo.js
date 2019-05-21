/**
 *
 * zb-zdo - Frame builder/parser for the Zigbee ZDO layer
 *
 * This follows the pattern used for the xbee-api, and builds the
 * buffer needed for the frame.data used with the
 * EXPLICIT_ADDRESSING_ZIGBEE_COMMAND_FRAME (0x11) command.
 *
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.*
 */

'use strict';

const assert = require('assert');
const BufferBuilder = require('buffer-builder');
const BufferReader = require('buffer-reader');
const zclId = require('zcl-id');

const PROFILE_ID = {
  ZDO: 0,
  ZDO_HEX: '0000',
};

exports = module.exports;

const zci = exports.CLUSTER_ID = {};

// Function which will convert endianess of hex strings.
// i.e. '12345678'.swapHex() returns '78563412'
function swapHex(string) {
  return string.match(/.{2}/g).reverse().join('');
}

zci.NETWORK_ADDRESS_REQUEST = 0x0000;
zci[zci.NETWORK_ADDRESS_REQUEST] = 'Network Address Req (0x0000)';
zci.NETWORK_ADDRESS_RESPONSE = 0x8000;
zci[zci.NETWORK_ADDRESS_RESPONSE] = 'Network Address Resp (0x8000)';

zci.IEEE_ADDRESS_REQUEST = 0x0001;
zci[zci.IEEE_ADDRESS_REQUEST] = 'IEEE Address Req (0x0001)';
zci.IEEE_ADDRESS_RESPONSE = 0x8001;
zci[zci.IEEE_ADDRESS_RESPONSE] = 'IEEE Address Resp (0x8001)';

zci.NODE_DESCRIPTOR_REQUEST = 0x0002;
zci[zci.NODE_DESCRIPTOR_REQUEST] = 'Node Descriptor Req (0x0002)';
zci.NODE_DESCRIPTOR_RESPONSE = 0x8002;
zci[zci.NODE_DESCRIPTOR_RESPONSE] = 'Node Descriptor Resp (0x8002)';

zci.SIMPLE_DESCRIPTOR_REQUEST = 0x0004;
zci[zci.SIMPLE_DESCRIPTOR_REQUEST] = 'Simple Descriptor Req (0x0004)';
zci.SIMPLE_DESCRIPTOR_RESPONSE = 0x8004;
zci[zci.SIMPLE_DESCRIPTOR_RESPONSE] = 'Simple Descriptor Resp (0x8004)';

zci.ACTIVE_ENDPOINTS_REQUEST = 0x0005;
zci[zci.ACTIVE_ENDPOINTS_REQUEST] = 'Active Endpoints Req (0x0005)';
zci.ACTIVE_ENDPOINTS_RESPONSE = 0x8005;
zci[zci.ACTIVE_ENDPOINTS_RESPONSE] = 'Active Endpoints Resp (0x8005)';

zci.MATCH_DESCRIPTOR_REQUEST = 0x0006;
zci[zci.MATCH_DESCRIPTOR_REQUEST] = 'Match Descriptor Req (0x0006)';
zci.MATCH_DESCRIPTOR_RESPONSE = 0x8006;
zci[zci.MATCH_DESCRIPTOR_RESPONSE] = 'Match Descriptor Resp (0x8006)';

zci.END_DEVICE_ANNOUNCEMENT = 0x0013;
zci[zci.END_DEVICE_ANNOUNCEMENT] = 'End Device Announcement (0x0013)';

zci.BIND_REQUEST = 0x0021;
zci[zci.BIND_REQUEST] = 'Bind Req (0x0021)';
zci.BIND_RESPONSE = 0x8021;
zci[zci.BIND_RESPONSE] = 'Bind Resp (0x8021)';

zci.MANAGEMENT_LQI_REQUEST = 0x0031;
zci[zci.MANAGEMENT_LQI_REQUEST] = 'Mgmt LQI (Neighbor Table) Req (0x0031)';
zci.MANAGEMENT_LQI_RESPONSE = 0x8031;
zci[zci.MANAGEMENT_LQI_RESPONSE] = 'Mgmt LQI (Neighbor Table) Resp (0x8031)';

zci.MANAGEMENT_RTG_REQUEST = 0x0032;
zci[zci.MANAGEMENT_RTG_REQUEST] = 'Mgmt RTG (Routing Table) Req (0x0032)';
zci.MANAGEMENT_RTG_RESPONSE = 0x8032;
zci[zci.MANAGEMENT_RTG_RESPONSE] = 'Mgmt RTG (Routing Table) Resp (0x8032)';

zci.MANAGEMENT_BIND_REQUEST = 0x0033;
zci[zci.MANAGEMENT_BIND_REQUEST] = 'Mgmt BIND (Binding Table) Req (0x0033)';
zci.MANAGEMENT_BIND_RESPONSE = 0x8033;
zci[zci.MANAGEMENT_BIND_RESPONSE] = 'Mgmt BIND (Binding Table) Resp (0x8033)';

zci.MANAGEMENT_LEAVE_REQUEST = 0x0034;
zci[zci.MANAGEMENT_LEAVE_REQUEST] = 'Mgmt Leave Req (0x0034)';
zci.MANAGEMENT_LEAVE_RESPONSE = 0x8034;
zci[zci.MANAGEMENT_LEAVE_RESPONSE] = 'Mgmt Leave Resp (0x8034)';

zci.MANAGEMENT_PERMIT_JOIN_REQUEST = 0x0036;
zci[zci.MANAGEMENT_PERMIT_JOIN_REQUEST] = 'Mgmt Permit Join Req (0x0036)';
zci.MANAGEMENT_PERMIT_JOIN_RESPONSE = 0x8036;
zci[zci.MANAGEMENT_PERMIT_JOIN_RESPONSE] = 'Mgmt Permit Join Resp (0x8036)';

zci.MANAGEMENT_NETWORK_UPDATE_REQUEST = 0x0038;
zci[zci.MANAGEMENT_NETWORK_UPDATE_REQUEST] = 'Mgmt Network Update Req (0x0038)';
zci.MANAGEMENT_NETWORK_UPDATE_NOTIFY = 0x8038;
zci[zci.MANAGEMENT_NETWORK_UPDATE_NOTIFY] =
  'Mgmt Network Update Notify (0x8038)';

const zdoBuilder = module.exports.zdoBuilder = {};
const zdoParser = module.exports.zdoParser = {};
const zdoDump = module.exports.zdoDump = {};

function hexStr(num) {
  return `000${num.toString(16)}`.slice(-4);
}

function getClusterIdAsString(clusterId) {
  if (typeof clusterId === 'number') {
    return hexStr(clusterId);
  }
  return `${clusterId}`;
}
exports.getClusterIdAsString = getClusterIdAsString;

function getClusterIdAsInt(clusterId) {
  if (typeof clusterId === 'number') {
    return clusterId;
  }
  if (typeof clusterId === 'string' && clusterId.match('^[0-9A-Fa-f]+$')) {
    return parseInt(clusterId, 16);
  }
  const cluster = zclId.cluster(clusterId);
  if (cluster) {
    return cluster.value;
  }
}
exports.getClusterIdAsInt = getClusterIdAsInt;

function getClusterIdDescription(clusterId) {
  clusterId = getClusterIdAsInt(clusterId);
  if (clusterId in zci) {
    return zci[clusterId];
  }
  return `??? 0x${getClusterIdAsString(clusterId)} ???`;
}
exports.getClusterIdDescription = getClusterIdDescription;

function isZdoFrame(frame) {
  if (typeof frame.profileId === 'number') {
    return frame.profileId === PROFILE_ID.ZDO;
  }
  return frame.profileId === PROFILE_ID.ZDO_HEX;
}
exports.isZdoFrame = isZdoFrame;

function dumpZdoFrame(label, frame) {
  const clusterId = getClusterIdAsInt(frame.clusterId);
  if (zdoDump.hasOwnProperty(clusterId)) {
    const result = zdoDump[clusterId](frame);
    if (Array.isArray(result)) {
      for (const line of result) {
        console.log(label, line);
      }
    } else {
      console.log(label, result);
    }
  }
}
exports.dumpZdoFrame = dumpZdoFrame;

function parseZdoFrame(frame) {
  const reader = new BufferReader(frame.data);
  frame.zdoSeq = reader.nextUInt8();
  const clusterId = getClusterIdAsInt(frame.clusterId);
  if (zdoParser.hasOwnProperty(clusterId)) {
    zdoParser[clusterId](frame, reader);
  } else {
    console.log('Received unrecognized ZDO Frame');
    console.log(frame);
  }
}
exports.parseZdoFrame = parseZdoFrame;

class ZdoApi {
  constructor(nextFrameId, txFrameType) {
    this.txFrameType = txFrameType;
    this.nextFrameId = nextFrameId;
    this.zdoSeq = 0;
  }

  nextZdoSeq() {
    this.zdoSeq = (this.zdoSeq + 1) & 0xff;
    return this.zdoSeq;
  }

  getZdoSeq(frame) {
    assert(frame, 'Frame parameter must be supplied');
    if (!frame.hasOwnProperty('zdoSeq')) {
      frame.zdoSeq = this.nextZdoSeq();
    }
    return frame.zdoSeq;
  }

  makeFrame(frame) {
    assert(frame, 'Frame parameter must be a frame object');
    assert(typeof frame.clusterId !== 'undefined',
           'Caller must provide frame.clusterId');

    if (!frame.destination16) {
      // 16-bit address is unknown.
      frame.destination16 = 'fffe';
    }

    const clusterId = getClusterIdAsInt(frame.clusterId);
    // Convert the clusterId to its hex form. This is easier to
    // use for debugging
    frame.clusterId = hexStr(clusterId);

    if (!zdoBuilder[clusterId]) {
      throw new Error(
        `This library does not implement building the 0x${
          getClusterIdAsString(clusterId)} frame type.`);
    }

    frame.id = this.nextFrameId();
    frame.type = this.txFrameType;
    frame.sourceEndpoint = 0;
    frame.destinationEndpoint = 0;
    frame.profileId = 0;

    const zdoData = Buffer.alloc(256);
    const builder = new BufferBuilder(zdoData);
    builder.appendUInt8(this.getZdoSeq(frame));

    zdoBuilder[clusterId](frame, builder);

    frame.data = zdoData.slice(0, builder.length);

    return frame;
  }
}

exports.ZdoApi = ZdoApi;

// ---------------------------------------------------------------------------
//
// Builders
//
// ---------------------------------------------------------------------------

zdoBuilder[zci.ACTIVE_ENDPOINTS_REQUEST] =
zdoBuilder[zci.NODE_DESCRIPTOR_REQUEST] = function(frame, builder) {
  builder.appendUInt16LE(parseInt(frame.destination16, 16));
};

zdoParser[zci.ACTIVE_ENDPOINTS_REQUEST] =
zdoParser[zci.NODE_DESCRIPTOR_REQUEST] = function(frame, reader) {
  frame.destination16 = swapHex(reader.nextString(2, 'hex'));
};

zdoDump[zci.ACTIVE_ENDPOINTS_REQUEST] =
zdoDump[zci.NODE_DESCRIPTOR_REQUEST] = function(frame) {
  return `Dest: ${frame.destination16}`;
};

zdoBuilder[zci.BIND_REQUEST] = function(frame, builder) {
  builder.appendString(swapHex(frame.bindSrcAddr64), 'hex');
  builder.appendUInt8(frame.bindSrcEndpoint);
  if (typeof frame.bindClusterId === 'number') {
    builder.appendUInt16LE(frame.bindClusterId, 'hex');
  } else {
    builder.appendString(swapHex(frame.bindClusterId), 'hex');
  }
  builder.appendUInt8(frame.bindDstAddrMode);
  if (frame.bindDstAddrMode === 1) {
    assert(typeof frame.bindDstAddr16 !== 'undefined',
           'Must provide bindDstAddr16 for bindDstAddrMode 1');
    builder.appendString(swapHex(frame.bindDstAddr16), 'hex');
  } else if (frame.bindDstAddrMode === 3) {
    assert(typeof frame.bindDstAddr64 !== 'undefined',
           'Must provide bindDstAddr64 for bindDstAddrMode 3');
    assert(typeof frame.bindDstEndpoint !== 'undefined',
           'Must provide bindDstEndpoint for bindDstAddrMode 3');
    builder.appendString(swapHex(frame.bindDstAddr64), 'hex');
    builder.appendUInt8(frame.bindDstEndpoint);
  } else {
    assert(false, 'Must provide frame.bindDstAddrMode');
  }
};

zdoParser[zci.BIND_REQUEST] = function(frame, reader) {
  frame.bindSrcAddr64 = swapHex(reader.nextString(8, 'hex'));
  frame.bindSrcEndpoint = reader.nextUInt8();
  frame.bindClusterId = swapHex(reader.nextString(2, 'hex'));
  frame.bindDstAddrMode = reader.nextUInt8();
  if (frame.bindDstAddrMode == 1) {
    frame.bindDstAddr16 = swapHex(reader.nextString(2, 'hex'));
  } else if (frame.bindDstAddrMode == 3) {
    frame.bindDstAddr64 = swapHex(reader.nextString(8, 'hex'));
    frame.bindDstEndpoint = reader.nextUInt8();
  }
};

zdoDump[zci.BIND_REQUEST] = function(frame) {
  let s = `Src:${frame.bindSrcAddr64}:${frame.bindSrcEndpoint}`;
  s += ` C:${getClusterIdAsString(frame.bindClusterId)}`;
  const cluster = zclId.cluster(getClusterIdAsInt(frame.bindClusterId));
  if (cluster) {
    s += `-${cluster.key}`;
  }
  if (frame.bindDstAddrMode == 1) {
    s += ` Dst:${frame.bindDstAddr16}`;
  } else if (frame.bindDstAddrMode == 3) {
    s += ` Dst:${frame.bindDstAddr64}:${frame.bindDstEndpoint}`;
  }
  return s;
};


zdoBuilder[zci.IEEE_ADDRESS_REQUEST] = function(frame, builder) {
  builder.appendString(swapHex(frame.addr16), 'hex');
  builder.appendUInt8(frame.requestType);
  builder.appendUInt8(frame.startIndex);
};

zdoParser[zci.IEEE_ADDRESS_REQUEST] = function(frame, reader) {
  frame.addr16 = swapHex(reader.nextString(2, 'hex'));
  frame.requestType = reader.nextUInt8();
  frame.startIndex = reader.nextUInt8();
};

zdoDump[zci.IEEE_ADDRESS_REQUEST] = function(frame) {
  return `Addr:${frame.addr16}`;
};

zdoBuilder[zci.MANAGEMENT_BIND_REQUEST] = function(frame, builder) {
  builder.appendUInt8(frame.startIndex);
};

zdoParser[zci.MANAGEMENT_BIND_REQUEST] = function(frame, reader) {
  frame.startIndex = reader.nextUInt8();
};

zdoDump[zci.MANAGEMENT_BIND_REQUEST] = function(frame) {
  return `si:${frame.startIndex}`;
};

zdoBuilder[zci.MANAGEMENT_LEAVE_REQUEST] = function(frame, builder) {
  builder.appendString(swapHex(frame.destination64), 'hex');
  builder.appendUInt8(frame.leaveOptions);
};

zdoParser[zci.MANAGEMENT_LEAVE_REQUEST] = function(frame, reader) {
  frame.destination64 = swapHex(reader.nextString(8, 'hex'));
  frame.leaveOptions = reader.nextUInt8();
};

zdoDump[zci.MANAGEMENT_LEAVE_REQUEST] = function(frame) {
  return `Dst:${frame.destination64}`;
};

zdoBuilder[zci.MANAGEMENT_LQI_REQUEST] =
zdoBuilder[zci.MANAGEMENT_RTG_REQUEST] = function(frame, builder) {
  builder.appendUInt8(frame.startIndex);
};

zdoParser[zci.MANAGEMENT_LQI_REQUEST] =
zdoParser[zci.MANAGEMENT_RTG_REQUEST] = function(frame, reader) {
  frame.startIndex = reader.nextUInt8();
};

zdoDump[zci.MANAGEMENT_LQI_REQUEST] =
zdoDump[zci.MANAGEMENT_RTG_REQUEST] = function(frame) {
  return `si:${frame.startIndex}`;
};

zdoBuilder[zci.MANAGEMENT_PERMIT_JOIN_REQUEST] = function(frame, builder) {
  builder.appendUInt8(frame.permitDuration);
  builder.appendUInt8(frame.trustCenterSignificance);
};

zdoParser[zci.MANAGEMENT_PERMIT_JOIN_REQUEST] = function(frame, reader) {
  frame.permitDuration = reader.nextUInt8();
  frame.trustCenterSignificance = reader.nextUInt8();
};

zdoDump[zci.MANAGEMENT_PERMIT_JOIN_REQUEST] = function(frame) {
  return `Duration:${frame.permitDuration}`;
};

zdoBuilder[zci.MATCH_DESCRIPTOR_RESPONSE] = function(frame, builder) {
  builder.appendUInt8(frame.status);
  builder.appendUInt16LE(parseInt(frame.zdoAddr16, 16));
  builder.appendUInt8(frame.endpoints.length);
  for (const endpoint of frame.endpoints) {
    builder.appendUInt8(endpoint);
  }
};

zdoParser[zci.MATCH_DESCRIPTOR_RESPONSE] = function(frame, reader) {
  frame.status = reader.nextUInt8();
  frame.zdoAddr16 = swapHex(reader.nextString(2, 'hex'));
  const numEndpoints = reader.nextUInt8();
  frame.endpoints = [];
  for (let i = 0; i < numEndpoints; i++) {
    frame.endpoints[i] = reader.nextUInt8();
  }
};

zdoDump[zci.MATCH_DESCRIPTOR_RESPONSE] = function(frame) {
  return `Status:${frame.status} Addr:${frame.zdoAddr16} ` +
         `EP:[${frame.endpoints.toString()}]`;
};

zdoBuilder[zci.NETWORK_ADDRESS_REQUEST] = function(frame, builder) {
  builder.appendString(swapHex(frame.addr64), 'hex');
  builder.appendUInt8(frame.requestType);
  builder.appendUInt8(frame.startIndex);
};

zdoParser[zci.NETWORK_ADDRESS_REQUEST] = function(frame, reader) {
  frame.addr64 = swapHex(reader.nextString(8, 'hex'));
  frame.requestType = reader.nextUInt8();
  frame.startIndex = reader.nextUInt8();
};

zdoDump[zci.NETWORK_ADDRESS_REQUEST] = function(frame) {
  return `Addr:${frame.addr64}`;
};

zdoBuilder[zci.SIMPLE_DESCRIPTOR_REQUEST] = function(frame, builder) {
  builder.appendUInt16LE(parseInt(frame.destination16, 16));
  builder.appendUInt8(frame.endpoint);
};

zdoParser[zci.SIMPLE_DESCRIPTOR_REQUEST] = function(frame, reader) {
  frame.destination16 = swapHex(reader.nextString(2, 'hex'));
  frame.endpoint = reader.nextUInt8();
};

zdoDump[zci.SIMPLE_DESCRIPTOR_REQUEST] = function(frame) {
  return `Addr:${frame.destination16}:${frame.endpoint}`;
};

// ---------------------------------------------------------------------------
//
// Parsers
//
// ---------------------------------------------------------------------------

zdoParser[zci.ACTIVE_ENDPOINTS_RESPONSE] = function(frame, reader) {
  frame.status = reader.nextUInt8();
  frame.zdoAddr16 = swapHex(reader.nextString(2, 'hex'));
  if (reader.offset < reader.buf.length) {
    frame.numActiveEndpoints = reader.nextUInt8();
    frame.activeEndpoints = [];
    for (let i = 0; i < frame.numActiveEndpoints; i++) {
      frame.activeEndpoints[i] = reader.nextUInt8();
    }
  } else {
    frame.numActiveEndpoints = 0;
    frame.activeEndpoints = [];
  }
};

zdoDump[zci.ACTIVE_ENDPOINTS_RESPONSE] = function(frame) {
  return `Status:${frame.status} Addr:${frame.zdoAddr16} ` +
         `EP:[${frame.activeEndpoints.toString()}]`;
};

zdoParser[zci.BIND_RESPONSE] =
zdoParser[zci.MANAGEMENT_LEAVE_RESPONSE] =
zdoParser[zci.MANAGEMENT_PERMIT_JOIN_RESPONSE] = function(frame, reader) {
  frame.status = reader.nextUInt8();
};

zdoDump[zci.BIND_RESPONSE] =
zdoDump[zci.MANAGEMENT_LEAVE_RESPONSE] =
zdoDump[zci.MANAGEMENT_PERMIT_JOIN_RESPONSE] = function(frame) {
  return `Status:${frame.status}`;
};

zdoParser[zci.END_DEVICE_ANNOUNCEMENT] = function(frame, reader) {
  frame.zdoAddr16 = swapHex(reader.nextString(2, 'hex'));
  frame.zdoAddr64 = swapHex(reader.nextString(8, 'hex'));
  frame.capability = reader.nextUInt8();
  frame.alternatePanCoordinator = (frame.capability >> 0) & 1;
  frame.fullFunctionDevice = (frame.capability >> 1) & 1;
  frame.acPower = (frame.capability >> 2) & 1;
  frame.rxOnWhenIdle = (frame.capability >> 3) & 1;
  frame.securityCapability = (frame.capability >> 6) & 1;
  frame.allocShortAddress = (frame.capability >> 7) & 1;
};

zdoDump[zci.END_DEVICE_ANNOUNCEMENT] = function(frame) {
  return `Addr:${frame.zdoAddr64} ${frame.zdoAddr16} ` +
         `FFD:${frame.fullFunctionDevice} ` +
         `AC:${frame.acPower} ` +
         `rxOnWhenIdle:${frame.rxOnWhenIdle}`;
};

zdoParser[zci.IEEE_ADDRESS_RESPONSE] =
zdoParser[zci.NETWORK_ADDRESS_RESPONSE] = function(frame, reader) {
  frame.status = reader.nextUInt8();
  frame.nwkAddr64 = swapHex(reader.nextString(8, 'hex'));
  frame.nwkAddr16 = swapHex(reader.nextString(2, 'hex'));
  if (reader.offset < reader.buf.length) {
    frame.numAssocDev = reader.nextUInt8();
    frame.startIndex = reader.nextUInt8();
    frame.assocAddr16 = [];
    for (let i = 0; i < frame.numAssocDev; i++) {
      frame.assocAddr16[i] = swapHex(reader.nextString(2, 'hex'));
    }
  } else {
    frame.numAssocDev = 0;
    frame.startIndex = 0;
    frame.assocAddr16 = [];
  }
};

zdoDump[zci.IEEE_ADDRESS_RESPONSE] =
zdoDump[zci.NETWORK_ADDRESS_RESPONSE] = function(frame) {
  let assocStr = '';
  for (const assocAddr16 of frame.assocAddr16) {
    if (assocStr.length > 0) {
      assocStr += ' ';
    }
    assocStr += assocAddr16;
  }
  return `Addr:${frame.nwkAddr64} ${frame.nwkAddr16} ` +
         `si:${frame.startIndex} [${assocStr}]`;
};

zdoParser[zci.MANAGEMENT_BIND_RESPONSE] = function(frame, reader) {
  frame.status = reader.nextUInt8();
  frame.numEntries = reader.nextUInt8();
  frame.startIndex = reader.nextUInt8();
  frame.numEntriesThisResponse = reader.nextUInt8();
  frame.bindings = [];

  for (let i = 0; i < frame.numEntriesThisResponse; i++) {
    const binding = frame.bindings[i] = {};

    binding.srcAddr64 = swapHex(reader.nextString(8, 'hex'));
    binding.srcEndpoint = reader.nextString(1, 'hex');
    binding.clusterId = swapHex(reader.nextString(2, 'hex'));
    binding.dstAddrMode = reader.nextUInt8();
    if (binding.dstAddrMode == 1) {
      binding.dstAddr16 = swapHex(reader.nextString(2, 'hex'));
    } else if (binding.dstAddrMode == 3) {
      binding.dstAddr64 = swapHex(reader.nextString(8, 'hex'));
      binding.dstEndpoint = reader.nextString(1, 'hex');
    }
  }
};

zdoDump[zci.MANAGEMENT_BIND_RESPONSE] = function(frame) {
  const result = [`Status:${frame.status} si:${frame.startIndex}`];
  for (let i = 0; i < frame.numEntriesThisResponse; i++) {
    const binding = frame.bindings[i];
    let s = `Src:${binding.srcAddr64}:${binding.srcEndpoint}`;
    s += ` C:${getClusterIdAsString(binding.clusterId)}`;
    const cluster = zclId.cluster(getClusterIdAsInt(binding.clusterId));
    if (cluster) {
      s += `-${cluster.key}`;
    }
    if (binding.dstAddrMode == 1) {
      s += ` Dst:${binding.dstAddr16}`;
    } else if (binding.dstAddrMode == 3) {
      s += ` Dst:${binding.dstAddr64}:${binding.dstEndpoint}`;
    }
    result.push(s);
  }
  return result;
};

zdoParser[zci.MANAGEMENT_LQI_RESPONSE] = function(frame, reader) {
  frame.status = reader.nextUInt8();
  frame.numEntries = reader.nextUInt8();
  frame.startIndex = reader.nextUInt8();
  frame.numEntriesThisResponse = reader.nextUInt8();
  frame.neighbors = [];

  for (let i = 0; i < frame.numEntriesThisResponse; i++) {
    const neighbor = frame.neighbors[i] = {};

    neighbor.panId = swapHex(reader.nextString(8, 'hex'));
    neighbor.addr64 = swapHex(reader.nextString(8, 'hex'));
    neighbor.addr16 = swapHex(reader.nextString(2, 'hex'));

    const byte1 = reader.nextUInt8();
    neighbor.deviceType = byte1 & 0x03;
    neighbor.rxOnWhenIdle = (byte1 >> 2) & 0x03;
    neighbor.relationship = (byte1 >> 4) & 0x07;

    const byte2 = reader.nextUInt8();
    neighbor.permitJoining = byte2 & 0x03;
    neighbor.depth = reader.nextUInt8();
    neighbor.lqi = reader.nextUInt8();
  }
};

const DEVICE_TYPE = [
  'Coord ',
  'Router',
  'EndDev',
  '???   ',
];
const RELATIONSHIP = [
  'Parent  ',
  'Child   ',
  'Sibling ',
  'None    ',
  'Previous',
];
const PERMIT_JOINS = ['Y', 'N', '?', '?'];

zdoDump[zci.MANAGEMENT_LQI_RESPONSE] = function(frame) {
  const result = [`Status:${frame.status} si:${frame.startIndex} ` +
                  `this frame: ${frame.numEntriesThisResponse} ` +
                  `total entries: ${frame.numEntries}`];
  for (let i = 0; i < frame.numEntriesThisResponse; i++) {
    const neighbor = frame.neighbors[i];
    let s = `PAN:${neighbor.panId} Addr:${neighbor.addr64} ${neighbor.addr16} `;
    s += `DT:${DEVICE_TYPE[neighbor.deviceType]} `;
    s += `R:${RELATIONSHIP[neighbor.relationship]} `;
    s += `PJ:${PERMIT_JOINS[neighbor.permitJoining]} `;
    s += `D:${neighbor.depth}   `.slice(0, 5);
    s += `LQI:${neighbor.lqi}`;
    result.push(s);
  }
  return result;
};

zdoParser[zci.MANAGEMENT_NETWORK_UPDATE_NOTIFY] = function(frame, reader) {
  frame.status = reader.nextUInt8();
  frame.scannedChannels = swapHex(reader.nextString(4, 'hex'));
  frame.totalTransmissions = reader.nextUInt16LE();
  frame.transmissionFailures = reader.nextUInt16LE();
  frame.numEnergyValues = reader.nextUInt8();
  frame.energyValues = [];
  for (let i = 0; i < frame.numEnergyValues; i++) {
    frame.energyValues[i] = reader.nextUInt8();
  }
};

zdoDump[zci.MANAGEMENT_NETWORK_UPDATE_NOTIFY] = function(frame) {
  return [
    `Status:${frame.status} sc:${frame.scannedChannels} ` +
    `TotalXmit:${frame.totalTransmissions} ` +
    `TotalFail:${frame.transmissionFailures}`,
    `Energy:[${frame.energyValues.toString()}]`,
  ];
};

zdoParser[zci.MANAGEMENT_RTG_RESPONSE] = function(frame, reader) {
  frame.status = reader.nextUInt8();
  frame.numEntries = reader.nextUInt8();
  frame.startIndex = reader.nextUInt8();
  frame.numEntriesThisResponse = reader.nextUInt8();
  frame.routings = [];

  for (let i = 0; i < frame.numEntriesThisResponse; i++) {
    const routing = frame.routings[i] = {};

    routing.addr16 = swapHex(reader.nextString(2, 'hex'));
    const byte1 = reader.nextUInt8();
    routing.status = byte1 & 0x07;
    routing.memoryConstrained = (byte1 >> 3) & 1;
    routing.manyToOne = (byte1 >> 4) & 1;
    routing.routeRecordRequired = (byte1 >> 5) & 1;
    routing.nextHopAddr16 = swapHex(reader.nextString(2, 'hex'));
  }
};

zdoDump[zci.MANAGEMENT_RTG_RESPONSE] = function(frame) {
  const result = [`Status:${frame.status} si:${frame.startIndex}`];
  for (let i = 0; i < frame.numEntriesThisResponse; i++) {
    const routing = frame.routings[i];
    let s = `nextHop:${routing.nextHopAddr16} `;
    s += `Status:${routing.status} MC:${routing.memoryConstrained} `;
    s += `N-1:${routing.manyToOne} `;
    s += `RRR:${routing.routeRecordRequired}`;
    result.push(s);
  }
  return result;
};

zdoParser[zci.MATCH_DESCRIPTOR_REQUEST] = function(frame, reader) {
  frame.zdoAddr16 = swapHex(reader.nextString(2, 'hex'));
  frame.matchProfileId = swapHex(reader.nextString(2, 'hex'));

  frame.inputClusterCount = reader.nextUInt8();
  frame.inputClusters = [];
  for (let i = 0; i < frame.inputClusterCount; i++) {
    frame.inputClusters[i] = swapHex(reader.nextString(2, 'hex'));
  }

  frame.outputClusterCount = reader.nextUInt8();
  frame.outputClusters = [];
  for (let i = 0; i < frame.outputClusterCount; i++) {
    frame.outputClusters[i] = swapHex(reader.nextString(2, 'hex'));
  }
};

zdoDump[zci.MATCH_DESCRIPTOR_REQUEST] = function(frame) {
  let s = `Addr:${frame.zdoAddr16} Prof:${frame.profileId}`;
  if (frame.inputClusters.length > 0) {
    s += ' In:[';
    s += frame.inputClusters.map((clusterId) => {
      const cluster = zclId.cluster(parseInt(clusterId, 16));
      return cluster ? `${clusterId}-${cluster.key}` : `${clusterId}`;
    }).toString();
    s += ']';
  }
  if (frame.inputClusters.length > 0) {
    s += ' Out:[';
    s += frame.outputClusters.map((clusterId) => {
      const cluster = zclId.cluster(parseInt(clusterId, 16));
      return cluster ? `${clusterId}-${cluster.key}` : `${clusterId}`;
    }).toString();
    s += ']';
  }
  return s;
};

zdoParser[zci.NODE_DESCRIPTOR_RESPONSE] = function(frame, reader) {
  frame.status = reader.nextUInt8();
  frame.zdoAddr16 = swapHex(reader.nextString(2, 'hex'));

  const byte1 = reader.nextUInt8();
  frame.logicalType = byte1 & 0x03;
  frame.complexDescriptorAvailable = (byte1 >> 3) & 0x01;
  frame.userDescriptorAvailable = (byte1 >> 4) & 0x01;

  const byte2 = reader.nextUInt8();
  frame.frequencyBand = (byte2 >> 3) & 0x1f;

  frame.macCapabilityFlags = reader.nextUInt8();
  if (reader.offset < reader.buf.length) {
    frame.manufacturerCode = swapHex(reader.nextString(2, 'hex'));
    frame.maxBufferSize = reader.nextUInt8();
    frame.maxIncomingXferSize = reader.nextUInt16LE();
    frame.serverMask = reader.nextUInt16LE();
    frame.maxOutgoingXferSize = reader.nextUInt16LE();
    frame.descriptorCapabilities = reader.nextUInt8();
  }
};

zdoDump[zci.NODE_DESCRIPTOR_RESPONSE] = function(frame) {
  return `Status:${frame.status} Addr:${frame.zdoAddr16}`;
};

zdoParser[zci.SIMPLE_DESCRIPTOR_RESPONSE] = function(frame, reader) {
  frame.status = reader.nextUInt8();
  frame.zdoAddr16 = swapHex(reader.nextString(2, 'hex'));
  frame.inputClusters = [];
  frame.outputClusters = [];
  if (reader.offset >= reader.buf.length) {
    return;
  }
  frame.simpleDescriptorLength = reader.nextUInt8();

  if (frame.simpleDescriptorLength === 0) {
    return;
  }

  frame.endpoint = reader.nextUInt8();
  frame.appProfileId = swapHex(reader.nextString(2, 'hex'));
  frame.appDeviceId = swapHex(reader.nextString(2, 'hex'));

  const byte1 = reader.nextUInt8();
  frame.appDeviceVersion = byte1 & 0x0f;

  frame.inputClusterCount = reader.nextUInt8();
  for (let i = 0; i < frame.inputClusterCount; i++) {
    frame.inputClusters[i] = swapHex(reader.nextString(2, 'hex'));
  }

  frame.outputClusterCount = reader.nextUInt8();
  for (let i = 0; i < frame.outputClusterCount; i++) {
    frame.outputClusters[i] = swapHex(reader.nextString(2, 'hex'));
  }
};

zdoDump[zci.SIMPLE_DESCRIPTOR_RESPONSE] = function(frame) {
  let s = `Status:${frame.status} Addr:${frame.zdoAddr16} `;
  s += `EP:${frame.endpoint} Prof:${frame.appProfileId} `;
  s += `DevId:${frame.appDeviceId} DevVer:${frame.appDeviceVersion}`;
  let result = [s];
  if (frame.inputClusters.length > 0) {
    result = result.concat(frame.inputClusters.map((clusterId) => {
      const cluster = zclId.cluster(parseInt(clusterId, 16));
      return cluster ? `In:  ${clusterId}-${cluster.key}` : `In:  ${clusterId}`;
    }));
  }
  if (frame.outputClusters.length > 0) {
    result = result.concat(frame.outputClusters.map((clusterId) => {
      const cluster = zclId.cluster(parseInt(clusterId, 16));
      return cluster ? `Out: ${clusterId}-${cluster.key}` : `Out: ${clusterId}`;
    }));
  }
  return result;
};

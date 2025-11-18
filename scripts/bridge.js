#!/usr/bin/env node
/**
 * @license
 * Copyright 2022-2025 Matter.js Authors
 * SPDX-License-Identifier: Apache-2.0
 */

import { Endpoint, Environment, Logger, ServerNode, StorageService, VendorId } from "@matter/main";
import { BridgedDeviceBasicInformationServer } from "@matter/main/behaviors/bridged-device-basic-information";
import { OnOffLightDevice } from "@matter/main/devices/on-off-light";
import { AggregatorEndpoint } from "@matter/main/endpoints/aggregator";
import MRPC from "../src/mrpc.js";

/** Initialize configuration values */
const uniqueId = "1763334410562";

const storageService = Environment.default.get(StorageService);
storageService.location = ".data";
Logger.level = "INFO";

const server = await ServerNode.create({
  id: uniqueId,

  productDescription: {
    name: "MRPC Matter Hub",
    deviceType: AggregatorEndpoint.deviceType,
  },

  // Provide defaults for the BasicInformation cluster on the Root endpoint
  // Optional: If Omitted some development defaults are used
  basicInformation: {
    vendorName: "alex-sherman",
    vendorId: VendorId(0xfff1),
    nodeLabel: "MRPC Matter Hub",
    productName: "MRPC Matter Hub",
    productLabel: "MRPC Matter Hub",
    productId: 0x8000,
    serialNumber: `matterjs-${uniqueId}`,
    uniqueId,
  },
});

const aggregator = new Endpoint(AggregatorEndpoint, { id: "aggregator" });
await server.add(aggregator);

let mrpc = new MRPC();
let lights = ["Dining", "Office", "LivingRoom", "Nook", "Bedroom"];

for (let i = 0; i < lights.length; i++) {
  const name = `${lights[i]}`;

  const endpoint = new Endpoint(OnOffLightDevice.with(BridgedDeviceBasicInformationServer), {
    id: `onoff-${i}`,
    bridgedDeviceBasicInformation: {
      nodeLabel: name, // Main end user name for the device
      productName: name,
      productLabel: name,
      serialNumber: `node-matter-${uniqueId}-${i}`,
      reachable: true,
    },
  });
  await aggregator.add(endpoint);

  endpoint.events.onOff.onOff$Changed.on((value) => {
    try {
      mrpc.call(`${lights[i]}.light`, value);
    } catch {}
  });
}

await server.start();
server.lifecycle.offline.on(() => mrpc.close());

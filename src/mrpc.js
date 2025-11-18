import crypto from "crypto";
import { createSocket } from "node:dgram";

export default class MRPC {
  constructor() {
    this.id = crypto.randomUUID();
    this.server = createSocket("udp4");
    this.server.on("message", this.onRecv.bind(this));
    this.server.bind({ port: 50123, reuseAddr: true });
    this.rpcId = 0;
    this.pending = {};
    this.pathCache = {};
  }

  close() {
    this.server.close();
  }

  onRecv(msg, rinfo) {
    try {
      const obj = JSON.parse(msg);
      if (obj.dst !== this.id) return;
      if (!(obj.id in this.pending)) return;
      let rpc = this.pending[obj.id];
      rpc.addrs.delete("192.168.1.255");
      rpc.addrs.delete(rinfo.address);
      if (rpc.resolve) {
        rpc.resolve(obj.result);
        // Mark the RPC as resolved.
        delete rpc.resolve;
      }
      if (!(rpc.dst in this.pathCache)) this.pathCache[rpc.dst] = new Set();
      this.pathCache[rpc.dst].add(rinfo.address);
    } catch (error) {
      console.error("Error parsing JSON:", error);
    }
  }

  call(dst, value) {
    const rpcId = (this.rpcId += 1);
    let payload = JSON.stringify({ src: this.id, id: rpcId, dst, value });
    let addrs = new Set(this.pathCache[dst]);
    addrs.add("192.168.1.255");
    let send = () => {
      addrs.forEach((addr) => this.server.send(payload, 50123, addr));
    };
    send();
    const promise = new Promise((resolve, reject) => {
      let scheduleRetry = () =>
        setTimeout(() => {
          if (!addrs.size || !(rpcId in this.pending)) return;
          send();
          scheduleRetry();
        }, 100);
      scheduleRetry();
      setTimeout(() => {
        if (!(rpcId in this.pending)) return;
        let rpc = this.pending[rpcId];
        // It the RPC wasn't resolved.
        if (rpc.resolve) {
          reject("retries exceeded");
        }
        // TODO: Anything left in addrs should probably be removed from the path cache.
        delete this.pending[rpcId];
      }, 1000);
      this.pending[rpcId] = { resolve, dst, addrs };
    });
    return promise;
  }
}

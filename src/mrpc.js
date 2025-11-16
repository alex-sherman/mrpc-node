import crypto from "crypto";
import { createSocket } from "node:dgram";

export default class MRPC {
  constructor() {
    this.id = crypto.randomUUID();
    this.server = createSocket("udp4");
    this.server.on("message", this.OnRecv.bind(this));
    this.server.bind({ port: 50123, reuseAddr: true });
    this.rpcId = 0;
    this.pending = {};
  }

  close() {
    this.server.close();
  }

  OnRecv(msg, rinfo) {
    try {
      const obj = JSON.parse(msg);
      if (obj.dst !== this.id) return;
      if (!(obj.id in this.pending)) return;
      this.pending[obj.id].resolve(obj.result);
      delete this.pending[obj.id];
    } catch (error) {
      console.error("Error parsing JSON:", error);
    }
  }

  Call(dst, value) {
    const rpcId = (this.rpcId += 1);
    let payload = JSON.stringify({ src: this.id, id: rpcId, dst: dst, value: value });
    let send = () => this.server.send(payload, 50123, "192.168.1.255");
    send();
    const promise = new Promise((resolve, reject) => {
      let retries = 0;
      let scheduleRetry = () =>
        setTimeout(() => {
          if (!(rpcId in this.pending)) return;
          retries += 1;
          if (retries < 10) {
            send();
            scheduleRetry();
            return;
          }
          delete this.pending[rpcId];
          reject("retries exceeded");
        }, 100);
      scheduleRetry();
      this.pending[rpcId] = { resolve };
    });
    return promise;
  }
}

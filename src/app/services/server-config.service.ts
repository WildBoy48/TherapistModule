import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ServerConfigService {

  private storageKey = 'server_ip';

  private defaultIp = '192.168.1.100';

  constructor() {}

  getServerIp(): string {
    return localStorage.getItem(this.storageKey) || this.defaultIp;
  }

  setServerIp(ip: string): void {
    localStorage.setItem(this.storageKey, ip);
  }

  getBaseUrl(): string {
    return `http://${this.getServerIp()}:3000`;
  }
}
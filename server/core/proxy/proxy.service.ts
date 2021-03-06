import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import HttpsProxyAgent from 'https-proxy-agent/dist/agent';
import fetch from 'node-fetch';

@Injectable()
export class ProxyService {
  constructor(private configService: ConfigService) {}

  async proxyImage(url: string, local: boolean = false, response: Response): Promise<Buffer> {
    try {
      let proxyAgent = null;
      if (this.configService.get('VIEWTUBE_PROXY_URL') && !local) {
        const proxy = this.configService.get('VIEWTUBE_PROXY_URL');
        proxyAgent = new HttpsProxyAgent(proxy);
      }
      const fetchResponse = await fetch(url, { agent: proxyAgent });
      if (response) {
        const image = await fetchResponse.buffer();
        return image;
      }
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }

  async proxyStream(url: string, response: Response): Promise<Buffer> {
    try {
      const fetchResponse = await fetch(Buffer.from(url, 'base64').toString('binary'));
      if (response) {
        const streamBuffer = await fetchResponse.buffer();
        return streamBuffer;
      }
    } catch (error) {
      throw new InternalServerErrorException(error);
    }
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

@Injectable()
export class NotificationAdapter {
  private readonly logger = new Logger(NotificationAdapter.name);

  constructor(private readonly configService: ConfigService) {}

  async sendAlert(payload: {
    title: string;
    message: string;
    severity: string;
    contractName: string;
    affectedConsumersCount: number;
  }): Promise<boolean> {
    const serviceUrl = this.configService.get<string>('notificationService.url');
    const serviceKey = this.configService.get<string>('notificationService.apiKey');
    const recipient = this.configService.get<string>('notificationService.alertEmailRecipient');

    if (serviceUrl && serviceKey && serviceKey.trim().length > 0) {
      try {
        this.logger.log(`Dispatching notification to Railway Notification Service: ${serviceUrl}/v1/notifications`);
        await axios.post(
          `${serviceUrl.replace(/\/+$/, '')}/v1/notifications`,
          {
            priority: payload.severity === 'CRITICAL' ? 'HIGH' : 'NORMAL',
            channels: ['EMAIL'],
            recipient: {
              email: recipient,
            },
            email: {
              subject: `[${payload.severity}] Data Contract Drift: ${payload.contractName}`,
              html: `<h2>${payload.title}</h2><p>${payload.message}</p><p>Affected Consumers: ${payload.affectedConsumersCount}</p>`,
            },
            metadata: {
              source: 'ai-data-contract-schema-drift-monitor',
              contractName: payload.contractName,
            },
          },
          {
            headers: {
              'x-api-key': serviceKey,
              'Content-Type': 'application/json',
            },
            timeout: 5000,
          },
        );
        return true;
      } catch (err: any) {
        this.logger.warn(`Failed to dispatch notification to Railway service: ${err.message}. Event logged locally.`);
      }
    } else {
      this.logger.log(
        `[MOCK NOTIFICATION] Dispatched alert for ${payload.contractName}: ${payload.title} -> ${payload.message}`,
      );
    }
    return false;
  }
}

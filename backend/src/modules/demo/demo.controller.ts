import { Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { DemoService } from './demo.service';

@ApiTags('Demo & Simulation Sandbox')
@Controller('demo')
export class DemoController {
  constructor(private readonly demoService: DemoService) {}

  @Get('scenarios')
  @ApiOperation({ summary: 'List pre-configured interactive drift simulation scenarios' })
  listScenarios() {
    return [
      {
        key: 'BREAKING',
        title: 'Breaking Schema Evolution (Dropped Column & Incompatible Type)',
        description:
          "Drops 'total_amount' and modifies 'currency' from string to integer. Breaks 2 Tier-1 blocking downstream consumers (Revenue BI Dashboard and Fraud Detection Engine).",
        severity: 'CRITICAL',
        targetContract: 'ct_orders_stream',
      },
      {
        key: 'QUALITY',
        title: 'Data Quality Drift (Null Rate Surge & Disallowed Enums)',
        description:
          "Null rate on non-nullable 'customer_email' spikes to 23.4% and unapproved order_status enum values ['CHARGEBACK', 'DISPUTED'] appear in telemetry.",
        severity: 'HIGH',
        targetContract: 'ct_orders_stream',
      },
      {
        key: 'RISKY',
        title: 'Potentially Risky Drift (Undeclared Attributes in Strict Schema)',
        description:
          "Identity contract with FULL compatibility receives unannounced attributes ['device_fingerprint_hash', 'ip_geo_country'].",
        severity: 'MEDIUM',
        targetContract: 'ct_user_identity',
      },
      {
        key: 'SAFE',
        title: 'Non-Breaking Safe Evolution (Optional Fields with Defaults)',
        description:
          "Safely adds optional attributes 'loyalty_points_earned' and 'coupon_code'. Compatible with all existing consumers.",
        severity: 'LOW',
        targetContract: 'ct_orders_stream',
      },
    ];
  }

  @Post('reset')
  @ApiOperation({ summary: 'Reset demo workspace to pristine initial state' })
  async reset() {
    return this.demoService.seedDemoWorkspace();
  }

  @Post('scenario/:key')
  @ApiOperation({ summary: 'Trigger an interactive drift simulation scenario' })
  async triggerScenario(@Param('key') key: string) {
    const validKey = key.toUpperCase() as 'BREAKING' | 'QUALITY' | 'RISKY' | 'SAFE';
    return this.demoService.runScenario(validKey);
  }
}

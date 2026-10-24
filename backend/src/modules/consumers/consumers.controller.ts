import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ConsumersService } from './consumers.service';
import { CreateConsumerDto } from './dto/create-consumer.dto';
import { CurrentUser } from '../../common/decorators';
import { UserSession } from '../../common/types';

@ApiTags('Downstream Consumers')
@Controller('consumers')
export class ConsumersController {
  constructor(private readonly consumersService: ConsumersService) {}

  @Get()
  @ApiOperation({ summary: 'List downstream consumers' })
  async findAll(@Query('contractId') contractId?: string) {
    if (contractId) {
      return this.consumersService.findByContract(contractId);
    }
    return this.consumersService.findAll();
  }

  @Post()
  @ApiOperation({ summary: 'Register a downstream consumer mapping' })
  async register(
    @Body() dto: CreateConsumerDto,
    @CurrentUser() actor: UserSession,
  ) {
    return this.consumersService.register(dto, actor);
  }
}

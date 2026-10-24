import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ContractsService } from './contracts.service';
import {
  CreateContractDto,
  ImportJsonSchemaDto,
  UpdateContractDto,
} from './dto/create-contract.dto';
import { CurrentUser } from '../../common/decorators';
import { UserSession } from '../../common/types';

@ApiTags('Data Contracts')
@Controller('contracts')
export class ContractsController {
  constructor(private readonly contractsService: ContractsService) {}

  @Get()
  @ApiOperation({ summary: 'List all registered data contracts' })
  async findAll(@Query('domain') domain?: string) {
    return this.contractsService.findAll(domain);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Retrieve specific contract by ID' })
  async findOne(@Param('id') id: string) {
    return this.contractsService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Register a new data contract' })
  async create(
    @Body() dto: CreateContractDto,
    @CurrentUser() actor: UserSession,
  ) {
    return this.contractsService.create(dto, actor);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update an existing data contract specification' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateContractDto,
    @CurrentUser() actor: UserSession,
  ) {
    return this.contractsService.update(id, dto, actor);
  }

  @Get(':id/json-schema')
  @ApiOperation({ summary: 'Export contract schema as standard Draft-07 JSON Schema' })
  async exportSchema(@Param('id') id: string) {
    return this.contractsService.exportJsonSchema(id);
  }

  @Post('import-json-schema')
  @ApiOperation({ summary: 'Parse JSON Schema into structured contract field definitions' })
  parseSchema(@Body() dto: ImportJsonSchemaDto) {
    const parsedFields = this.contractsService.parseJsonSchema(dto.jsonSchema);
    return {
      name: dto.name,
      fieldCount: parsedFields.length,
      fields: parsedFields,
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Archive/Delete a data contract' })
  async delete(@Param('id') id: string, @CurrentUser() actor: UserSession) {
    return { success: await this.contractsService.delete(id, actor) };
  }
}

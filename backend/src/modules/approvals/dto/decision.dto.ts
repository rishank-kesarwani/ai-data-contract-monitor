import { IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { ApprovalDecision } from '../../../common/types';

export class SubmitApprovalDecisionDto {
  @IsString()
  @IsNotEmpty()
  decision: ApprovalDecision; // 'APPROVE' | 'REJECT' | 'REQUEST_CHANGES'

  @IsString()
  @IsNotEmpty()
  comments: string;
}

import { IsNotEmpty, IsNumberString } from 'class-validator';

export class ShowFeedbackDto {
  @IsNotEmpty()
  @IsNumberString()
  id: number;
}

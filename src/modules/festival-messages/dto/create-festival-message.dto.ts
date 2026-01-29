import { IsNotEmpty, IsString, IsDateString, IsBoolean, IsOptional, IsInt, MaxLength } from 'class-validator';

export class CreateFestivalMessageDto {
  @IsNotEmpty()
  @IsInt()
  merchant_id: number;

  @IsNotEmpty()
  @IsString()
  @MaxLength(100)
  festival_name: string;

  @IsNotEmpty()
  @IsDateString()
  festival_date: string; // Format: YYYY-MM-DD

  @IsNotEmpty()
  @IsString()
  message: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  @IsOptional()
  @IsBoolean()
  is_recurring?: boolean;
}

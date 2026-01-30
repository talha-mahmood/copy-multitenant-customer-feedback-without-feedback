import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { MonthlyStatementService } from '../monthly-statements/monthly-statement.service';

@Injectable()
export class StatementCronService {
  constructor(private readonly monthlyStatementService: MonthlyStatementService) {}

  // Run on the 1st of every month at 1:00 AM
  @Cron('0 1 1 * *')
  async generateMonthlyStatements() {
    console.log('Starting monthly statement generation...');
    
    const now = new Date();
    const lastMonth = now.getMonth() === 0 ? 12 : now.getMonth();
    const year = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();

    try {
      const result = await this.monthlyStatementService.generateAllMonthlyStatements(year, lastMonth);
      console.log('Monthly statements generated successfully:', result);
    } catch (error) {
      console.error('Error generating monthly statements:', error);
    }
  }
}

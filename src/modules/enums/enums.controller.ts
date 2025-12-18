import { Controller, Get } from '@nestjs/common';
import { getEnumValues } from '../../common/helpers/enum-fields.helper';
import { UserRole } from '../../common/enums/user-role.enum';
import { ApprovalStatus } from '../../common/enums/approval-status.enum';

@Controller('/enums/')
export class EnumsController {
  @Get('approval-status') getApprovalStatus() {
    return {
      data: getEnumValues(ApprovalStatus),
      message: 'success fetching approval-status',
    };
  }


  @Get('user-role') getUserRole() {
    return {
      data: getEnumValues(UserRole),
      message: 'success fetching user-role',
    };
  }

  @Get('document-type') getDocumentType() {
    return {
      data: getEnumValues(DocumentType),
      message: 'success fetching document types',
    };
  }
}

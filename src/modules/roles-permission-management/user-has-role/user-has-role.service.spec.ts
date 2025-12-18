import { Test, TestingModule } from '@nestjs/testing';
import { UserHasRoleService } from './user-has-role.service';

describe('UserHasRoleService', () => {
  let service: UserHasRoleService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [UserHasRoleService],
    }).compile();

    service = module.get<UserHasRoleService>(UserHasRoleService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});

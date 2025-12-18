import { Test, TestingModule } from '@nestjs/testing';
import { UserHasRoleController } from './user-has-role.controller';
import { UserHasRoleService } from './user-has-role.service';

describe('UserHasRoleController', () => {
  let controller: UserHasRoleController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserHasRoleController],
      providers: [UserHasRoleService],
    }).compile();

    controller = module.get<UserHasRoleController>(UserHasRoleController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});

import { Injectable, Inject } from "@nestjs/common";
import { Repository } from "typeorm";
import { Role } from "src/modules/roles-permission-management/roles/entities/role.entity";

@Injectable()
export class RoleHelper {
    constructor(
        @Inject('ROLE_REPOSITORY')
        private readonly roleRepository: Repository<Role>,
    ) { }
    async getNameByRoleId(roleId: number): Promise<string | null> {
        try {
            const role = await this.roleRepository.findOneBy({ id: roleId });
            return role ? role.name : null;
        } catch (error) {
            console.error('Error fetching role name by ID:', error);
            return null;
        }
    }
}

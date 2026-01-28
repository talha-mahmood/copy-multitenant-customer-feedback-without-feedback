import { Column, Entity } from 'typeorm';
import { BaseEntity } from 'src/common/entities/base.entity';

@Entity('superadmin_roles')
export class
    SuperadminRole extends BaseEntity {
    @Column({ name: 'name', type: 'varchar', length: 255 })
    name: string;

    @Column({ name: 'email', type: 'varchar', length: 255, unique: true })
    email: string;

    @Column({ name: 'phone', type: 'varchar', length: 50, nullable: true })
    phone: string;

    @Column({ name: 'password', type: 'varchar', length: 255 })
    password: string;

    @Column({
        name: 'admin_role',
        type: 'enum',
        enum: ['support_staff', 'ad_approver', 'finance_viewer'],
        default: 'support_staff'
    })
    admin_role: string;

    @Column({ name: 'is_active', type: 'boolean', default: true })
    is_active: boolean;
}

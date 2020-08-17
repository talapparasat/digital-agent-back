import { ROLES } from '@db/Role';

// Права доступа к созданию пользователей организации.
// 'роль пользователя которого необходимо создать/изменить': 'роль пользователей, у которых есть доступ на совершение операции'
export const maintainOrganizationUsersPermissions: any = {
    [ROLES.ADMIN]: [ROLES.SUPER_ADMIN],
    [ROLES.SUPERVISOR]: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
    [ROLES.OPERATOR]: [ROLES.ADMIN, ROLES.SUPER_ADMIN],
};

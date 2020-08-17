export {};

import Role, { ROLES } from '@db/Role';

Object.keys(ROLES).map(async (key) => {
    const roleName = ROLES[key];

    await new Role({
        name: roleName
    }).save();
});

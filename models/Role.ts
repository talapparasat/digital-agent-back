import { Schema, model, Document }  from 'mongoose';

import { IRole } from "@interfaces/role";

export interface IRoleModel extends IRole, Document {}

const RoleSchema: Schema = new Schema({
    name: {
        type: String,
        unique: true,
        require: true
    }
});

export default model<IRoleModel>("Role", RoleSchema);

export const ROLES: any = {
    SUPER_ADMIN: 'superadmin',
    ADMIN: 'admin',
    SUPERVISOR: 'supervisor',
    OPERATOR: 'operator',
    USER: 'user',
};

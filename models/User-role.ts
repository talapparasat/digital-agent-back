// import { Schema, model, Document }  from 'mongoose';
//
// import { IRole } from "@interfaces/role";
//
// export interface IUserRoleModel extends IRole, Document {}
//
// const UserRoleSchema: Schema = new Schema({
//     userId: {
//         type: Schema.Types.ObjectId,
//         ref: 'User',
//         required: true
//     },
//     roleId: {
//         type: Schema.Types.ObjectId,
//         ref: 'Role',
//         required: true
//     }
// });
//
// // export function getUserRole(id: string) {
// //
// // }
//
// export default model<IUserRoleModel>("User-role", UserRoleSchema);


import { createSchema, Type, ExtractProps, typedModel } from 'ts-mongoose';

import User from '@db/User'
import Role from '@db/Role'

const UserRole = createSchema({
    userId: Type.ref(Type.objectId({
        required: true
    })).to('User', User),
    roleId: Type.ref(Type.objectId({
        required: true
    })).to('Role', Role),
    suspended: Type.boolean({
        required: true,
        default: false
    })

});

export default typedModel('User-role', UserRole);

export type UserRoleProps = ExtractProps<typeof UserRole>;


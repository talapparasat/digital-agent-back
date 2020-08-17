import Organization, {OrganizationProps} from '@db/Organization';
import OrganizationServiceProviderType, {OrganizationServiceProviderTypeProps} from "@db/Organization_Service-provider-type"
import OSPT_SN from '@db/OSPT_Service-name';
import mongoose from "mongoose";
import ServiceCategory from "@db/Service-category";
import {NUMBER_OF_RESULTS_PER_PAGE} from "@config";
const ObjectId = mongoose.Types.ObjectId;


const getByPage = async (query: string, page: number) => {

    return new Promise(async (resolve, reject) => {

        try {

            const limit = NUMBER_OF_RESULTS_PER_PAGE.organization;

            const count = await Organization.find({
                nameRu: new RegExp(query, "i"),
                suspended: false
            }).countDocuments();

            let skip = Math.ceil((page - 1) * limit);

            let organizations = await Organization.aggregate([
                {
                    $match: {
                        suspended: false,
                        nameRu: new RegExp(query, "i"),
                    }
                },
                {
                    $lookup: {
                        from: 'organization_service-provider-types',
                        let: {organizationId: '$_id'},
                        pipeline: [
                            {
                                $match:
                                {
                                    $expr: {
                                        $eq: ["$organizationId", "$$organizationId"]
                                    },
                                    suspended: false
                                },
                            },
                            {
                                $lookup: {
                                    from: 'o_spt_servicenames',
                                    let: {'osptId': '$_id'},
                                    pipeline: [
                                        {
                                            $match:
                                                {
                                                    $expr: {
                                                        $eq: ["$osptId", "$$osptId"]
                                                    },
                                                    suspended: false
                                                },
                                        },

                                    ],
                                    as: 'ServiceNames'
                                }
                            },
                            {
                                $unwind: '$ServiceNames'
                            },
                            {
                                $count: "total"
                            }
                        ],
                        as: 'OSPTSN'
                    }
                },
                {
                    $unwind: {
                        path: "$OSPTSN",
                        "preserveNullAndEmptyArrays": true
                    }
                },
                {
                    $addFields: {
                        totalServiceCount: {
                            $cond: {
                                if: '$OSPTSN.total',
                                then: '$OSPTSN.total',
                                else: 0
                            }
                        },
                    }
                },
                {
                    $lookup: {
                        from: 'user-roles',
                        let: {"organizationId":"$_id"},
                        pipeline: [
                            {
                                $match: {
                                    roleId: ObjectId('5e675ff3f0bca33b84d00b7a')
                                    //       $expr: {
                                    //         $eq: ["$organizationId", "$$organizationId"]
                                    //     }
                                }
                            },
                            {
                                $addFields: {
                                    organizationId: "$$organizationId"
                                }
                            },
                            {
                                $lookup: {
                                    from: 'user-organizations',
                                    let: {"organizationId": '$organizationId', 'userId': '$userId'},
                                    pipeline: [
                                        {
                                            $match: {
                                                $expr: {
                                                    $eq: ['$organizationId', '$$organizationId']
                                                }
                                            }
                                        },
                                        {
                                            $match: {
                                                $expr: {
                                                    $eq: ['$userId', '$$userId']
                                                }
                                            }
                                        },
                                        {
                                            $lookup: {
                                                from: 'users',
                                                let: {'userId': '$userId'},
                                                pipeline: [
                                                    {
                                                        $match: {
                                                            $expr: {
                                                                $eq: ['$_id', '$$userId']
                                                            }
                                                        }
                                                    },
                                                    {
                                                        $project: {
                                                            name: 1,
                                                            email: 1
                                                        }
                                                    }
                                                ],
                                                as: 'User'
                                            }
                                        },
                                        {
                                            $unwind: {
                                                path: "$User"
                                            }
                                        }
                                    ],
                                    as: "UserOrganization"
                                }
                            },
                            {
                                $unwind: {
                                    path: '$UserOrganization'
                                }
                            },
                            {
                                $replaceRoot: {
                                    newRoot: "$UserOrganization.User"
                                }
                            }
                        ],
                        as: 'admins'
                    },
                },

                // {
                //     $lookup: {
                //         from: 'user-organizations',
                //         let: { 'organizationId': '$_id' },
                //         pipeline: [
                //             {
                //                 $match:
                //                     {
                //                         $expr: {
                //                             $eq: ["$organizationId", "$$organizationId"]
                //                         },
                //                         suspended: false
                //                     },
                //             },
                //             {
                //                 $lookup: {
                //                     from: 'users',
                //                     let: { 'userId': '$userId' },
                //                     pipeline: [
                //                         {
                //                             $match:
                //                                 {
                //                                     $expr: {
                //                                         $eq: ["$_id", "$$userId"]
                //                                     },
                //                                     suspended: false
                //                                 },
                //                         },
                //                         {
                //                             $lookup: {
                //                                 from: 'user-roles',
                //                                 let: { 'userId': '$_id' },
                //                                 pipeline: [
                //                                     {
                //                                         $match:
                //                                             {
                //                                                 $expr: {
                //                                                     $eq: ["$userId", "$$userId"]
                //                                                 },
                //                                             },
                //                                     },
                //                                     {
                //                                         $lookup: {
                //                                             from: 'roles',
                //                                             let: { 'roleId': '$roleId' },
                //                                             pipeline: [
                //                                                 {
                //                                                     $match:
                //                                                         {
                //                                                             $expr: {
                //                                                                 $eq: ["$_id", "$$roleId"]
                //                                                             },
                //                                                             name: 'admin'
                //                                                         },
                //                                                 },
                //                                                 {
                //                                                     $project: {
                //                                                         id: 0
                //                                                     }
                //                                                 }
                //
                //                                             ],
                //                                             as: 'Role'
                //                                         }
                //                                     },
                //
                //                                     {
                //                                          $match: {
                //                                             Role: {$ne: []}
                //                                         }
                //                                     }
                //
                //                                 ],
                //                                 as: 'UserRole'
                //                             }
                //                         },
                //                         {
                //                             $match: {
                //                                 UserRole: {$ne: []}
                //                             }
                //                         },
                //                         {
                //                             $project: {
                //                                 name: 1
                //                             }
                //                         }
                //                     ],
                //                     as: 'Users'
                //                 }
                //             },
                //             {
                //                 $unwind: '$Users'
                //             }
                //         ],
                //         as: 'OrganizationUsers'
                //     }
                // },
                {
                    $project: {
                        _id: 1,
                        nameKz: 1,
                        nameRu: 1,
                        image: 1,
                        totalServiceCount: 1,
                        admins: 1
                    }
                }
            ]).sort({
                nameRu: 1
            })
                .skip(skip)
                .limit(limit);
            // find({...findRequestData, suspended: false });

            return resolve({organizations, currentPage: page, total: count, pageSize: limit});

        } catch (err) {
            console.log(err);
            return reject(err);
        }

    });
};


const getByQuery = async (query: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            let organizations = await Organization.find(
                {
                    nameRu: new RegExp(query, "i"),
                    suspended: false
                })
                .sort({nameRu: 1})
                .limit(5);

            return resolve(organizations);

        } catch (err) {
            return reject(err);
        }

    });
};


const getById = async (organizationId: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            let organization = await Organization.findById(organizationId);

            return resolve(organization);

        } catch (err) {
            return reject(err);
        }

    });
};

const confirm = async (organizationId: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            let organization = await Organization.aggregate([
                {
                    $match: {
                        _id: ObjectId(organizationId)
                    }
                },
                {
                    $lookup: {
                        from: "user"
                    }
                }
            ]);

            return resolve(organization);

        } catch (err) {
            return reject(err);
        }

    });
};



const create = async ({ nameKz, nameRu, image }: OrganizationProps) => {

    return new Promise(async (resolve, reject) => {

        try {

            let newOrganization = new Organization({
                nameKz,
                nameRu,
                image
            });

            newOrganization = await newOrganization.save();

            return resolve(newOrganization);

        } catch (err) {
            return reject(err);
        }

    });
};


const put = async (organizationId: string, { nameKz, nameRu, image }: OrganizationProps) => {

    return new Promise(async (resolve, reject) => {

        try {

            let organization = await Organization.updateOne({
                _id: organizationId,
            }, {
                $set: {
                    nameKz: nameKz,
                    nameRu: nameRu,
                    image: image,
                }
            });

            return resolve(organization);

        } catch (err) {
            return reject(err);
        }

    });
};


const addServiceProviderType = async ( organizationId: string, serviceProviderTypeId: string ) => {
    return new Promise(async (resolve, reject) => {

        try {

            let newOrganizationServiceProviderType = new OrganizationServiceProviderType({
                organizationId,
                serviceProviderTypeId,
            });

            newOrganizationServiceProviderType = await newOrganizationServiceProviderType.save();

            return resolve(newOrganizationServiceProviderType);

        } catch (err) {
            return reject(err);
        }

    })
};


// const deleteServiceName = async ( organizationId: string, serviceNameId: string ) => {
//     return new Promise(async (resolve, reject) => {
//
//         try {
//
//             let newOrganizationServiceProviderType = new OrganizationServiceProviderType({
//                 organizationId,
//                 serviceProviderTypeId,
//             });
//
//             newOrganizationServiceProviderType = await newOrganizationServiceProviderType.save();
//
//             return resolve(newOrganizationServiceProviderType);
//
//         } catch (err) {
//             return reject(err);
//         }
//
//     })
// };


const addServiceNameToOrganization = async (osptId: string, serviceNameId: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            let newOSPT_SN = new OSPT_SN({
                osptId,
                serviceNameId
            });

            newOSPT_SN = await newOSPT_SN.save();

            return resolve(newOSPT_SN);

        } catch (err) {
            return reject(err);
        }

    })

};


const suspend = async (organizationId: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            let organization = await Organization.updateOne({
                _id: organizationId,
            }, {
                $set: {
                    suspended: true
                }
            });

            return resolve(organization);

        } catch (err) {
            return reject(err);
        }

    })

};


export = {
    getByPage,
    getByQuery,
    getById,
    confirm,
    create,
    put,
    suspend,
    addServiceProviderType,
    addServiceNameToOrganization
};


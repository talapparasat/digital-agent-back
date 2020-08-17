import mongoose, {Schema, Types} from "mongoose";
import fs from "fs";
import User from "@db/User";
import ServiceProviderType from "@db/Service-provider-type";
import ServiceProvider from "@db/Service-provider";
import OSPT from "@db/Organization_Service-provider-type";
import S_SP from "@db/Supervisor_Service-provider";
import Nav from '@db/Nav'
import {ROLES} from "@db/Role";
import ERROR from '@errors';
import ObjectId = Schema.Types.ObjectId;

const readXlsxFile = require('read-excel-file/node');

const importSupervisors = async (filepath: string) => {

    return new Promise(async (resolve, reject) => {

        const session = await mongoose.startSession();
        session.startTransaction();

        try {

            let rows = await readXlsxFile(__dirname + '/../../../public/' + filepath, {sheet: 1});
            // let rows = await readXlsxFile(__dirname + '../../../../public/' + filepath, {sheet: 2});

            if (rows.length <= 1) {
                return resolve({empty: true})
            }

            rows = rows.slice(1);
            // rows = [rows[1]];

            const results = await Promise.all(
                rows.map((row: any[], index: number) => connectSupervisorsWithServiceProviders(row, index, session))
            );

            await session.commitTransaction();
            session.endSession();

            return resolve(results)

        } catch (err) {

            await session.abortTransaction();
            session.endSession();

            return reject(err);

        } finally {

            await fs.unlink(__dirname + '/../../../public/' + filepath, function (err) {
                // await fs.unlink(__dirname + '../../../../public/' + filepath, function (err) {
                console.log(err)
            });

        }

    });
};


const connectSupervisorsWithServiceProviders = async (row: any, index: number, session: any) => {

    return new Promise(async (resolve, reject) => {

        try {
            index = index + 1;

            console.log({row, index});

            if (row.length != 5) {
                throw new ERROR(`Строка: ${index}\nError: Строка с неправильным количеством колонок`)
            }

            const [email, type, region, raion] = row;

            const user = await User.findOne({
                email
            });

            if (!user) {
                throw new ERROR(`Строка: ${index}\nError: Пользователь не найден`)
            }

            if (await user.getRole() !== ROLES.SUPERVISOR) {
                throw new ERROR(`Строка: ${index}\nError: Пользователь не является супервайзером`)
            }

            const organization = await user.getOrganization();

            if (!organization) {
                throw new ERROR(`Строка: ${index}\nError: Пользователь не связан с какой либо организацией`)
            }

            const serviceProviderType = await ServiceProviderType.findOne({
                nameRu: type
            });

            if (!serviceProviderType) {
                throw new ERROR(`Строка: ${index}\nError: Не найден тип услугодателя с таким названием: ${type}`)
            }

            const ospt = await OSPT.findOne({
                organizationId: organization._id,
                serviceProviderTypeId: serviceProviderType._id
            });

            if (!ospt) {
                throw new ERROR(`Строка: ${index}\nError: Указанный тип услугодателя не связан с организацией супервайзера`)
            }

            let result: any = [];

            let serviceProviderIds: ObjectId[] = [];

            if (region) {
                const regionNav = await Nav.findOne({
                    prevId: null,
                    nameRu: region
                });

                if (!regionNav) {
                    throw new ERROR(`Строка: ${index}\nError: Не найден регион с таким названием: ${region}`)
                }

                if (raion) {
                    const raionNav = await Nav.findOne({
                        prevId: regionNav._id,
                        nameRu: raion
                    });

                    if (!raionNav) {
                        throw new ERROR(`Строка: ${index}\nError: Не найден район с таким названием внутри региона ${region}`)
                    }

                    serviceProviderIds = await getServiceProviders(
                        serviceProviderType._id,
                        organization._id,
                        null,
                        raionNav._id,
                        index
                    )

                } else {
                    serviceProviderIds = await getServiceProviders(
                        serviceProviderType._id,
                        organization._id,
                        regionNav._id,
                        null,
                        index
                    );
                }

            } else {
                serviceProviderIds = await getServiceProviders(
                    serviceProviderType._id,
                    organization._id,
                    null,
                    null,
                    index
                );
            }

            if (serviceProviderIds.length)

                result = await S_SP.bulkWrite(
                    serviceProviderIds.map((serviceProviderId) => ({
                            updateOne: {
                                filter: {serviceProviderId},
                                update: {
                                    $set: {
                                        userId: user._id,
                                        serviceProviderId
                                    }
                                },
                                upsert: true,
                                session: session
                            }
                        })
                    )
                );

            return resolve(result);

        } catch (err) {
            return reject(err)
        }
    })

};


const getServiceProviders = async (serviceProviderTypeId: ObjectId, organizationId: ObjectId, regionId: ObjectId = null, raionId: ObjectId = null, index: number): Promise<ObjectId[]> => {

    return new Promise(async (resolve, reject) => {

        try {

            let navQuery = {};

            if (raionId) {
                navQuery = {
                    'navId': raionId
                }
            } else if (regionId) {
                const raionNavs = await Nav.find({prevId: regionId}, '_id');

                const raionNavIds = raionNavs.map((raionNav) => raionNav._id);

                navQuery = {
                    'navId': {
                        $in: raionNavIds
                    }
                }
            }

            const serviceProviders = await ServiceProvider.aggregate([
                {
                    '$match': {
                        'serviceProviderTypeId': serviceProviderTypeId,

                        ...navQuery
                    }
                }, {
                    '$lookup': {
                        'from': 'organization_service-providers',
                        'localField': '_id',
                        'foreignField': 'serviceProviderId',
                        'as': 'OSP'
                    }
                }, {
                    '$unwind': {
                        'path': '$OSP',
                        'preserveNullAndEmptyArrays': false
                    }
                }, {
                    '$match': {
                        'OSP.suspended': false,
                        'OSP.organizationId': organizationId
                    }
                }, {
                    '$project': {
                        '_id': 1
                    }
                }
            ]);

            const serviceProviderIds = serviceProviders.map((serviceProvider) => serviceProvider._id);

            return resolve(serviceProviderIds);

        } catch (err) {
            return reject(err);
        }

    });
};


export = {
    importSupervisors
}
import mongoose, {Schema} from "mongoose";
import fs from "fs";

import Organization from '@db/Organization';
import User from "@db/User";
import UserOrganization from "@db/User-organization";
import Role from "@db/Role";
import UserRole from "@db/User-role";
import UserPosition from "@db/User-position";
import ServiceProviderType from "@db/Service-provider-type";
import ServiceProvider from "@db/Service-provider";
import OSPT from "@db/Organization_Service-provider-type";
import OSP from "@db/Organization_Service-provider";
import O_SP from "@db/Operator_Service-provider";
import S_SP from "@db/Supervisor_Service-provider";
import Nav from '@db/Nav'
import {ROLES} from "@db/Role";
import ERROR from '@errors';
import ObjectId = Schema.Types.ObjectId;

const readXlsxFile = require('read-excel-file/node');

const importServiceProviders = async (filepath: string) => {

    return new Promise(async (resolve, reject) => {

        try {
            console.log(__dirname);
            let rows = await readXlsxFile(__dirname + '/../../../public/' + filepath, {sheet: 1});


            if (rows.length <= 1) {
                return resolve({empty: true})
            }

            rows = rows.slice(1);

            let results:any[] = [];

            for (let index = 0; index < rows.length; index++) {
                let r = await createServiceProviders(rows[index], index);
                results.push(r);
            }

            // const results = await Promise.all(
            //     rows.map((row: string[], index: number) => createServiceProviders(row, index))
            // );

            // const results = await rows.map(async (row: string[], index:number) => {
            //     await createServiceProviders(row, index)
            // });

            let success: any[] = [];
            let fails: any[] = [];

            results.forEach((result:any) => {
                if(result.status === 'success') {
                    success.push({row: result.row})
                } else {
                    fails.push({
                        row: result.row,
                        message: result.message
                    })
                }
            });

            fs.writeFileSync(__dirname + "/../../../public/temp/response.txt", JSON.stringify({success, fails}));

            return resolve({
                success,
                fails
            });

        } catch (err) {

            return reject(err);

        } finally {
            fs.unlink(__dirname + '/../../../public/' + filepath, function (err) {
                console.log(err)
            });
        }

    });
};


const createServiceProviders = async (row: any, index: number) => {

    return new Promise(async (resolve, reject) => {

        const session = await mongoose.startSession();
        session.startTransaction();

        const rowIndex = index + 2;

        try {

            let errors:string[] = [];

            if (row.length != 21) {
                throw new ERROR(`Строка: ${rowIndex}\nError: Строка с неправильным количеством колонок`)
            }

            const [nameKz, nameRu, address, organizationName, type, region, raion, coordinatesString,
                monday, tuesday, wednesday, thusday, friday, saturday, sunday,
                name, email, work, inner, mobile, position] = row;

            const duplicatedServiceProviderNameRu = await ServiceProvider.findOne({
                nameRu
            });

            if (duplicatedServiceProviderNameRu) {
                errors.push(`Строка: ${rowIndex}\nError: Услугодатель с таким названием(на русском) уже существует: ${nameRu}`);
                // throw new ERROR(`Строка: ${rowIndex}\nError: Услугодатель с таким названием(на русском) уже существует: ${nameRu}`)
            }

            const duplicatedServiceProviderNameKz = await ServiceProvider.findOne({
                nameKz
            });

            if (duplicatedServiceProviderNameKz) {
                errors.push(`Строка: ${rowIndex}\nError: Услугодатель с таким названием(на казахском) уже существует: ${nameKz}`);
                // throw new ERROR(`Строка: ${rowIndex}\nError: Услугодатель с таким названием(на казахском) уже существует: ${nameKz}`)
            }

            const organization = await Organization.findOne({
                nameRu: organizationName
            });

            if (!organization) {
                errors.push(`Строка: ${rowIndex}\nError: Нет найден организация с таким названием: ${organizationName}`);
                // throw new ERROR(`Строка: ${rowIndex}\nError: Нет найден организация с таким названием: ${organizationName}`)
            }

            const serviceProviderType = await ServiceProviderType.findOne({
                nameRu: type
            });

            if (!serviceProviderType) {
                errors.push(`Строка: ${rowIndex}\nError: Не найден тип услугодателя с таким названием: ${type}`);
                // throw new ERROR(`Строка: ${rowIndex}\nError: Не найден тип услугодателя с таким названием: ${type}`)
            }

            if(organization && serviceProviderType) {
                const ospt = await OSPT.findOne({
                    organizationId: organization._id,
                    serviceProviderTypeId: serviceProviderType._id
                });

                if (!ospt) {
                    errors.push(`Строка: ${rowIndex}\nError: Указанный тип услугодателя не связан с организацией супервайзера`);
                    // throw new ERROR(`Строка: ${rowIndex}\nError: Указанный тип услугодателя не связан с организацией супервайзера`)
                }
            }

            const regionNav = await Nav.findOne({
                nameRu: region,
                prevId: null
            });

            if (!regionNav) {
                errors.push(`Строка: ${rowIndex}\nError: Не найден регион с таким названием: ${region}`);
                // throw new ERROR(`Строка: ${rowIndex}\nError: Не найден регион с таким названием: ${region}`)
            }

            let raionNav:any;

            if(regionNav) {
                raionNav = await Nav.findOne({
                    nameRu: raion,
                    prevId: regionNav._id
                });

                if (!raionNav) {
                    errors.push(`Строка: ${rowIndex}\nError: Не найден район с названием "${raion}" внутри региона "${region}"`);
                    // throw new ERROR(`Строка: ${rowIndex}\nError: Не найден район с названием "${raion}" внутри региона "${region}"`)
                }
            }

            let coordinates;

            coordinates = parseCoordinates(coordinatesString);

            const [err, workHours] = parseWorkHours([monday, tuesday, wednesday, thusday, friday, saturday, sunday]);

            if (err) {
                errors.push(`Строка: ${rowIndex}\nError: ${err}`);
                // throw new ERROR(`Строка: ${rowIndex}\nError: ${err}`)
            }

            let user = await User.findOne({
                email
            });

            if (user) {
                errors.push(`Строка: ${rowIndex}\nError: Пользователь с такой почтой уже существует`);
                // throw new ERROR(`Строка: ${rowIndex}\nError: Пользователь с такой почтой уже существует`)
            }

            if (mobile) {
                user = await User.findOne({
                    'phone.mobile': mobile
                });

                if (user) {
                    errors.push(`Строка: ${rowIndex}\nError: Пользователь с таким номером телефона уже существует`);
                    // throw new ERROR(`Строка: ${rowIndex}\nError: Пользователь с таким номером телефона уже существует`)
                }
            }

            if (work && inner) {
                user = await User.findOne({
                    'phone.work': work,
                    'phone.inner': inner
                });

                if (user) {
                    errors.push(`Строка: ${rowIndex}\nError: Пользователь с таким номером телефона уже существует`);
                    // throw new ERROR(`Строка: ${rowIndex}\nError: Пользователь с таким номером телефона уже существует`)
                }
            }

            if(errors.length) {
                throw new ERROR(errors.join('\n'))
            }
            //
            // if (nameKz == 'Excel услугодатель1') {
            //     throw new ERROR(`Строка: ${rowIndex}\nError: My Error`)
            // }

            const newServiceProvier = new ServiceProvider({
                nameKz,
                nameRu,
                address,
                coordinates,
                workHours: workHours,
                serviceProviderTypeId: serviceProviderType._id,
                navId: raionNav._id,
                approved: true
            });

            await newServiceProvier.save({session});

            const newServiceProviderOrganization = new OSP({
                organizationId: organization._id,
                serviceProviderId: newServiceProvier._id
            });

            await newServiceProviderOrganization.save({session});

            const operatorRole = await Role.findOne({
                name: ROLES.OPERATOR
            });

            const newOperator = new User({
                name,
                email,
                phone: {
                    work,
                    inner,
                    mobile: [mobile]
                }
            });

            await newOperator.save({session});

            const newUserRole = new UserRole({
                userId: newOperator._id,
                roleId: operatorRole._id
            });

            await newUserRole.save({session});

            const newUserOrganization = new UserOrganization({
                userId: newOperator._id,
                organizationId: organization._id
            });

            await newUserOrganization.save({session});


            if (position) {
                const newUserPosition = new UserPosition({
                    userId: newOperator._id,
                    position
                });

                await newUserPosition.save({session})
            }

            const newOperatorServiceProvider = new O_SP({
                userId: newOperator._id,
                serviceProviderId: newServiceProvier._id
            });

            await newOperatorServiceProvider.save({session});

            await session.commitTransaction();
            session.endSession();

            return resolve({
                row: rowIndex,
                status: 'success'
            });

        } catch (err) {

            console.log(err);

            await session.abortTransaction();
            session.endSession();

            return resolve({
                row: rowIndex,
                status: 'fail',
                message: err.message?err.message:err
            });
        }

    });
};


const parseCoordinates = (coordinates: any): null | number[] => {

    if (typeof coordinates !== 'string') {
        return null
    }

    const [lat, long] = coordinates.split(',');

    if (lat && long) {
        const latNumber = parseFloat(lat);
        const longNumber = parseFloat(long);

        if (latNumber && longNumber) {
            return [latNumber, longNumber]
        } else {
            return null
        }

    } else {
        return null
    }

};


const parseWorkHours = (workHours: any[]): any[] => {

    let result: any[] = [];

    for (let i = 0; i < 7; i++) {

        const day = workHours[i];

        if (!day) {
            result.push({
                isWorkDay: false
            });

            continue;
        }

        if (!day.match(/^([0-1]\d|2[0-3])(?::([0-5]\d))-([0-1]\d|2[0-3])(?::([0-5]\d))$/)) {
            return ['День ' + (i + 1) + 'неправильный', null]
        }

        const [start, end] = day.split('-');

        result.push({
            start,
            end,
            isWorkDay: true
        })
    }

    return [null, result];
};


export = {
    importServiceProviders
}
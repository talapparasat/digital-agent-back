import mongoose from "mongoose";
import Field, {FieldProps} from "@db/Field";
import OSPT_Field, {OSPT_FieldProps} from "@db/OSPT_Field";
import {NUMBER_OF_RESULTS_PER_PAGE} from "@config";

const ObjectId = mongoose.Types.ObjectId;

const getAll = async (page: number, query: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            const limit = NUMBER_OF_RESULTS_PER_PAGE.field;

            const count = await Field.find({
                name: new RegExp(query, "i"),
                suspended: false
            }).count();

            let skip = Math.ceil((page - 1) * limit);

            let fields = await Field.find(
                {
                    name: new RegExp(query, "i"),
                    suspended: false
                })
                .sort({name: 1})
                .skip(skip)
                .limit(limit);

            return resolve({fields, currentPage: page, total: count, pageSize: limit});

        } catch (err) {
            return reject(err);
        }

    });

};


const getByOsptId = async (osptId: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            let fields = await OSPT_Field.aggregate([
                {
                    $match: {
                        osptId: ObjectId(osptId),
                        suspended: false
                    }
                }, {
                    $lookup: {
                        from: 'fields',
                        localField: 'fieldId',
                        foreignField: '_id',
                        as: 'Field'
                    }
                }, {
                    $unwind: '$Field'
                }, {
                    $replaceRoot: {
                        newRoot: '$Field'
                    }
                }
            ]);

            return resolve(fields)

        } catch (err) {
            return reject(err);
        }

    });

};


const getById = async (fieldId: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            let field = await Field.findById(fieldId);

            return resolve(field)

        } catch (err) {
            return reject(err);
        }

    });

};


const create = async ({name, labelKz, labelRu, type, required}: FieldProps, session: any = null) => {

    return new Promise(async (resolve, reject) => {

        try {

            const field = await Field.findOneAndUpdate({
                name
            }, {
                labelKz,
                labelRu,
                type,
                required,
                suspended: false
            }, {
                new: true,
                upsert: true,
            }).session(session);

            return resolve(field);

        } catch (err) {
            return reject(err);
        }

    });

};


const connect = async (osptId: string, fieldId: string, session: any = null) => {

    return new Promise(async (resolve, reject) => {

        try {

            const ospt_field = await OSPT_Field.findOneAndUpdate({
                osptId,
                fieldId,
            }, {
                suspended: false
            }, {
                new: true,
                upsert: true
            }).session(session);

            return resolve(ospt_field);

        } catch (err) {
            return reject(err);
        }

    });

};


const createAndConnect = async (osptId: string, {name, labelKz, labelRu, type, required}: FieldProps) => {

    return new Promise(async (resolve, reject) => {

        const session = await mongoose.startSession();
        session.startTransaction();

        try {

            let field: any = await create({name, labelKz, labelRu, type, required}, session);

            let ospt_field = await connect(osptId, field._id, session);

            await session.commitTransaction();
            session.endSession();

            return resolve({field, ospt_field})

        } catch (err) {
            await session.abortTransaction();
            session.endSession();

            return reject(err);
        }

    });

};


const update = async (fieldId: string, {name, labelKz, labelRu, type, required}: FieldProps) => {

    return new Promise(async (resolve, reject) => {

        try {

            const field = await Field.findByIdAndUpdate(
                fieldId,
                {
                    name,
                    labelKz,
                    labelRu,
                    type,
                    required,
                }, {
                    new: true,
                });

            return resolve(field);

        } catch (err) {
            return reject(err);
        }

    });

};


const suspendConnection = async (osptId: string, fieldId: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            let field = await OSPT_Field.findOneAndUpdate({
                fieldId,
                osptId
            }, {
                suspended: true
            }, {new: true});

            return resolve(field)

        } catch (err) {
            return reject(err);
        }

    });

};

const suspend = async (fieldId: string) => {

    return new Promise(async (resolve, reject) => {

        const session = await mongoose.startSession();
        session.startTransaction();

        try {

            let field = await Field.findByIdAndUpdate(fieldId,
                {
                    suspended: true
                }).session(session);


            let ospt_fields = await OSPT_Field.updateMany({
                fieldId
            }, {
                $set: {
                    suspended: true
                }
            }).session(session);


            await session.commitTransaction();
            session.endSession();

            return resolve({field, ospt_fields})

        } catch (err) {
            await session.abortTransaction();
            session.endSession();

            return reject(err);
        }

    });

};


export = {
    getAll,
    getByOsptId,
    getById,

    create,
    connect,
    createAndConnect,

    update,

    suspendConnection,
    suspend
}
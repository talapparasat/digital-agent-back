import mongoose, {Types} from 'mongoose'

const Excel = require('excel4node');

import Nav from '@db/Nav'
import ServiceProviderType from "@db/Service-provider-type";
import ServiceProvider from "@db/Service-provider";
import ServiceCategory from "@db/Service-category";
import analyticsController from "@controllers/analytics";

const ObjectId = Types.ObjectId;


const getAnalytics = async (regionId: string, raionId: string, period: string, dateFrom: string, dateTo: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            const workbook = new Excel.Workbook();
            const ws = workbook.addWorksheet('Общие показатели');

            var style = workbook.createStyle({
                alignment: {},
            });

            var styleCenter = workbook.createStyle({
                alignment: {horizontal: 'center'},
            });

            ws.column(1).setWidth(24);
            ws.column(2).setWidth(24);
            ws.column(3).setWidth(20);
            ws.column(4).setWidth(16);
            ws.column(5).setWidth(10.5);
            ws.column(6).setWidth(12.7);
            ws.column(7).setWidth(11);
            ws.column(8).setWidth(11);
            ws.column(9).setWidth(11);
            ws.column(10).setWidth(11);
            ws.column(11).setWidth(11);
            ws.column(12).setWidth(11);
            ws.column(13).setWidth(11);
            ws.column(14).setWidth(18);

            ws.cell(1, 1, 2, 1, true)
                .string('Область')
                .style(style);
            ws.cell(1, 2, 2, 2, true)
                .string('Регион')
                .style(style);
            ws.cell(1, 3, 2, 3, true)
                .string('Период')
                .style(style);

            ws.cell(1, 4, 1, 6, true)
                .string('Отзывы')
                .style(styleCenter);
            ws.cell(2, 4)
                .string('Всего обращений')
                .style(style);
            ws.cell(2, 5)
                .string('Активные')
                .style(style);
            ws.cell(2, 6)
                .string('Завершенные')
                .style(style);

            if (regionId) {
                let regionNav = await Nav.findById(regionId);

                if (regionNav) {
                    ws.cell(3, 1)
                        .string(regionNav.nameRu)
                        .style(style);
                }
            }

            if (raionId) {
                let raionNav = await Nav.findById(raionId);

                if (raionNav) {
                    ws.cell(3, 2)
                        .string(raionNav.nameRu)
                        .style(style);
                }
            }

            const categories = await getCategoriesRating(regionId, raionId, period, dateFrom, dateTo);
            let total = 0;

            ws.cell(1, 7, 1, 7 + categories.length, true)
                .string('Категорий отзывов')
                .style(styleCenter  );

            categories.map((category, index) => {
                ws.cell(2, 7 + index)
                    .string(category.name)
                    .style(style);

                ws.cell(3, 7 + index)
                    .number(category.total)
                    .style(styleCenter);

                total += category.total
            });

            ws.cell(2, 7 + categories.length)
                .string('Общее количество')
                .style(style);

            ws.cell(3, 7 + categories.length)
                .number(total)
                .style(styleCenter);

            const timePeriod = getPeriod(period, dateFrom, dateTo);

            let periodString = '';

            if (timePeriod[0] && timePeriod[1]) {
                periodString =
                    timePeriod[0].getDate().toString().padStart(2, '0') + '.' +
                    (timePeriod[0].getMonth() + 1).toString().padStart(2, '0') + '.' +
                    timePeriod[0].getFullYear() +
                    '-' +
                    timePeriod[1].getDate().toString().padStart(2, '0') + '.' +
                    (timePeriod[1].getMonth() + 1).toString().padStart(2, '0') + '.' +
                    timePeriod[1].getFullYear()
            } else {
                periodString = 'до ' +
                    timePeriod[1].getDate().toString().padStart(2, '0') + '.' +
                    (timePeriod[1].getMonth() + 1).toString().padStart(2, '0') + '.' +
                    timePeriod[1].getFullYear()
            }

            ws.cell(3, 3)
                .string(periodString)
                .style(style);

            const reviewsCount: any = await analyticsController.getReviewsCount(regionId, raionId);

            ws.cell(3, 4)
                .number(reviewsCount.all)
                .style(styleCenter);
            ws.cell(3, 5)
                .number(reviewsCount.inProcess)
                .style(styleCenter);
            ws.cell(3, 6)
                .number(reviewsCount.resolved)
                .style(styleCenter);


            const ws1 = workbook.addWorksheet('Рейтинг регионов');

            ws1.column(1).setWidth(21.5);
            ws1.column(2).setWidth(30);
            ws1.column(3).setWidth(19);
            ws1.column(4).setWidth(21);

            const regionsRating:any = await getRegionsRating(period, dateFrom, dateTo);

            ws1.cell(1, 1)
                .string('Период')
                .style(styleCenter);

            ws1.cell(1, 2)
                .string('Регион')
                .style(styleCenter);

            ws1.cell(1, 3)
                .string('Количество отзывов')
                .style(styleCenter);

            ws1.cell(1, 4)
                .string('Средний рейтинг')
                .style(styleCenter);

            regionsRating.map((region: any, index:number) => {
                ws1.cell(index+2, 1)
                    .string(periodString)
                    .style(style);

                ws1.cell(index+2, 2)
                    .string(region.nameRu)
                    .style(style);

                ws1.cell(index+2, 3)
                    .number(region.total)
                    .style(style);

                ws1.cell(index+2, 4)
                        .number(region.rate)
                    .style(style);
            });


            const ws2 = workbook.addWorksheet('Рейтинг районов');

            ws2.column(1).setWidth(21.5);
            ws2.column(2).setWidth(30);
            ws2.column(3).setWidth(30);
            ws2.column(4).setWidth(19);
            ws2.column(5).setWidth(21);

            const raionsRating:any = await getRaionsRating(period, dateFrom, dateTo);

            ws2.cell(1, 1)
                .string('Период')
                .style(styleCenter);

            ws2.cell(1, 2)
                .string('Район')
                .style(styleCenter);

            ws2.cell(1, 3)
                .string('Регион')
                .style(styleCenter);

            ws2.cell(1, 4)
                .string('Количество отзывов')
                .style(styleCenter);

            ws2.cell(1, 5)
                .string('Средний рейтинг')
                .style(styleCenter);

            raionsRating.map((raion: any, index:number) => {
                ws2.cell(index+2, 1)
                    .string(periodString)
                    .style(style);

                ws2.cell(index+2, 2)
                    .string(raion.nameRu)
                    .style(style);

                ws2.cell(index+2, 3)
                    .string(raion.region)
                    .style(style);

                ws2.cell(index+2, 4)
                    .number(raion.total)
                    .style(style);

                ws2.cell(index+2, 5)
                    .number(raion.rate)
                    .style(style);
            });




            const ws3 = workbook.addWorksheet('Рейтинг услуг');

            ws3.column(1).setWidth(21.5);
            ws3.column(2).setWidth(110);
            ws3.column(3).setWidth(19);
            ws3.column(4).setWidth(21);

            const servicesRating:any = await getServicesRating(period, dateFrom, dateTo);

            ws3.cell(1, 1)
                .string('Период')
                .style(styleCenter);

            ws3.cell(1, 2)
                .string('Услуга')
                .style(styleCenter);

            ws3.cell(1, 3)
                .string('Количество отзывов')
                .style(styleCenter);

            ws3.cell(1, 4)
                .string('Средний рейтинг')
                .style(styleCenter);

            servicesRating.map((service: any, index:number) => {
                ws3.cell(index+2, 1)
                    .string(periodString)
                    .style(style);

                ws3.cell(index+2, 2)
                    .string(service.nameRu)
                    .style(style);

                ws3.cell(index+2, 3)
                    .number(service.total)
                    .style(style);

                ws3.cell(index+2, 4)
                    .number(service.rate)
                    .style(style);
            });


            return resolve(workbook)

        } catch (err) {
            return reject(err);
        }

    });

};


const getCategoriesRating = async (regionId: string, raionId: string, period: string, dateFrom: string, dateTo: string): Promise<any[]> => {

    return new Promise(async (resolve, reject) => {

        try {

            const serviceProviderType = await ServiceProviderType.findOne({
                nameRu: "ЦЗН"
            });

            const dateQuery = getDateQuery(period, dateFrom, dateTo);

            let raionQuery: any = {}, regionQuery: any[] = [];

            if (regionId) {
                regionQuery = [
                    {
                        '$lookup': {
                            'from': 'navs',
                            'localField': 'navId',
                            'foreignField': '_id',
                            'as': 'Raion'
                        }
                    }, {
                        '$unwind': {
                            'path': '$Raion',
                            'preserveNullAndEmptyArrays': false
                        }
                    }, {
                        '$match': {
                            'Raion.prevId': new ObjectId(regionId)
                        }
                    }
                ]
            }

            if (raionId) {
                raionQuery = {
                    navId: new ObjectId(raionId)
                }
            }

            const avgRatingPerGroup = await ServiceProvider.aggregate([
                {
                    '$match': {
                        'serviceProviderTypeId': serviceProviderType._id,
                        'suspended': false,
                        ...raionQuery
                    }
                },
                ...regionQuery,
                {
                    '$lookup': {
                        'from': 'reviews',
                        'localField': '_id',
                        'foreignField': 'serviceProviderId',
                        'as': 'Review'
                    }
                }, {
                    '$unwind': {
                        'path': '$Review',
                        'preserveNullAndEmptyArrays': false
                    }
                }, {
                    '$replaceRoot': {
                        'newRoot': '$Review'
                    }
                }, {
                    '$match': {
                        ...dateQuery
                    }
                }, {
                    '$group': {
                        '_id': '$rate',
                        'total': {
                            '$sum': 1
                        }
                    }
                }
            ]);

            const result = mapCategoryResult(avgRatingPerGroup);

            return resolve(result)

        } catch (err) {
            return reject(err);
        }

    });
};


const getDateQuery = (period: string, dateFromString: string, dateToString: string, root = true) => {

    let dateFrom: Date, dateTo: Date;

    const fieldName = root?'createdAt':'Review.createdAt';

    switch (period) {
        case 'today':
            dateFrom = new Date();
            dateFrom.setDate(dateFrom.getDate() - 1);
            break;
        case 'week':
            dateFrom = new Date();
            dateFrom.setDate(dateFrom.getDate() - 7);
            break;
        case 'month':
            dateFrom = new Date();
            dateFrom.setMonth(dateFrom.getMonth() - 1);
            break;
        case 'year':
            dateFrom = new Date();
            dateFrom.setFullYear(dateFrom.getFullYear() - 1);
            break;
        case 'all':
            break;
        case 'period':
            dateFrom = new Date(dateFromString);
            dateTo = new Date(dateToString);
            break;
        default:
            dateFrom = new Date();
            dateFrom.setDate(dateFrom.getDate() - 7);
            break;
    }

    let dateQuery: any = {};

    if (dateFrom && dateTo) {
        dateQuery = {
            '$and': [
                {
                    [fieldName]: {
                        '$gt': dateFrom
                    }
                },
                {
                    [fieldName]: {
                        '$lt': dateTo
                    }
                }
            ]
        }
    } else if (dateFrom) {
        dateQuery = {
            [fieldName]: {
                '$gt': dateFrom
            }
        }
    }

    return dateQuery;

};

const getPeriod = (period: string, dateFromString: string, dateToString: string) => {
    let dateFrom: Date, dateTo: Date;

    switch (period) {
        case 'today':
            dateFrom = new Date();
            dateFrom.setDate(dateFrom.getDate() - 1);

            dateTo = new Date();
            break;
        case 'week':
            dateFrom = new Date();
            dateFrom.setDate(dateFrom.getDate() - 7);
            dateTo = new Date();
            break;
        case 'month':
            dateFrom = new Date();
            dateFrom.setMonth(dateFrom.getMonth() - 1);
            dateTo = new Date();
            break;
        case 'year':
            dateFrom = new Date();
            dateFrom.setFullYear(dateFrom.getFullYear() - 1);
            dateTo = new Date();
            break;
        case 'all':
            dateTo = new Date();
            break;
        case 'period':
            dateFrom = new Date(dateFromString);
            dateTo = new Date(dateToString);
            break;
        default:
            dateFrom = new Date();
            dateFrom.setDate(dateFrom.getDate() - 7);
            dateTo = new Date();
            break;
    }

    return [dateFrom, dateTo];
};



const getRaionsRating = async (period: string, dateFrom: string, dateTo: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            const serviceProviderType = await ServiceProviderType.findOne({
                nameRu: "ЦЗН"
            });

            const dateQuery = getDateQuery(period, dateFrom, dateTo, false);

            const raions = await ServiceProvider.aggregate([
                {
                    '$match': {
                        'serviceProviderTypeId': serviceProviderType._id,
                        'suspended': false
                    }
                }, {
                    '$lookup': {
                        'from': 'reviews',
                        'localField': '_id',
                        'foreignField': 'serviceProviderId',
                        'as': 'Review'
                    }
                }, {
                    '$unwind': {
                        'path': '$Review',
                        'preserveNullAndEmptyArrays': true
                    }
                }, {
                    '$match': {
                        ...dateQuery
                    }
                }, {
                    '$group': {
                        '_id': '$navId',
                        'rate': {
                            '$avg': '$rate'
                        },
                        'total': {
                            '$sum': '$reviewCount'
                        }
                    }
                }, {
                    '$lookup': {
                        'from': 'navs',
                        'localField': '_id',
                        'foreignField': '_id',
                        'as': 'Raion'
                    }
                }, {
                    '$unwind': {
                        'path': '$Raion',
                        'preserveNullAndEmptyArrays': false
                    }
                }, {
                    '$addFields': {
                        'Raion.rate': '$rate',
                        'Raion.total': '$total'
                    }
                }, {
                    '$replaceRoot': {
                        'newRoot': '$Raion'
                    }
                }, {
                    '$lookup': {
                        'from': 'navs',
                        'localField': 'prevId',
                        'foreignField': '_id',
                        'as': 'Region'
                    }
                }, {
                    '$unwind': {
                        'path': '$Region',
                        'preserveNullAndEmptyArrays': false
                    }
                }, {
                    '$project': {
                        'nameKz': 1,
                        'nameRu': 1,
                        'region': '$Region.nameRu',
                        'rate': 1,
                        'total': 1
                    }
                }, {
                    '$sort': {
                        'region': 1,
                        'nameRu': 1
                    }
                }
            ]);

            return resolve(raions)

        } catch (err) {
            return reject(err);
        }

    });
};


const getRegionsRating = async (period: string, dateFrom: string, dateTo: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            const serviceProviderType = await ServiceProviderType.findOne({
                nameRu: "ЦЗН"
            });

            const dateQuery = getDateQuery(period, dateFrom, dateTo, false);

            const regions = await ServiceProvider.aggregate([
                {
                    '$match': {
                        'serviceProviderTypeId': serviceProviderType._id,
                        'suspended': false
                    }
                }, {
                    '$lookup': {
                        'from': 'reviews',
                        'localField': '_id',
                        'foreignField': 'serviceProviderId',
                        'as': 'Review'
                    }
                }, {
                    '$unwind': {
                        'path': '$Review',
                        'preserveNullAndEmptyArrays': true
                    }
                }, {
                    '$match': {
                        ...dateQuery
                    }
                }, {
                    '$group': {
                        '_id': '$navId',
                        'rate': {
                            '$avg': '$rate'
                        },
                        'total': {
                            '$sum': '$reviewCount'
                        }
                    }
                }, {
                    '$lookup': {
                        'from': 'navs',
                        'localField': '_id',
                        'foreignField': '_id',
                        'as': 'Raion'
                    }
                }, {
                    '$unwind': {
                        'path': '$Raion',
                        'preserveNullAndEmptyArrays': false
                    }
                }, {
                    '$addFields': {
                        'Raion.rate': '$rate',
                        'Raion.total': '$total'
                    }
                }, {
                    '$replaceRoot': {
                        'newRoot': '$Raion'
                    }
                }, {
                    '$group': {
                        '_id': '$prevId',
                        'rate': {
                            '$avg': '$rate'
                        },
                        'total': {
                            '$sum': '$total'
                        }
                    }
                }, {
                    '$lookup': {
                        'from': 'navs',
                        'localField': '_id',
                        'foreignField': '_id',
                        'as': 'Region'
                    }
                }, {
                    '$unwind': {
                        'path': '$Region',
                        'preserveNullAndEmptyArrays': false
                    }
                }, {
                    '$addFields': {
                        'Region.rate': '$rate',
                        'Region.total': '$total'
                    }
                }, {
                    '$replaceRoot': {
                        'newRoot': '$Region'
                    }
                }, {
                    '$project': {
                        'nameKz': 1,
                        'nameRu': 1,
                        'rate': 1,
                        'total': 1
                    }
                }, {
                    '$sort': {
                        'nameRu': 1
                    }
                }
            ]);

            return resolve(regions)

        } catch (err) {
            return reject(err);
        }

    });
};

const getServicesRating = async (period: string, dateFrom: string, dateTo: string) => {

    return new Promise(async (resolve, reject) => {

        try {

            const serviceProviderType = await ServiceProviderType.findOne({
                nameRu: "ЦЗН"
            });

            const dateQuery = getDateQuery(period, dateFrom, dateTo);

            console.log({dateQuery});

            const services = await ServiceProvider.aggregate([
                {
                    '$match': {
                        'serviceProviderTypeId': serviceProviderType._id,
                        'suspended': false
                    }
                }, {
                    '$lookup': {
                        'from': 'reviews',
                        'localField': '_id',
                        'foreignField': 'serviceProviderId',
                        'as': 'Reviews'
                    }
                }, {
                    '$unwind': {
                        'path': '$Reviews',
                        'preserveNullAndEmptyArrays': false
                    }
                },  {
                    '$replaceRoot': {
                        'newRoot': '$Reviews'
                    }
                }, {
                    '$match': {
                        ...dateQuery
                    }
                }, {
                    '$lookup': {
                        'from': 'service-names',
                        'localField': 'serviceNameId',
                        'foreignField': '_id',
                        'as': 'Service'
                    }
                }, {
                    '$unwind': {
                        'path': '$Service',
                        'preserveNullAndEmptyArrays': false
                    }
                }, {
                    '$addFields': {
                        'Service.rate': '$rate'
                    }
                }, {
                    '$replaceRoot': {
                        'newRoot': '$Service'
                    }
                }, {
                    '$group': {
                        '_id': '$_id',
                        'nameKz': {
                            '$first': '$nameKz'
                        },
                        'nameRu': {
                            '$first': '$nameRu'
                        },
                        'rate': {
                            '$avg': '$rate'
                        },
                        'total': {
                            '$sum': 1
                        }
                    }
                }, {
                    '$sort': {
                        'nameRu': 1
                    }
                }
            ]);

            return resolve(services)

        } catch (err) {
            return reject(err);
        }

    });
};

const mapCategoryResult = (aggResult:any[]) => {

    let result:any = [
        {
            name: 'Категория 1',
            rating: 5,
            total: 0
        },
        {
            name: 'Категория 2',
            rating: 5,
            total: 0
        },
        {
            name: 'Категория 3',
            rating: 5,
            total: 0
        },
        {
            name: 'Категория 4',
            rating: 4,
            total: 0
        },
        {
            name: 'Категория 5',
            rating: 3,
            total: 0
        },
        {
            name: 'Категория 6',
            rating: 2,
            total: 0
        },
        {
            name: 'Категория 7',
            rating: 1,
            total: 0
        }
    ];

    aggResult.map((item) => {

        for(let i = 0; i < 7; i++) {
            if(item._id == result[i].rating) {
                result[i].total = item.total
            }
        }

    });

    return result;

};

export = {
    getAnalytics
}
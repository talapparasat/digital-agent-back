import express from 'express';
import statisticsController from "@controllers/statistics";
import statisticsControllerSupervisor from "@controllers/statistics/supervisor";
import statisticsControllerOperator from "@controllers/statistics/operator";
import analyticsController from "@controllers/analytics";


// import {
//
// } from './validators'

// import  {
//
// } from './middlewares'

const router = express.Router();

router.get('/', async (req: any, res: any) => {

    try {

        const {regionId, raionId, period} = req.query;
        const {dateFrom, dateTo} = req.query;
        let categoriesRatingPromise;
        switch (period) {
            case 'today':
                categoriesRatingPromise = analyticsController.getCategoriesRatingToday(regionId, raionId);
                break;
            case 'week':
                categoriesRatingPromise = analyticsController.getCategoriesRatingWeek(regionId, raionId);
                break;
            case 'month':
                categoriesRatingPromise = analyticsController.getCategoriesRatingMonth(regionId, raionId);
                break;
            case 'year':
                categoriesRatingPromise = analyticsController.getCategoriesRatingYear(regionId, raionId);
                break;
            case 'all':
                categoriesRatingPromise = analyticsController.getCategoriesRatingAll(regionId, raionId);
                break;
            case 'period':
                categoriesRatingPromise = analyticsController.getCategoriesRatingPeriod(regionId, raionId, dateFrom, dateTo);
                break;
            default:
                categoriesRatingPromise = analyticsController.getCategoriesRatingWeek(regionId, raionId);
                break;
        }

        const [
            reviewsCount,
            raionsRating,
            regionsRating,
            servicesRating,
            categoriesRating,
            social
        ] = await Promise.all([
            analyticsController.getReviewsCount(regionId, raionId),
            analyticsController.getRaionsRating(),
            analyticsController.getRegionsRating(),
            analyticsController.getServicesRating(),
            categoriesRatingPromise,
            analyticsController.social()
        ]);


        res.status(200).send({
            reviewsCount,
            raionsRating,
            regionsRating,
            servicesRating,
            categoriesRating,
            social
        });

    } catch (err) {
        console.log(err.message);
        res.status(400).send(err);
    }

});

export default router;
import express from 'express'

import reviewController from '@controllers/review'
import serviceProviderController from '@controllers/service-provider'
import serviceProviderTypeController from '@controllers/service-provider-type'
import historyController from '@controllers/history'
import userController from '@controllers/user'
import {STATUSES} from "@db/Review";

import {
    pagination
} from './middlewares'
import profileController from "@controllers/profile";
import {NUMBER_OF_RESULTS_PER_PAGE} from "@config";

const router = express.Router();


router.get('/', async (req: any, res: any) => {
    try {

        const user = req.user;

        const userName = user.name;

        const serviceProvider = await user.getServiceProvider();

        const serviceProviderType = await serviceProviderTypeController.getById(serviceProvider.serviceProviderTypeId);

        const inProcessCount = await reviewController.getReviewCountByStatus([STATUSES.SENT_TO_OPERATOR, STATUSES.SENT_TO_SUPERVISOR], serviceProvider._id);

        const resolvedCount = await reviewController.getReviewCountByStatus([STATUSES.RESOLVED], serviceProvider._id);

        const inProcessReviews = await reviewController.getLastReviewsByStatus([STATUSES.SENT_TO_OPERATOR, STATUSES.SENT_TO_SUPERVISOR], serviceProvider._id);

        const resolvedReviews = await reviewController.getLastReviewsByStatus([STATUSES.RESOLVED], serviceProvider._id);

        res.status(200).send({
            userName,
            serviceProvider: {
                nameRu: serviceProvider.nameRu,
                nameKz: serviceProvider.nameKz,
                rate: serviceProvider.rate,
                serviceProviderType
            },
            total: {
                inProcess: inProcessCount,
                resolved: resolvedCount
            },
            reviews: {
                inProcessReviews,
                resolvedReviews
            }
        })

    } catch (err) {
        console.log(err);
        res.status(400).send(err.message)
    }
});


router.get('/rating', async (req: any, res: any) => {
    try {

        const user = req.user;
        let interval = req.query['interval'];

        try {
            interval = parseInt(interval)
        } catch (e) {
            interval = 1
        }

        const serviceProvider = await user.getServiceProvider();

        const totalReviews = await serviceProviderController.getTotalReviews(serviceProvider._id);

        const ratesCount = await serviceProviderController.getRatesCountByGroup(serviceProvider._id);

        const organizationId = await serviceProviderController.getOrganization(serviceProvider._id);

        // const topServiceProviders = await serviceProviderController.getTopServiceProvidersByPeriod(serviceProvider.serviceProviderTypeId, organizationId.toString());

        const avgRatingsPerDayOfWeek = await serviceProviderController.getServiceProviderAverageRatingByTimeInterval(serviceProvider._id, 0);
        const avgRatingsPerDayOfMonth = await serviceProviderController.getServiceProviderAverageRatingByTimeInterval(serviceProvider._id, 1);
        const avgRatingsPerMonthOfYear = await serviceProviderController.getServiceProviderAverageRatingByTimeInterval(serviceProvider._id, 2);

        const topServiceProviders = await serviceProviderController.getTopServiceProvidersByOrganizationAndTypeId(serviceProvider.serviceProviderTypeId, organizationId.toString());

        res.status(200).send({
            rate: serviceProvider.rate,
            totalReviews: totalReviews,
            ratesCountByGroup: ratesCount,
            avgRatingsPerTimeInterval: {
                weeklyRating: avgRatingsPerDayOfWeek,
                monthlyRating: avgRatingsPerDayOfMonth,
                yearlyRating: avgRatingsPerMonthOfYear
            },
            topServiceProviders
        })

    } catch (err) {
        console.log(err);
        res.status(400).send(err.message)
    }
});


router.get('/reviews', pagination, async (req: any, res: any) => {
    try {

        const user = req.user;

        const page = req.query['page'];
        const status = req.query['status'];

        const serviceProvider = await user.getServiceProvider();

        let statusArr:any;

        switch (status) {
            case 'inProcess':
                statusArr = [STATUSES.SENT_TO_OPERATOR, STATUSES.SENT_TO_SUPERVISOR];
                break;

            case 'resolved':
                statusArr = [STATUSES.RESOLVED];
                break;
            default:
                res.status(200).send({
                    reviews: [],
                    pageSize: NUMBER_OF_RESULTS_PER_PAGE.reviews,
                    total: 0,
                    currentPage: 1
                });
                return;
        }

        let reviews = await reviewController.getReviewsOfServiceProviderByStatus(serviceProvider._id, statusArr, page);

        res.status(200).send(reviews)

    } catch (err) {
        console.log(err);
        res.status(400).send(err.message)
    }
});


router.get('/profile', async (req: any, res: any) => {

    try {

        const reqUser = req.user;

        const user = await profileController.get(req.user._id);

        const serviceProvider = await reqUser.getServiceProvider();

        const contactPersons = await userController.getContactPersonsOfServiceProvider(serviceProvider._id);

        res.status(200).send({user, contactPersons});

    } catch (err) {
        console.log(err.message);
        res.status(400).send(err);
    }

});


router.get('/history', pagination, async (req: any, res: any) => {

    try {

        let user = req.user;
        const page = req.query['page'];

        const history = await historyController.getContactPersonHistory(user._id, page);

        res.status(200).send(history);

    } catch (err) {
        console.log(err.message);
        res.status(400).send(err);
    }

});



export default router;
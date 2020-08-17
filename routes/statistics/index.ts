import express from 'express';
import statisticsController from "@controllers/statistics";
import statisticsControllerSupervisor from "@controllers/statistics/supervisor";
import statisticsControllerOperator from "@controllers/statistics/operator";


// import {
//
// } from './validators'

// import  {
//
// } from './middlewares'

const router = express.Router();

router.get('/', async (req: any, res: any) => {

    try {

        // const usersCountByRole =  statisticsController.getUsersCountByRole();
        // const serviceProvidersCount =  statisticsController.getServiceProvidersCount();
        // const organizationsCount =  statisticsController.getOrganizationCount();
        // const reviewsCount =  statisticsController.getReviewsCount();
        // const serviceProvidersByRegion =  statisticsController.getTotalServiceProvidersByRegions();
        // const totalReviewsByRegions =  statisticsController.getTotalReviewCountByRegions();
        // const avgRate =  statisticsController.getAverageRating();

        const [
            usersCountByRole,
            serviceProvidersCount,
            organizationsCount,
            reviewsCount,
            serviceProvidersByRegion,
            totalReviewsByRegions,
            avgRate] = await Promise.all([
                statisticsController.getUsersCountByRole(),
                statisticsController.getServiceProvidersCount(),
                statisticsController.getOrganizationCount(),
                statisticsController.getReviewsCount(),
                statisticsController.getTotalServiceProvidersByRegions(),
                statisticsController.getTotalReviewCountByRegions(),
                statisticsController.getAverageRating()
        ]);


        res.status(200).send({
            usersCountByRole,
            serviceProvidersCount,
            organizationsCount,
            reviewsCount,
            serviceProvidersByRegion,
            totalReviewsByRegions,
            avgRate
        });

    } catch (err) {
        console.log(err.message);
        res.status(400).send(err);
    }

});


router.get('/supervisor', async (req: any, res: any) => {

    try {

        let user = req.user;

        // let serviceProvider = await user.getServiceProvider();

        console.log(user._id);

        const usersCountByRole = await statisticsControllerSupervisor.getUsersCountByRole(user._id);
        const serviceProvidersCount = await statisticsControllerSupervisor.getServiceProvidersCount(user._id);
        const reviewsCount = await statisticsControllerSupervisor.getReviewsCount(user._id);
        const serviceProvidersByRegion = await statisticsControllerSupervisor.getTotalServiceProvidersByRegions(user._id);

        console.log("Before");
        const totalReviewsByRegions = await statisticsControllerSupervisor.getTotalReviewCountByRegions(user._id);
        console.log("After");
        const avgRate = await statisticsControllerSupervisor.getAverageRating(user._id);


        res.status(200).send({
            usersCountByRole,
            serviceProvidersCount,
            reviewsCount,
            serviceProvidersByRegion,
            totalReviewsByRegions,
            avgRate
        });


    } catch (err) {
        console.log(err.message);
        res.status(400).send(err);
    }

});


router.get('/contact-person', async (req: any, res: any) => {

    try {

        let user = req.user;

        let serviceProvider = await user.getServiceProvider();

        const usersCountByRole = await statisticsControllerOperator.getUsersCountByRole(serviceProvider);
        const reviewsCount = await statisticsControllerOperator.getReviewsCount(serviceProvider);
        const avgRate = await statisticsControllerOperator.getAverageRating(serviceProvider);


        res.status(200).send({
            usersCountByRole,
            reviewsCount,
            avgRate
        });


    } catch (err) {
        console.log(err.message);
        res.status(400).send(err);
    }

});

export default router;
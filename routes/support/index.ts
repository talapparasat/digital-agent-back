import express from 'express';
import bus from '@modules/bus'

const router = express.Router();

router.post('/', async (req: any, res: any) => {

    try {

        let {message} = req.body;

        bus.emit('event.problem.message.written', {
            message,
            ...req.user?{
                name: req.user.name,
                email: req.user.email,
                phone: req.user.phone
            }:{}
        });

        res.status(200).send({success: true});

    } catch (err) {
        console.log(err);
        res.status(400).send(err);
    }

});

export default router;



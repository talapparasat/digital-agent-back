import express from 'express';
import multer from "multer";

import authController from '@controllers/auth';
import { uploadFile } from './middleware'
import { passwordResetDataValidator, signUpDataValidator } from './validators'


const storage = multer.memoryStorage();
const multerUpload = multer({storage: storage});


const router = express.Router();


router.post('/signup', signUpDataValidator, async (req: any, res: any) => {

	try {

		const userAuthJson = await authController.signUp({
			name: req.body.name,
			email: req.body.email,
			password: req.body.password,
			phone: req.body.phone,
			token: req.body.token
		});

		res.status(200).send(userAuthJson);

	} catch (err) {

		console.log("Awdawde", err);

		res.status(400).send(err);
	}

});


router.post('/signup/email', multerUpload.single('image'), uploadFile, async (req: any, res: any) => {

	try {

		const userAuthJson = await authController.signUpWithEmail({
			email: req.body.email,
			token: req.body.token
		});

		res.status(200).send(userAuthJson);

	} catch (err) {
		res.status(400).send(err.message);
	}

});


router.post('/signup/phone', async (req: any, res: any) => {

	try {

		const userAuthJson = await authController.signUpWithPhone({
			phone: req.body.phone,
			token: req.body.token
		});

		res.status(200).send(userAuthJson);

	} catch (err) {
		res.status(400).send(err);
	}

});


router.post('/signin', async (req: any, res: any) => {

	try {
		const userAuthJson = await authController.signIn({
			email: req.body.email,
			password: req.body.password
		});

		res.status(200).send(userAuthJson);

	} catch (err) {
		console.log(err);
		res.status(400).send(err);
	}
});


router.post('/signin/no-password', async (req: any, res: any) => {

	try {
		const userAuthJson = await authController.signInNoPassword(req.body.email, req.body.phone);

		res.status(200).send(userAuthJson);

	} catch (err) {
		console.log(err);
		res.status(400).send(err);
	}
});

router.post('/reset', ...passwordResetDataValidator, async (req: any, res: any) => {

	try {

		await authController.reset({
			email: req.body.email,
		});

		res.status(200).send({success: true})//'Ваш новый пароль был отправлен на вашу почту'});

	} catch (err) {
		console.log(err);
		res.status(400).send(err);
	}
});



export default router;


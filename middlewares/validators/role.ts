import ERROR, {authErrors} from '@errors';

export default (...allowedRoles: string[]) => {

	const isAllowed = (roles: string[]) => roles.filter(element => allowedRoles.includes(element)).length > 0;

	return (req: any, res: any, next: any) => {
		if (!req.user) {
			return res.status(401).send(new ERROR(authErrors.AUTHENTICATION_REQUIRED));
		}

		if (isAllowed(req.user.roles)) {
			return next();
		}

		res.status(404).send(new ERROR(authErrors.PERMISSION_REQUIRED));
	}
}

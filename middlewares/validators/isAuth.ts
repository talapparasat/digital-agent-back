import ERROR, {authErrors} from '@errors';

export default (req: any, res: any, next: any) => {
    if (!req.user) {
        return res.status(401).send(new ERROR(authErrors.AUTHENTICATION_REQUIRED));
    }
    next();
}
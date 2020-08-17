const { check, body, param, query, headers, validationResult } = require('express-validator/check');

export default (func: ({} : {check: any, body: any, param: any, query: any, headers: any}) => any) => {

    return [func({ check, body, param, query, headers}), (req: any, res: any, next: any) => {
        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(422).json({ errors: errors.array() });
        }

        next();
    }];

}
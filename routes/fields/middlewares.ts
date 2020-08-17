export const pagination = async (req: any, res: any, next: any) => {
    try {
        let query = req.query['query'];

        if(!query) {
            query = ""
        } else if(query.trim().length < 1) {
            query = ""
        }

        req.query['query'] = query;


        let page = parseInt(req.query['page']);

        if(isNaN(page)) {
            page = 1;
        } else if(page < 1) {
            page = 1
        }

        req.query['page'] = page;

        next()

    } catch(err) {

        res.status(422).send(err);

    }
};
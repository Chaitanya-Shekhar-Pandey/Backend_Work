const asynchandler = (reqhandler) => {
    return (req, res, next) => {
        return Promise
            .resolve(reqhandler(req, res, next))
            .catch((error) => next(error));
    };
};

export { asynchandler };

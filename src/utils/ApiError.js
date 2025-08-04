class ApiError extends Error{
    constructor(
        statuscode,
        message = "Something went Weong",
        stack = "",
        error = []
    ){
        super(message)
        this.statuscode = statuscode
        this.message = message
        this.data = null
        this.error = error
        this.success = false

        if(stack){
            this.stack = stack
        }
        else{
            Error.captureStackTrace(this,this.constructor);
        }
    }
}

export {ApiError}
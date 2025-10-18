import { requestContext } from "@/context/request.context";
import { ErrorResponse } from "@/dtos";
import { auth } from "@/lib/auth";
import { HTTP } from "@/utils/constants";
import { fromNodeHeaders } from "better-auth/node";
import type { NextFunction, Request, Response } from "express"


export const authMiddleware = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const headers = fromNodeHeaders(req.headers)
        const session = await auth.api.getSession({ headers })
        if (session) {
            req.userId = session.userWithRole?.id;
            if (req.userId) {
                requestContext.run({ userId: req.userId }, () => {
                    next();
                });
            } else {
                return res.status(HTTP.UNAUTHORIZED).json(ErrorResponse(HTTP.UNAUTHORIZED, 'Unauthorized'));
            }
        }
        else {
            return res.status(HTTP.UNAUTHORIZED).json(ErrorResponse(HTTP.UNAUTHORIZED, 'Unauthorized'))
        }
    } catch (error) {
        console.log("Something went wrong on auth middleware: ", error)
        return res.status(HTTP.INTERNAL).json(ErrorResponse(HTTP.INTERNAL, 'Internal Server Error'))
    }
}

export const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const headers = fromNodeHeaders(req.headers);
        const session = await auth.api.getSession({ headers });
        if (session) {
            const user = session.userWithRole;
            if (user?.role === "ADMIN") {
                next()
            }
            else {
                return res.status(HTTP.UNAUTHORIZED).json(ErrorResponse(HTTP.UNAUTHORIZED, 'Unauthorized'))
            }
        } else {
            return res.status(HTTP.UNAUTHORIZED).json(ErrorResponse(HTTP.UNAUTHORIZED, 'Unauthorized'))
        }
    } catch (error) {
        console.log("Something went wrong on admin middleware: ", error)
        return res.status(HTTP.INTERNAL).json(ErrorResponse(HTTP.INTERNAL, 'Internal Server Error'))
    }
}


export const isModerator = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const headers = fromNodeHeaders(req.headers);
        const session = await auth.api.getSession({ headers });
        if (session) {
            const user = session.userWithRole;
            if (user?.role === "MODERATOR" || user?.role === "ADMIN") {
                next();
            } else {
                return res.status(HTTP.UNAUTHORIZED).json(ErrorResponse(HTTP.UNAUTHORIZED, 'Unauthorized'));
            }
        } else {
            return res.status(HTTP.UNAUTHORIZED).json(ErrorResponse(HTTP.UNAUTHORIZED, 'Unauthorized'));
        }
    } catch (error) {
        console.log("Something went wrong on moderator middleware: ", error);
        return res.status(HTTP.INTERNAL).json(ErrorResponse(HTTP.INTERNAL, 'Internal Server Error'));
    }
};
import { ErrorResponse, SuccessResponse } from "@/dtos";
import { memberServices } from "@/services/member.service";
import { HTTP } from "@/utils/constants";
import { error } from "console";
import type { Request, Response } from "express";
import { success } from "zod";
import { PaginationResponse } from "@/dtos"; 
class MemberController{
    async createMember(req : Request, res : Response){
        try {
            const {name,role,year}  = req.body;
            const result = await memberServices.createMember({name,role,year});
            if (!result.success) {
                return res.status(HTTP.BAD_REQUEST).json(ErrorResponse(HTTP.BAD_REQUEST,result.error));
            }
            else {
                return res.status(HTTP.CREATED).json(SuccessResponse(HTTP.CREATED, 'Member created successfully', result));
            }
        } catch (error) {
            return res.status(HTTP.INTERNAL).json(ErrorResponse(HTTP.INTERNAL, (error as Error).message || 'Internal Server Error'));
        }
    }
    
    
async getMembers(req: Request, res: Response) {
    try {
    const query = (req as any).validatedQuery;
    const page = query.page;
    const limit = query.limit;
        const skip = (page - 1) * limit;

        const result = await memberServices.getMembers({ skip, limit });

        if (!result.success) {
            return res
                .status(HTTP.NOT_FOUND)
                .json(ErrorResponse(HTTP.NOT_FOUND, result.error));
        }

        if (!result.data) {
            return res
                .status(HTTP.NOT_FOUND)
                .json(ErrorResponse(HTTP.NOT_FOUND, "No member data found"));
        }
        const { members, total } = result.data;

        return res
            .status(HTTP.OK)
            .json(
                PaginationResponse(
                    HTTP.OK,
                    "Members fetched successfully",
                    members,
                    total,
                    page,
                    limit
                )
            );

    } catch (error) {
        console.log(`Get Members Controller Error: ${error}`);
        return res
            .status(HTTP.INTERNAL)
            .json(
                ErrorResponse(
                    HTTP.INTERNAL,
                    (error as Error).message || "Internal Server Error"
                )
            );
    }
}


    async updateMember(req : Request, res : Response){

        try {
            const memberId = req.params.id
            const updates = req.body

            const result = await memberServices.updateMember(memberId, updates)
            if (!result.success){
                return res.status(HTTP.BAD_REQUEST).json(ErrorResponse(HTTP.BAD_REQUEST, result.error))
            }
            return res.status(HTTP.OK).json({success:true,data:result.data})
        } catch (error) {
            console.log(`Update Member Controller Error: ${error}`)
            return res.status(HTTP.INTERNAL).json(ErrorResponse(HTTP.INTERNAL, (error as Error).message || 'Internal Server Error'));
            
        }

    }

    async getMember(req: Request, res: Response) {
        try {
            const memberId = req.params.id;

            const result = await memberServices.getMember(memberId);

            if (!result.success) {
                return res
                    .status(HTTP.NOT_FOUND)
                    .json(ErrorResponse(HTTP.NOT_FOUND, result.error));
            }

            return res
                .status(HTTP.OK)
                .json(SuccessResponse(HTTP.OK, "Member fetched successfully", result.data));
        } catch (error) {
            console.log(`Get Member Controller Error: ${error}`);
            return res
                .status(HTTP.INTERNAL)
                .json(
                    ErrorResponse(
                        HTTP.INTERNAL,
                        (error as Error).message || "Internal Server Error"
                    )
                );
        }
    }
}

export const memberController = new MemberController()
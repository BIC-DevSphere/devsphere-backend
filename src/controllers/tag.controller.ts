import type { Request, Response } from "express";
import prisma from "@/db/prisma";
import { prismaSafe } from "@/lib/prismaSafe";
import { tagServices } from "@/services/tag.service";
import { ErrorResponse, SuccessResponse } from "@/dtos";
import { HTTP } from "@/utils/constants";

class TagController {
  async getAllTags(req: Request, res: Response) {
    try {
      const tagResults = await tagServices.getAllTags();

      if (!tagResults.success) {
        return res.status(HTTP.BAD_REQUEST).json(ErrorResponse(HTTP.BAD_REQUEST, tagResults.error));
      }

      return res
        .status(HTTP.OK)
        .json(SuccessResponse(HTTP.OK, "Tags fetched successfully", tagResults.data));
    } catch (error) {
      console.log(`Get All Tags Controller Error: ${error}`);
      return res
        .status(HTTP.INTERNAL)
        .json(ErrorResponse(HTTP.INTERNAL, (error as Error).message || "Internal Server Error"));
    }
  }

  async createTag(req: Request, res: Response) {
    try {
      const { name } = req.body;
      const createTagResult = await tagServices.createTag({ name });

      if (!createTagResult.success) {
        return res
          .status(HTTP.BAD_REQUEST)
          .json(ErrorResponse(HTTP.BAD_REQUEST, createTagResult.error));
      }

      return res
        .status(HTTP.OK)
        .json(SuccessResponse(HTTP.OK, "Tag created successfully", createTagResult.data));
    } catch (error) {
      console.log(`Create Tag Controller Error: ${error}`);
      return res
        .status(HTTP.INTERNAL)
        .json(ErrorResponse(HTTP.INTERNAL, (error as Error).message || "Internal Server Error"));
    }
  }
}

export const tagController = new TagController();

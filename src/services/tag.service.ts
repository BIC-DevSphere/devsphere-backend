import prisma from "@/db/prisma";
import { prismaSafe } from "@/lib/prismaSafe";
import { success } from "zod";

interface CreateTagRequest {
  name: string;
}

class TagServices {
  async getAllTags() {
    try {
      const [error, result] = await prismaSafe(prisma.tag.findMany());

      if (error) {
        return { success: false, error: error };
      }

      if (!result) {
        return { success: false, error: "Failed to fetch tags" };
      }

      return { success: true, data: result };
    } catch (error) {
      console.log(`Failed to fetch tags, ${error}`);
      return { success: false, error: error };
    }
  }

  async createTag(data: CreateTagRequest) {
    try {
      const [error, result] = await prismaSafe(
        prisma.tag.create({
          data: {
            name: data.name,
          },
        })
      );
      if (error) {
        return { success: false, error: error };
      }
      if (!result) {
        return { success: false, error: "Failed to create tag" };
      }
      return { success: true, data: result };
    } catch (error) {
      console.log(`Failed to create tag, ${error}`);
      return { success: false, error: error };
    }
  }
}

export const tagServices = new TagServices();

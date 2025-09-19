import { tagController } from "@/controllers/tag.controller";
import { authMiddleware, isModerator } from "@/middleware/auth.middleware";
import { Router } from "express";

const tagRouter = Router();

tagRouter.use(authMiddleware, isModerator);

// Private Routess
tagRouter.get("/", tagController.getAllTags);
tagRouter.post("/", tagController.createTag);

export default tagRouter;

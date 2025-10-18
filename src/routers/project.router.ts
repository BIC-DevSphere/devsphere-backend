import { projectController } from '@/controllers/project.controller';
import upload from '@/lib/multer';
import { paginationQuerySchema } from '@/lib/zod/pagination.schema';
import {
  createProjectSchema,
  updateProjectSchema,
  projectIdParamsSchema,
} from '@/lib/zod/project.schema';
import { authMiddleware, isModerator } from '@/middleware/auth.middleware';
import { validateBody, validateParams, validateQuery } from '@/middleware/validation.middleware';
import { Router } from 'express';

const projectRouter = Router();

// Public route
projectRouter.get('/', validateQuery(paginationQuerySchema), projectController.getAllProjects);

projectRouter.use(authMiddleware);

// Private Routes
projectRouter.post(
  '/',
  upload.single('thumbnail'),
  validateBody(createProjectSchema),
  projectController.addProject
);

projectRouter.post(
  '/upload',
  upload.single('image'),
  projectController.uploadImage
)
projectRouter.patch(
  '/:id',
  upload.single('thumbnail'),
  validateParams(projectIdParamsSchema),
  validateBody(updateProjectSchema),
  projectController.updateProject
);

projectRouter.delete(
  '/:id',
  validateParams(projectIdParamsSchema),
  projectController.deleteProject
);
export default projectRouter;

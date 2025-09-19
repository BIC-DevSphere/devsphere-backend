import { memberController } from '@/controllers/member.controller';
import { createMemberSchema, getMembersQuerySchema, memberParamsSchema, updateMemberSchema } from '@/lib/zod/member.schema';
import { authMiddleware, isModerator } from '@/middleware/auth.middleware';
import { validateBody, validateParams, validateQuery } from '@/middleware/validation.middleware';
import { Router } from 'express'


const memberRouter = Router();

//Public routes
memberRouter.get('/',validateQuery(getMembersQuerySchema) ,memberController.getMembers)
memberRouter.get('/:id', validateParams(memberParamsSchema), memberController.getMember);

//Authenticated routes
memberRouter.use(authMiddleware)
memberRouter.use(isModerator)
memberRouter.post('/',validateBody(createMemberSchema), memberController.createMember )
memberRouter.patch("/:id",validateParams(memberParamsSchema) ,validateBody(updateMemberSchema) ,memberController.updateMember)


export default memberRouter;
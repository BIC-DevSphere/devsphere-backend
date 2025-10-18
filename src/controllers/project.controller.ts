import type { Request, Response } from 'express';
import { ErrorResponse, PaginationResponse, SuccessResponse } from '../dtos/index.js';
import { HTTP } from '@/utils/constants.js';
import { projectServices } from '@/services/project.service.js';
import type { CreateProjectInput, UpdateProjectInput } from '@/lib/zod/project.schema.js';
import { getRepoNameFromGithubUrl } from '@/utils/github.js';
import { tagServices } from '@/services/tag.service.js';
import { contributorServices } from '@/services/contributor.service.js';
import { uploadImageToCloudinary } from '@/utils/cloudinary.uploader.js';

class ProjectController {
  async getAllProjects(req: Request, res: Response) {
    try {
      const query = (req as any).validatedQuery;
      const page = query.page;
      const limit = query.limit;
      const skip = (page - 1) * limit;

      const projectResult = await projectServices.getAllProjects({ skip, limit });

      if (!projectResult.success || !projectResult.data) {
        return res
          .status(HTTP.BAD_REQUEST)
          .json(ErrorResponse(HTTP.BAD_REQUEST, projectResult.error));
      }

      const { mappedProjects, total } = projectResult.data;
      res
        .status(HTTP.OK)
        .json(
          PaginationResponse(
            HTTP.OK,
            'Projects fetched successfully',
            mappedProjects,
            total,
            page,
            limit
          )
        );
    } catch (error) {
      console.error('Error in getAllProjects controller:', error);
      res.status(HTTP.INTERNAL).json(ErrorResponse(HTTP.INTERNAL, 'Internal Server Error'));
    }
  }

  async addProject(req: Request, res: Response) {
    try {
      const { name, githubLink, demoLink, description, techStacks, tagIds }: CreateProjectInput =
        req.body;
      const thumbnail = req.file;
      let repoName = getRepoNameFromGithubUrl(githubLink);

      const addProjectResult = await projectServices.createProject(
        {
          name,
          githubLink,
          demoLink,
          description,
          techStacks,
          tagIds,
        },
        thumbnail
      );

      if (!addProjectResult.success || !addProjectResult.data) {
        return res
          .status(HTTP.BAD_REQUEST)
          .json(
            ErrorResponse(
              HTTP.BAD_REQUEST,
              typeof addProjectResult.error === 'string'
                ? addProjectResult.error
                : 'Failed to add project'
            )
          );
      }

      // If tagIds are provided, associate them with the project
      const projectId = addProjectResult.data.id;

      if (tagIds && tagIds.length > 0) {
        const tagAssociationResult = await tagServices.associateTagToProject(projectId, tagIds);
        if (!tagAssociationResult.success || !tagAssociationResult.data) {
          console.warn(
            'Some tags failed to associate with the project:',
            tagAssociationResult.error
          );
          return res
            .status(HTTP.BAD_REQUEST)
            .json(ErrorResponse(HTTP.BAD_REQUEST, 'Failed to associate tags'));
        }
      }

      // If repoName is provided add contributors from that repo
      if (repoName && addProjectResult.data.id) {
        const contributorResult = await contributorServices.addGithubContributorsToProject(
          repoName,
          addProjectResult.data.id
        );
        if (!contributorResult.success) {
          console.warn('Some contributors failed to process:', contributorResult.error);
        }
      }

      return res
        .status(HTTP.OK)
        .json(SuccessResponse(HTTP.OK, 'Project added successfully', addProjectResult.data));
    } catch (error) {
      console.error('Error in addProject controller:', error);
      return res.status(HTTP.INTERNAL).json(ErrorResponse(HTTP.INTERNAL, 'Internal Server Error'));
    }
  }

  async updateProject(req: Request, res: Response) {
    try {
      const projectId = req.params.id;
      const updates: UpdateProjectInput = req.body;
      const thumbnail = req.file;

      const updateProjectResult = await projectServices.updateProject(
        projectId,
        updates,
        thumbnail
      );

      if (!updateProjectResult.success || !updateProjectResult.data) {
        return res
          .status(HTTP.BAD_REQUEST)
          .json(
            ErrorResponse(HTTP.BAD_REQUEST, updateProjectResult.error || 'Failed to update project')
          );
      }
      return res
        .status(HTTP.OK)
        .json(SuccessResponse(HTTP.OK, 'Project updated successfully', updateProjectResult.data));
    } catch (error) {
      console.error('Error in updating project:', error);
      res.status(HTTP.INTERNAL).json(ErrorResponse(HTTP.INTERNAL, 'Internal Server Error'));
    }
  }

  async deleteProject(req: Request, res: Response) {
    try {
      const projectId = req.params.id;

      const deleteProjectResult = await projectServices.deleteProject(projectId);

      if (!deleteProjectResult.success) {
        return res
          .status(HTTP.BAD_REQUEST)
          .json(
            ErrorResponse(HTTP.BAD_REQUEST, deleteProjectResult.error || 'Failed to delete project')
          );
      }
      return res
        .status(HTTP.OK)
        .json(SuccessResponse(HTTP.OK, 'Project deleted successfully', null));
    } catch (error) {
      console.error('Error in deleting project:', error);
      res.status(HTTP.INTERNAL).json(ErrorResponse(HTTP.INTERNAL, 'Internal Server Error'));
    }
  }

  async uploadImage(req: Request, res: Response) {
    try {
      if (!req.file) return res
      .status(HTTP.BAD_REQUEST)
      .json(
        ErrorResponse(HTTP.BAD_REQUEST, "Image is required")
      )
        const image = req.file;
        
        const uploadResult = await uploadImageToCloudinary(image!.path, {folder: "projects"})
        if (!uploadResult.success) {
          return res
          .status(HTTP.BAD_REQUEST)
          .json(
            ErrorResponse(HTTP.BAD_REQUEST, uploadResult.error|| 'Failed to upload image.')
          );
        }
        return res
          .status(HTTP.OK)
          .json(
            SuccessResponse(HTTP.OK,"Uploaded successfully", uploadResult.url)
          );
    } catch (error) {
      console.log("Error whole uploading image: ", error)
    }
  }
}

export const projectController = new ProjectController();

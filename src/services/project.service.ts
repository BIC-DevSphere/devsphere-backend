import prisma from '@/db/prisma';
import { prismaSafe } from '@/lib/prismaSafe';
import type { GetAllProjects } from '@/types/project.types';
import type { Project } from '@prisma/client';
import { contributorServices } from './contributor.service';
import { tagServices } from './tag.service';
import type { CreateProjectInput, UpdateProjectInput } from '@/lib/zod/project.schema';
import cloudinary from '@/lib/cloudinary';
import { uploadImageToCloudinary } from '@/utils/cloudinary.uploader';

class ProjectServices {
  async getAllProjects({ skip, limit }: { skip?: number; limit?: number }) {
    try {
      const [error, projectsResult] = await prismaSafe(
        Promise.all([
          prisma.project.findMany({
            skip: skip,
            take: limit,
            include: {
              ProjectTags: {
                select: {
                  tag: true,
                },
              },
              ProjectContributors: {
                select: {
                  contributor: {
                    select: {
                      id: true,
                      name: true,
                      avatarUrl: true,
                      githubUsername: true,
                    },
                  },
                },
              },
            },
            orderBy: {
              updatedAt: 'desc',
            },
          }),
          prisma.project.count(),
        ])
      );

      if (error) {
        return { success: false, error };
      }

      if (!projectsResult) {
        return { success: false, error: 'No projects found' };
      }

      const [projects, total] = projectsResult;

      const mappedProjects: GetAllProjects[] = projects.map((project) => ({
        id: project.id,
        name: project.name,
        githubLink: project.githubLink,
        demoLink: project.demoLink,
        thumbnailUrl: project.thumbnailUrl,
        tech_stack: project.tech_stack,
        description: project.description,
        tags: project.ProjectTags.map((pt) => pt.tag),
        contributors: project.ProjectContributors.map((pc) => pc.contributor),
        createdAt: project.createdAt,
        updatedAt: project.updatedAt,
      }));

      return { success: true, data: { mappedProjects, total } };
    } catch (error) {
      console.error('Error fetching projects:', error);
      return { success: false, error: error };
    }
  }

  async createProject(project: CreateProjectInput, thumbnail?: Express.Multer.File) {
    try {
      let thumbnailUrl: string | null = null;

      if (thumbnail) {
        try {
          const uploadResult = await uploadImageToCloudinary(thumbnail.path, {
            folder: 'project_thumbnails',
          });

          if (!uploadResult.success) {
            console.log(`Error while uploading image: ${uploadResult.error}`);
          }

          thumbnailUrl = uploadResult.url || null;
        } catch (error) {
          console.log(`Cloudinary upload error: ${error}`);
        }
      }

      const [projectError, projectResult] = await prismaSafe(
        prisma.project.create({
          data: {
            name: project.name,
            githubLink: project.githubLink,
            demoLink: project.demoLink,
            description: project.description,
            thumbnailUrl: thumbnailUrl,
            tech_stack: project.techStacks,
          },
        })
      );

      if (projectError) {
        return { success: false, error: projectError };
      }
      if (!projectResult) {
        return { success: false, error: 'Failed to create project' };
      }

      return { success: true, data: projectResult };
    } catch (error) {
      console.error('Error creating project:', error);
      return { success: false, error: error };
    }
  }

  async updateProject(
    projectId: string,
    updates: UpdateProjectInput,
    thumbnail?: Express.Multer.File
  ) {
    try {
      // Clean the updates object to remove undefined or null values
      const cleanedData: UpdateProjectInput = Object.fromEntries(
        Object.entries(updates).filter(([_, v]) => v != null && v != undefined)
      );
      console.log('Thumbnail in service:', thumbnail);
      if (Object.keys(cleanedData).length === 0 && !thumbnail) {
        return { success: false, error: 'No valid fields provided for update' };
      }

      let thumbnailUrl: string | null = null;

      if (thumbnail) {
        try {
          const uploadResult = await uploadImageToCloudinary(thumbnail.path, {
            folder: 'project_thumbnails',
          });

          if (!uploadResult.success) {
            console.log(`Error while uploading image: ${uploadResult.error}`);
          }

          thumbnailUrl = uploadResult.url || null;
          console.log('Uploaded thumbnail URL:', thumbnailUrl);
        } catch (error) {
          console.log(`Cloudinary upload error: ${error}`);
        }
      }

      const [error, result] = await prismaSafe(
        prisma.$transaction(async (tx) => {
          if (cleanedData.tagIds) {
            const updateProjectTagsResult = await tagServices.updateProjectTags(
              tx,
              projectId,
              cleanedData.tagIds
            );

            if (!updateProjectTagsResult.success) {
              throw new Error(updateProjectTagsResult.error || 'Failed to update project tags');
            }

            delete cleanedData.tagIds;
          }

          let updatedProjectResult: Project | null = null;

          // Update project if there are changes
          if (Object.keys(cleanedData).length > 0 || thumbnailUrl) {
            updatedProjectResult = await tx.project.update({
              where: {
                id: projectId,
              },
              data: {
                ...cleanedData,
                thumbnailUrl: thumbnailUrl,
              },
            });
          } else {
            // If no fields to update, just fetch the current project
            updatedProjectResult = await tx.project.findUnique({ where: { id: projectId } });
          }
          return updatedProjectResult;
        })
      );

      if (error) return { success: false, error };

      if (!result) return { success: false, error: 'Failed to update project' };

      return { success: true, data: result };
    } catch (error) {
      console.error('Error updating project:', error);
      return { success: false, error };
    }
  }

  async deleteProject(projectId: string) {
    try {
      const [error, result] = await prismaSafe(
        prisma.project.delete({
          where: { id: projectId },
        })
      );
      if (error) {
        return { success: false, error };
      }
      if (!result) {
        return { success: false, error: 'Failed to delete project' };
      }
      return { success: true, data: result };
    } catch (error) {
      console.error('Error deleting project:', error);
      return { success: false, error };
    }
  }

}

export const projectServices = new ProjectServices();

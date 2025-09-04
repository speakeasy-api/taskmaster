import { validateRequest } from '$lib/server/event-utilities/validation.js';
import { error, json } from '@sveltejs/kit';
import z from 'zod';
import type { RequestHandler } from './$types.js';

export const GET: RequestHandler = async ({ locals }) => {
  const userId = await locals.session.getUserId();
  if (userId.isErr()) {
    locals.logError('Error getting user ID from session', userId.error);
    switch (userId.error._tag) {
      case 'InvalidCredentialError':
        error(401, userId.error.message);
    }
  }

  const result = await locals.services.projects.list({
    created_by: userId.value
  });

  if (result.isOk()) {
    return json(result.value);
  }

  switch (result.error._tag) {
    case 'DatabaseError':
      locals.logError('Database error fetching projects', result.error);
      return json(
        { message: 'There was a database error fetching the projects.' },
        { status: 500 }
      );
  }
};

const CreateProjectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(255, 'Name must be 255 characters or less'),
  description: z
    .string()
    .min(1, 'Description is required')
    .max(500, 'Description must be 500 characters or less')
});

export const POST: RequestHandler = async ({ locals }) => {
  const { body } = await validateRequest({
    bodySchema: CreateProjectSchema
  });
  const { name, description } = body;

  const userId = await locals.session.getUserId();
  if (userId.isErr()) {
    locals.logError('Error getting user ID from session', userId.error);
    switch (userId.error._tag) {
      case 'InvalidCredentialError':
        error(401, userId.error.message);
    }
  }

  const result = await locals.services.projects.create({
    name,
    description,
    created_by: userId.value
  });

  if (result.isOk()) return json(result.value, { status: 201 });

  switch (result.error._tag) {
    case 'DatabaseError':
      locals.logError('Database error creating project', result.error);
      return json(
        {
          message: 'There was a database error creating the project.'
        },
        { status: 500 }
      );
  }
};

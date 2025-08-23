import type { taskDepedencyTypeEnum } from '$lib/db/schemas/schema';
import type { InferEnum } from 'drizzle-orm';
import type { PageData } from './$types';
import { resolve } from '$app/paths';

/**
 * Unify dependencies and dependents into a single list with additional
 * metadata
 * */
export function unifyDependencies(pageTask: PageData['task']) {
  const dependencies = pageTask.dependencies.map((dep) => ({
    id: dep.id,
    title: dep.dependsOnTask.title,
    type: dep.dependency_type,
    invert: true,
    href: resolve('/(protected)/projects/task/[task_id]', { task_id: dep.depends_on_task_id })
  }));
  const dependents = pageTask.dependents.map((dep) => ({
    id: dep.id,
    title: dep.task.title,
    type: dep.dependency_type,
    invert: false,
    href: resolve('/(protected)/projects/task/[task_id]', { task_id: dep.task_id })
  }));
  return [...dependencies, ...dependents].sort((a, b) => a.type.localeCompare(b.title));
}

export function normalizeDependencyType(params: {
  type: InferEnum<typeof taskDepedencyTypeEnum>;
  invert?: boolean;
}): string {
  const { type, invert: inverted = false } = params;

  let result;
  if (type === 'blocks') result = 'Blocked By';
  else if (type === 'relates_to') result = 'Relates To';
  else if (type === 'duplicates') result = 'Duplicated By';
  else throw new Error('Unknown dependency type');

  if (inverted) {
    if (result === 'Blocked By') return 'Blocks';
    if (result === 'Duplicated By') return 'Duplicates';
  }

  return result;
}

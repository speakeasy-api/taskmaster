import type { taskDepedencyTypeEnum } from '$lib/db/schemas/schema';
import type { InferEnum } from 'drizzle-orm';
import type { PageData } from './$types';
import { resolve } from '$app/paths';

export type InvertedDependencyType = `${InferEnum<typeof taskDepedencyTypeEnum>}:invert`;

type UnifiedDependency = {
  id: string;
  title: string;
  typeLabel: string;
  invert: boolean;
  href: string;
};

/**
 * Unify dependencies and dependents into a single list with additional
 * metadata
 * */
export function unifyDependencies(pageTask: PageData['task']) {
  const blocks: UnifiedDependency[] = [];
  const blockedBy: UnifiedDependency[] = [];
  const relatesTo: UnifiedDependency[] = [];
  const duplicates: UnifiedDependency[] = [];
  const duplicatedBy: UnifiedDependency[] = [];

  for (const dep of pageTask.dependencies) {
    const unifiedDep: UnifiedDependency = {
      id: dep.id,
      title: dep.dependsOnTask.title,
      typeLabel: normalizeDependencyType({ type: dep.dependency_type, invert: true }),
      invert: true,
      href: resolve('/(protected)/projects/task/[task_id]', { task_id: dep.depends_on_task_id })
    };
    if (dep.dependency_type === 'blocks') blocks.push(unifiedDep);
    else if (dep.dependency_type === 'relates_to') relatesTo.push(unifiedDep);
    else if (dep.dependency_type === 'duplicates') duplicates.push(unifiedDep);
  }

  for (const dep of pageTask.dependents) {
    const unifiedDep: UnifiedDependency = {
      id: dep.id,
      title: dep.task.title,
      typeLabel: normalizeDependencyType({ type: dep.dependency_type, invert: false }),
      invert: false,
      href: resolve('/(protected)/projects/task/[task_id]', { task_id: dep.task_id })
    };
    if (dep.dependency_type === 'blocks') blockedBy.push(unifiedDep);
    else if (dep.dependency_type === 'relates_to') relatesTo.push(unifiedDep);
    else if (dep.dependency_type === 'duplicates') duplicatedBy.push(unifiedDep);
  }

  return [
    {
      label: 'Blocks',
      dataValue: 'blocks',
      emptyMessage: 'Does not block any other tasks.',
      items: blocks
    },
    {
      label: 'Blocked By',
      dataValue: 'blocks:invert',
      emptyMessage: 'Not blocked by any other tasks.',
      items: blockedBy
    },
    {
      label: 'Relates To',
      dataValue: 'relates_to',
      emptyMessage: 'No related tasks.',
      items: relatesTo
    },
    {
      label: 'Duplicates',
      dataValue: 'duplicates',
      emptyMessage: 'Does not duplicate any other tasks.',
      items: duplicates
    },
    {
      label: 'Duplicated By',
      dataValue: 'duplicates:invert',
      emptyMessage: 'Not duplicated by any other tasks.',
      items: duplicatedBy
    }
  ];
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

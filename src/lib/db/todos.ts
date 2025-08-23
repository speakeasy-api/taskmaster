import { eq, and } from 'drizzle-orm';
import { db } from './index.js';
import { tasks } from './schemas/schema.js';

export async function createTodo(userId: string, title: string, description: string) {
  const [newTodo] = await db
    .insert(tasks)
    .values({
      created_by: userId,
      title,
      description
    })
    .returning();

  return newTodo;
}

export async function getTodosByUserId(userId: string) {
  return await db.select().from(tasks).where(eq(tasks.created_by, userId)).orderBy(tasks.id);
}

export async function deleteTodo(todoId: string, userId: string) {
  await db.delete(tasks).where(and(eq(tasks.id, todoId), eq(tasks.created_by, userId)));
}

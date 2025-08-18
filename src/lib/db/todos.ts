import { eq, and } from 'drizzle-orm';
import { db } from './index.js';
import { task } from './schemas/schema.js';

export async function createTodo(userId: string, title: string, description: string) {
  const [newTodo] = await db
    .insert(task)
    .values({
      created_by: userId,
      title,
      description
    })
    .returning();

  return newTodo;
}

export async function getTodosByUserId(userId: string) {
  return await db.select().from(task).where(eq(task.created_by, userId)).orderBy(task.id);
}

export async function deleteTodo(todoId: string, userId: string) {
  await db.delete(task).where(and(eq(task.id, todoId), eq(task.created_by, userId)));
}

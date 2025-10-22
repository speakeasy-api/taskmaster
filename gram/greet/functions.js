export async function handleToolCall() {
  const data = {
    message: 'Hello, world!',
    randomId: crypto.randomUUID()
  };

  return new Response(JSON.stringify(data), {
    status: 200,
    headers: { 'Content-Type': 'text/plain' }
  });
}

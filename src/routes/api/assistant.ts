import { createFileRoute } from "@tanstack/react-router";
import { handleAssistant } from "@/server/ai/assistant";

export const Route = createFileRoute("/api/assistant")({
  server: { handlers: { POST: ({ request }) => handleAssistant(request) } },
});

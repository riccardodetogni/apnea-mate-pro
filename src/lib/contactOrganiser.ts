import { supabase } from "@/integrations/supabase/client";
import { getOrCreateDMConversation } from "@/hooks/useConversations";

export type OrganiserEntityType = "session" | "event" | "course";

const entityLabel: Record<OrganiserEntityType, string> = {
  session: "sessione",
  event: "evento",
  course: "corso",
};

export async function sendContactOrganiserMessage(params: {
  currentUserId: string;
  organiserId: string;
  entityType: OrganiserEntityType;
  entityTitle: string;
  text: string;
}): Promise<{ conversationId: string }> {
  const { currentUserId, organiserId, entityType, entityTitle, text } = params;
  const convId = await getOrCreateDMConversation(currentUserId, organiserId);
  const body = `📌 Riguardo a "${entityTitle}" (${entityLabel[entityType]})\n\n${text.trim()}`;
  const { error } = await supabase.from("messages").insert({
    conversation_id: convId,
    sender_id: currentUserId,
    content: body,
  });
  if (error) throw error;
  return { conversationId: convId };
}

export const contactOrganiserSuggestions: Record<OrganiserEntityType, string[]> = {
  session: [
    "Che livello è richiesto?",
    "Serve attrezzatura specifica?",
    "Ci sono ancora posti disponibili?",
  ],
  event: [
    "Ci sono info su logistica e alloggio?",
    "Che livello è richiesto?",
    "È incluso il pranzo o i pasti?",
  ],
  course: [
    "Qual è il programma del corso?",
    "Serve una certificazione precedente?",
    "Come si effettua il pagamento?",
  ],
};
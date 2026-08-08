import { supabase } from "@/lib/supabaseClient";
import { AGORA_EDGE_FUNCTION } from "@/lib/supabaseTables";

export interface AgoraJoinResponse {
  success: boolean;
  token?: string;
  appId?: string;
  uid?: number;
  message?: string;
}

/**
 * Requests an Agora token from the Supabase Edge Function.
 * The token is generated server-side using the Agora App Certificate.
 */
export async function getAgoraToken(channelName: string, uid: number): Promise<AgoraJoinResponse> {
  try {
    const { data, error } = await supabase.functions.invoke(AGORA_EDGE_FUNCTION, {
      body: { channelName, uid, role: "publisher" },
    });

    if (error) {
      console.error("Agora token edge function error:", error);
      return { success: false, message: error.message || "Unable to obtain Agora token" };
    }

    return (data as AgoraJoinResponse) || { success: false, message: "No response from token service" };
  } catch (err) {
    console.error("Failed to fetch Agora token:", err);
    return { success: false, message: "Unable to start voice call" };
  }
}

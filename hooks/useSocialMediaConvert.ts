import { useMutation } from "@tanstack/react-query";
import { apiClient } from "@/lib/api/client";

interface ConvertRequest {
  content: string;
  title: string;
  platform: "linkedin" | "threads";
}

interface ConvertResponse {
  success: boolean;
  data: {
    linkedin?: string;
    threads?: string[];
  };
}

export function useSocialMediaConvert() {
  return useMutation({
    mutationFn: async (data: ConvertRequest) => {
      return apiClient.post<ConvertResponse, ConvertRequest>("/api/ai/convert-social", data);
    },
  });
}

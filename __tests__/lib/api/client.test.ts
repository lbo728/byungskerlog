import { describe, it, expect, beforeEach } from "vitest";
import { http, HttpResponse } from "msw";
import { apiClient, ClientApiError } from "@/lib/api/client";
import { server } from "../../mocks/server";

describe("apiClient", () => {
  beforeEach(() => {
    server.resetHandlers();
  });

  describe("get", () => {
    it("성공적으로 데이터를 가져온다", async () => {
      server.use(
        http.get("/api/test", () => {
          return HttpResponse.json({ data: "test" });
        })
      );

      const result = await apiClient.get<{ data: string }>("/api/test");

      expect(result).toEqual({ data: "test" });
    });

    it("에러 응답 시 ClientApiError를 던진다", async () => {
      server.use(
        http.get("/api/test", () => {
          return HttpResponse.json(
            { error: "Not Found", code: "NOT_FOUND" },
            { status: 404 }
          );
        })
      );

      await expect(apiClient.get("/api/test")).rejects.toThrow(ClientApiError);
    });

    it("에러 응답에 상태 코드가 포함된다", async () => {
      server.use(
        http.get("/api/test", () => {
          return HttpResponse.json(
            { error: "Not Found", code: "NOT_FOUND" },
            { status: 404 }
          );
        })
      );

      try {
        await apiClient.get("/api/test");
      } catch (error) {
        expect(error).toBeInstanceOf(ClientApiError);
        if (error instanceof ClientApiError) {
          expect(error.statusCode).toBe(404);
          expect(error.code).toBe("NOT_FOUND");
        }
      }
    });
  });

  describe("post", () => {
    it("성공적으로 데이터를 전송한다", async () => {
      let receivedBody: unknown;
      server.use(
        http.post("/api/test", async ({ request }) => {
          receivedBody = await request.json();
          return HttpResponse.json({ success: true });
        })
      );

      const result = await apiClient.post<{ success: boolean }>(
        "/api/test",
        { name: "test" }
      );

      expect(result).toEqual({ success: true });
      expect(receivedBody).toEqual({ name: "test" });
    });

    it("body 없이도 전송할 수 있다", async () => {
      server.use(
        http.post("/api/test", () => {
          return HttpResponse.json({ success: true });
        })
      );

      const result = await apiClient.post<{ success: boolean }>("/api/test");

      expect(result).toEqual({ success: true });
    });
  });

  describe("patch", () => {
    it("성공적으로 데이터를 업데이트한다", async () => {
      server.use(
        http.patch("/api/test/:id", async ({ params, request }) => {
          const body = await request.json();
          return HttpResponse.json({ id: params.id, ...body as object });
        })
      );

      const result = await apiClient.patch<{ id: string; name: string }>(
        "/api/test/123",
        { name: "updated" }
      );

      expect(result).toEqual({ id: "123", name: "updated" });
    });
  });

  describe("put", () => {
    it("성공적으로 데이터를 교체한다", async () => {
      server.use(
        http.put("/api/test/:id", async ({ request }) => {
          const body = await request.json();
          return HttpResponse.json(body);
        })
      );

      const result = await apiClient.put<{ name: string }>(
        "/api/test/123",
        { name: "replaced" }
      );

      expect(result).toEqual({ name: "replaced" });
    });
  });

  describe("delete", () => {
    it("성공적으로 데이터를 삭제한다", async () => {
      server.use(
        http.delete("/api/test/:id", () => {
          return HttpResponse.json({ message: "deleted" });
        })
      );

      const result = await apiClient.delete<{ message: string }>(
        "/api/test/123"
      );

      expect(result).toEqual({ message: "deleted" });
    });

    it("204 응답 시 undefined를 반환한다", async () => {
      server.use(
        http.delete("/api/test/:id", () => {
          return new HttpResponse(null, { status: 204 });
        })
      );

      const result = await apiClient.delete("/api/test/123");

      expect(result).toBeUndefined();
    });
  });
});

describe("ClientApiError", () => {
  it("fromResponse로 에러를 생성한다", () => {
    const response = {
      error: "Test error",
      code: "NOT_FOUND" as const,
      details: { id: "123" },
    };

    const error = ClientApiError.fromResponse(response, 404);

    expect(error.message).toBe("Test error");
    expect(error.code).toBe("NOT_FOUND");
    expect(error.statusCode).toBe(404);
    expect(error.details).toEqual({ id: "123" });
  });

  it("name이 ClientApiError이다", () => {
    const error = new ClientApiError("NOT_FOUND", 404, "Not found");

    expect(error.name).toBe("ClientApiError");
  });
});

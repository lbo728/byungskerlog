import { describe, it, expect, vi, beforeEach } from "vitest";
import { mockPrisma, resetPrismaMocks } from "../mocks/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/lib/auth", () => ({
  getAuthUser: vi.fn(),
}));

import { GET, POST } from "@/app/api/drafts/route";
import { getAuthUser } from "@/lib/auth";

const mockGetAuthUser = vi.mocked(getAuthUser);

function createPostRequest(body: object): Request {
  return new Request("http://localhost:3000/api/drafts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("GET /api/drafts", () => {
  beforeEach(() => {
    resetPrismaMocks();
    mockGetAuthUser.mockReset();
  });

  it("인증된 사용자의 임시저장 목록을 조회한다", async () => {
    const mockDrafts = [
      {
        id: "draft-1",
        title: "임시저장 글",
        content: "내용",
        authorId: "user-1",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
      },
    ];

    mockGetAuthUser.mockResolvedValue({ id: "user-1" } as Awaited<ReturnType<typeof getAuthUser>>);
    mockPrisma.draft.findMany.mockResolvedValue(mockDrafts);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(1);
    expect(data[0].title).toBe("임시저장 글");
    expect(mockPrisma.draft.findMany).toHaveBeenCalledWith({
      where: { authorId: "user-1" },
      orderBy: { updatedAt: "desc" },
    });
  });

  it("인증되지 않은 사용자는 401 에러를 받는다", async () => {
    mockGetAuthUser.mockResolvedValue(null);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe("UNAUTHORIZED");
  });
});

describe("POST /api/drafts", () => {
  beforeEach(() => {
    resetPrismaMocks();
    mockGetAuthUser.mockReset();
  });

  it("인증된 사용자가 임시저장을 생성할 수 있다", async () => {
    mockGetAuthUser.mockResolvedValue({ id: "user-1" } as Awaited<ReturnType<typeof getAuthUser>>);
    mockPrisma.draft.create.mockResolvedValue({
      id: "new-draft",
      title: "새 임시저장",
      content: "내용",
      authorId: "user-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const request = createPostRequest({
      title: "새 임시저장",
      content: "내용",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.title).toBe("새 임시저장");
    expect(mockPrisma.draft.create).toHaveBeenCalled();
  });

  it("인증되지 않은 사용자는 401 에러를 받는다", async () => {
    mockGetAuthUser.mockResolvedValue(null);

    const request = createPostRequest({
      title: "새 임시저장",
      content: "내용",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe("UNAUTHORIZED");
  });

  it("빈 body로도 임시저장을 생성할 수 있다", async () => {
    mockGetAuthUser.mockResolvedValue({ id: "user-1" } as Awaited<ReturnType<typeof getAuthUser>>);
    mockPrisma.draft.create.mockResolvedValue({
      id: "new-draft",
      title: "",
      content: "",
      authorId: "user-1",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const request = createPostRequest({});

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.title).toBe("");
  });
});

import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { mockPrisma, resetPrismaMocks } from "../mocks/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/lib/auth", () => ({
  getAuthUser: vi.fn(),
}));

import { GET, POST } from "@/app/api/series/route";
import { getAuthUser } from "@/lib/auth";

const mockGetAuthUser = vi.mocked(getAuthUser);

function createPostRequest(body: object): NextRequest {
  return new NextRequest(new URL("/api/series", "http://localhost:3000"), {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("GET /api/series", () => {
  beforeEach(() => {
    resetPrismaMocks();
    mockGetAuthUser.mockReset();
  });

  it("시리즈 목록을 성공적으로 조회한다", async () => {
    const mockSeries = [
      {
        id: "series-1",
        name: "React 시리즈",
        slug: "react-series",
        description: "React 관련 글",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
        _count: { posts: 5 },
      },
    ];

    mockPrisma.series.findMany.mockResolvedValue(mockSeries);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(1);
    expect(data[0].name).toBe("React 시리즈");
    expect(data[0]._count.posts).toBe(5);
  });
});

describe("POST /api/series", () => {
  beforeEach(() => {
    resetPrismaMocks();
    mockGetAuthUser.mockReset();
  });

  it("인증된 사용자가 시리즈를 생성할 수 있다", async () => {
    mockGetAuthUser.mockResolvedValue({ id: "user-1" } as Awaited<ReturnType<typeof getAuthUser>>);
    mockPrisma.series.create.mockResolvedValue({
      id: "new-series",
      name: "새 시리즈",
      slug: "new-series",
      description: "설명",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const request = createPostRequest({
      name: "새 시리즈",
      description: "설명",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.name).toBe("새 시리즈");
    expect(mockPrisma.series.create).toHaveBeenCalled();
  });

  it("인증되지 않은 사용자는 401 에러를 받는다", async () => {
    mockGetAuthUser.mockResolvedValue(null);

    const request = createPostRequest({
      name: "새 시리즈",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.code).toBe("UNAUTHORIZED");
  });

  it("name이 없으면 400 에러를 받는다", async () => {
    mockGetAuthUser.mockResolvedValue({ id: "user-1" } as Awaited<ReturnType<typeof getAuthUser>>);

    const request = createPostRequest({
      description: "설명만",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe("VALIDATION_ERROR");
  });

  it("중복된 시리즈 이름은 409 에러를 받는다", async () => {
    mockGetAuthUser.mockResolvedValue({ id: "user-1" } as Awaited<ReturnType<typeof getAuthUser>>);
    mockPrisma.series.create.mockRejectedValue({ code: "P2002" });

    const request = createPostRequest({
      name: "중복 시리즈",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(409);
    expect(data.code).toBe("DUPLICATE_ENTRY");
  });
});

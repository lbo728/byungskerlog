import { describe, it, expect, beforeEach } from "vitest";
import { mockPrisma, resetPrismaMocks } from "../mocks/prisma";

// Mock Prisma before importing the route
import { vi } from "vitest";
vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

import { GET } from "@/app/api/books/route";

describe("GET /api/books", () => {
  beforeEach(() => {
    resetPrismaMocks();
  });

  it("책 목록을 성공적으로 조회한다", async () => {
    const mockBooks = [
      {
        id: "book-1",
        title: "클린 코드",
        author: "로버트 C. 마틴",
        slug: "clean-code",
        coverImage: "https://example.com/clean-code.jpg",
        readAt: new Date("2024-01-15"),
        summary: "좋은 코드를 작성하는 방법",
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
        _count: { posts: 3 },
      },
      {
        id: "book-2",
        title: "리팩터링",
        author: "마틴 파울러",
        slug: "refactoring",
        coverImage: "https://example.com/refactoring.jpg",
        readAt: new Date("2024-01-10"),
        summary: "코드 개선 기법",
        createdAt: new Date("2024-01-05"),
        updatedAt: new Date("2024-01-05"),
        _count: { posts: 2 },
      },
    ];

    mockPrisma.book.findMany.mockResolvedValue(mockBooks);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toHaveLength(2);
    expect(data[0].title).toBe("클린 코드");
    expect(data[0]._count.posts).toBe(3);
    expect(data[1].title).toBe("리팩터링");
    expect(data[1]._count.posts).toBe(2);

    // Verify Prisma was called with correct arguments
    expect(mockPrisma.book.findMany).toHaveBeenCalledWith({
      include: {
        _count: {
          select: { posts: true },
        },
      },
      orderBy: { readAt: "desc" },
    });
  });

  it("빈 목록을 반환한다", async () => {
    mockPrisma.book.findMany.mockResolvedValue([]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data).toEqual([]);
    expect(mockPrisma.book.findMany).toHaveBeenCalled();
  });
});

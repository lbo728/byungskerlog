import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";
import { mockPrisma, resetPrismaMocks } from "../mocks/prisma";

vi.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

vi.mock("@/lib/auth", () => ({
  getAuthUser: vi.fn(),
}));

import { GET, POST } from "@/app/api/comments/route";
import { getAuthUser } from "@/lib/auth";

const mockGetAuthUser = vi.mocked(getAuthUser);

function createGetRequest(path: string): NextRequest {
  return new NextRequest(new URL(path, "http://localhost:3000"));
}

function createPostRequest(body: object): Request {
  return new Request("http://localhost:3000/api/comments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("GET /api/comments", () => {
  beforeEach(() => {
    resetPrismaMocks();
    mockGetAuthUser.mockReset();
  });

  it("postId로 댓글 목록을 조회한다", async () => {
    const mockComments = [
      {
        id: "comment-1",
        content: "테스트 댓글",
        postId: "post-1",
        authorId: "user-1",
        authorName: "테스트 유저",
        authorImage: null,
        parentId: null,
        createdAt: new Date("2024-01-01"),
        updatedAt: new Date("2024-01-01"),
        reactions: [],
        replies: [],
        _count: { replies: 0 },
      },
    ];

    mockPrisma.comment.findMany.mockResolvedValue(mockComments);
    mockPrisma.comment.count.mockResolvedValue(1);
    mockGetAuthUser.mockResolvedValue(null);

    const request = createGetRequest("/api/comments?postId=post-1");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.comments).toHaveLength(1);
    expect(data.comments[0].content).toBe("테스트 댓글");
    expect(data.total).toBe(1);
  });

  it("postId가 없으면 400 에러를 반환한다", async () => {
    const request = createGetRequest("/api/comments");
    const response = await GET(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe("BAD_REQUEST");
  });
});

describe("POST /api/comments", () => {
  beforeEach(() => {
    resetPrismaMocks();
    mockGetAuthUser.mockReset();
  });

  it("댓글을 성공적으로 생성한다", async () => {
    mockGetAuthUser.mockResolvedValue(null);
    mockPrisma.post.findUnique.mockResolvedValue({
      id: "post-1",
      published: true,
    });
    mockPrisma.comment.create.mockResolvedValue({
      id: "new-comment",
      content: "새 댓글",
      postId: "post-1",
      authorId: "anon_123",
      authorName: "익명",
      authorImage: null,
      parentId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
      reactions: [],
      _count: { replies: 0 },
    });

    const request = createPostRequest({
      content: "새 댓글",
      postId: "post-1",
      authorName: "익명",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.content).toBe("새 댓글");
    expect(mockPrisma.comment.create).toHaveBeenCalled();
  });

  it("content가 없으면 400 에러를 반환한다", async () => {
    const request = createPostRequest({
      postId: "post-1",
      authorName: "익명",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe("VALIDATION_ERROR");
  });

  it("존재하지 않는 post에 댓글을 달면 404 에러를 반환한다", async () => {
    mockPrisma.post.findUnique.mockResolvedValue(null);

    const request = createPostRequest({
      content: "새 댓글",
      postId: "non-existent-post",
      authorName: "익명",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(404);
    expect(data.code).toBe("NOT_FOUND");
  });

  it("authorName이 없으면 400 에러를 반환한다", async () => {
    const request = createPostRequest({
      content: "새 댓글",
      postId: "post-1",
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.code).toBe("VALIDATION_ERROR");
  });
});

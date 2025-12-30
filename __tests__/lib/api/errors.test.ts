import { describe, it, expect, vi, beforeEach } from "vitest";
import { ApiError, ErrorCode, handleApiError } from "@/lib/api/errors";

describe("ErrorCode", () => {
  it("모든 에러 코드를 포함한다", () => {
    expect(ErrorCode.UNAUTHORIZED).toBe("UNAUTHORIZED");
    expect(ErrorCode.FORBIDDEN).toBe("FORBIDDEN");
    expect(ErrorCode.NOT_FOUND).toBe("NOT_FOUND");
    expect(ErrorCode.VALIDATION_ERROR).toBe("VALIDATION_ERROR");
    expect(ErrorCode.DUPLICATE_ENTRY).toBe("DUPLICATE_ENTRY");
    expect(ErrorCode.INTERNAL_ERROR).toBe("INTERNAL_ERROR");
    expect(ErrorCode.BAD_REQUEST).toBe("BAD_REQUEST");
  });
});

describe("ApiError", () => {
  describe("constructor", () => {
    it("에러 객체를 생성한다", () => {
      const error = new ApiError("NOT_FOUND", 404, "Resource not found", {
        id: "123",
      });

      expect(error.code).toBe("NOT_FOUND");
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe("Resource not found");
      expect(error.details).toEqual({ id: "123" });
      expect(error.name).toBe("ApiError");
    });

    it("details 없이도 생성할 수 있다", () => {
      const error = new ApiError("NOT_FOUND", 404, "Resource not found");

      expect(error.details).toBeUndefined();
    });
  });

  describe("toResponse", () => {
    it("NextResponse 객체를 반환한다", () => {
      const error = new ApiError("NOT_FOUND", 404, "Resource not found");
      const response = error.toResponse();

      expect(response.status).toBe(404);
    });

    it("details가 있으면 포함한다", () => {
      const error = new ApiError("VALIDATION_ERROR", 400, "Validation failed", {
        field: "email",
      });
      const response = error.toResponse();

      expect(response.status).toBe(400);
    });
  });

  describe("static factory methods", () => {
    it("unauthorized 에러를 생성한다", () => {
      const error = ApiError.unauthorized();

      expect(error.code).toBe("UNAUTHORIZED");
      expect(error.statusCode).toBe(401);
      expect(error.message).toBe("Unauthorized");
    });

    it("unauthorized 에러에 커스텀 메시지를 설정할 수 있다", () => {
      const error = ApiError.unauthorized("Token expired");

      expect(error.message).toBe("Token expired");
    });

    it("forbidden 에러를 생성한다", () => {
      const error = ApiError.forbidden();

      expect(error.code).toBe("FORBIDDEN");
      expect(error.statusCode).toBe(403);
      expect(error.message).toBe("Forbidden");
    });

    it("notFound 에러를 생성한다", () => {
      const error = ApiError.notFound("Post");

      expect(error.code).toBe("NOT_FOUND");
      expect(error.statusCode).toBe(404);
      expect(error.message).toBe("Post not found");
    });

    it("notFound 에러에 기본 리소스명을 사용한다", () => {
      const error = ApiError.notFound();

      expect(error.message).toBe("Resource not found");
    });

    it("validationError를 생성한다", () => {
      const error = ApiError.validationError("Invalid email", {
        field: "email",
      });

      expect(error.code).toBe("VALIDATION_ERROR");
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe("Invalid email");
      expect(error.details).toEqual({ field: "email" });
    });

    it("duplicateEntry 에러를 생성한다", () => {
      const error = ApiError.duplicateEntry("User");

      expect(error.code).toBe("DUPLICATE_ENTRY");
      expect(error.statusCode).toBe(409);
      expect(error.message).toBe(
        "A user with this identifier already exists"
      );
    });

    it("badRequest 에러를 생성한다", () => {
      const error = ApiError.badRequest("Invalid data format");

      expect(error.code).toBe("BAD_REQUEST");
      expect(error.statusCode).toBe(400);
      expect(error.message).toBe("Invalid data format");
    });

    it("internal 에러를 생성한다", () => {
      const error = ApiError.internal();

      expect(error.code).toBe("INTERNAL_ERROR");
      expect(error.statusCode).toBe(500);
      expect(error.message).toBe("Internal server error");
    });
  });
});

describe("handleApiError", () => {
  beforeEach(() => {
    vi.spyOn(console, "error").mockImplementation(() => {});
  });

  it("ApiError인 경우 toResponse를 반환한다", () => {
    const error = ApiError.notFound("Post");
    const response = handleApiError(error, "Failed to fetch");

    expect(response.status).toBe(404);
  });

  it("일반 에러인 경우 500 에러를 반환한다", () => {
    const error = new Error("Something went wrong");
    const response = handleApiError(error, "Failed to process");

    expect(response.status).toBe(500);
    expect(console.error).toHaveBeenCalledWith("Failed to process", error);
  });

  it("unknown 에러인 경우 fallback 메시지를 사용한다", () => {
    const response = handleApiError("string error", "Something went wrong");

    expect(response.status).toBe(500);
  });
});

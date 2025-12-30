import { describe, it, expect } from "vitest";
import { generateExcerpt } from "@/lib/excerpt";

describe("generateExcerpt", () => {
  describe("빈 콘텐츠 처리", () => {
    it("should return empty string for empty content", () => {
      expect(generateExcerpt("")).toBe("");
    });

    it("should return empty string for null/undefined content", () => {
      expect(generateExcerpt(null as unknown as string)).toBe("");
      expect(generateExcerpt(undefined as unknown as string)).toBe("");
    });
  });

  describe("마크다운 문법 제거", () => {
    it("should remove code blocks", () => {
      const content = "Before ```javascript\nconst x = 1;\n``` After";
      const result = generateExcerpt(content);
      expect(result).toBe("Before After");
    });

    it("should remove inline code", () => {
      const content = "Use `npm install` to install";
      const result = generateExcerpt(content);
      expect(result).toBe("Use to install");
    });

    it("should remove images", () => {
      const content = "Check this ![alt text](image.png) out";
      const result = generateExcerpt(content);
      expect(result).toBe("Check this out");
    });

    it("should keep link text but remove URL", () => {
      const content = "Visit [Google](https://google.com) for more";
      const result = generateExcerpt(content);
      expect(result).toBe("Visit Google for more");
    });

    it("should remove blockquotes", () => {
      const content = "> This is a quote\nNormal text";
      const result = generateExcerpt(content);
      expect(result).toBe("This is a quote Normal text");
    });

    it("should remove headers", () => {
      const content = "# Header\n## Subheader\nContent here";
      const result = generateExcerpt(content);
      expect(result).toBe("Content here");
    });

    it("should remove bold and italic markers", () => {
      const content = "This is **bold** and *italic* text";
      const result = generateExcerpt(content);
      expect(result).toBe("This is bold and italic text");
    });

    it("should remove strikethrough", () => {
      const content = "This is ~~deleted~~ text";
      const result = generateExcerpt(content);
      expect(result).toBe("This is deleted text");
    });

    it("should remove horizontal rules", () => {
      const content = "Above\n---\nBelow";
      const result = generateExcerpt(content);
      expect(result).toBe("Above Below");
    });
  });

  describe("길이 잘라내기", () => {
    it("should not truncate content shorter than maxLength", () => {
      const content = "Short content";
      const result = generateExcerpt(content, 100);
      expect(result).toBe("Short content");
    });

    it("should truncate content longer than maxLength", () => {
      const content = "This is a very long content that should be truncated to fit within the maximum length";
      const result = generateExcerpt(content, 30);
      expect(result.length).toBeLessThanOrEqual(33); // 30 + "..."
      expect(result).toContain("...");
    });

    it("should break at word boundaries when possible", () => {
      const content = "Word one two three four five six seven eight nine ten";
      const result = generateExcerpt(content, 25);
      // 25 chars: "Word one two three four " - last space at 24, which is > 20 (80% of 25)
      expect(result).toBe("Word one two three four...");
    });

    it("should use default maxLength of 150", () => {
      const longContent = "a ".repeat(100);
      const result = generateExcerpt(longContent);
      expect(result.length).toBeLessThanOrEqual(153); // 150 + "..."
    });
  });

  describe("공백 정규화", () => {
    it("should normalize multiple newlines to single space", () => {
      const content = "First\n\n\nSecond";
      const result = generateExcerpt(content);
      expect(result).toBe("First Second");
    });

    it("should normalize multiple spaces to single space", () => {
      const content = "Word   with    spaces";
      const result = generateExcerpt(content);
      expect(result).toBe("Word with spaces");
    });

    it("should trim leading and trailing whitespace", () => {
      const content = "   Content with spaces   ";
      const result = generateExcerpt(content);
      expect(result).toBe("Content with spaces");
    });
  });
});

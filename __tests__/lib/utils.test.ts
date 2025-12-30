import { describe, it, expect } from "vitest";
import { cn } from "@/lib/utils";

describe("cn (클래스명 유틸리티)", () => {
  it("should merge class names", () => {
    const result = cn("px-4", "py-2");
    expect(result).toBe("px-4 py-2");
  });

  it("should handle conditional classes", () => {
    const isActive = true;
    const result = cn("base-class", isActive && "active-class");
    expect(result).toBe("base-class active-class");
  });

  it("should handle falsy values", () => {
    const result = cn("base-class", false, null, undefined, "other-class");
    expect(result).toBe("base-class other-class");
  });

  it("should merge conflicting Tailwind classes", () => {
    const result = cn("px-4", "px-6");
    expect(result).toBe("px-6");
  });

  it("should handle array of classes", () => {
    const result = cn(["px-4", "py-2"]);
    expect(result).toBe("px-4 py-2");
  });

  it("should handle object syntax", () => {
    const result = cn({
      "base-class": true,
      "disabled-class": false,
      "active-class": true,
    });
    expect(result).toBe("base-class active-class");
  });

  it("should return empty string for no arguments", () => {
    const result = cn();
    expect(result).toBe("");
  });
});

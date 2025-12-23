const calculateReadingTime = (content) => {
  if (!content) return "1분 읽기";

  const cleanContent = content
    .replace(/```[\s\S]*?```/g, "")
    .replace(/`[^`]+`/g, "")
    .replace(/!\[.*?\]\(.*?\)/g, "")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[#*_~`]/g, "")
    .replace(/\n+/g, " ");

  const koreanChars = (cleanContent.match(/[\uAC00-\uD7A3]/g) || []).length;
  const englishWords = cleanContent
    .replace(/[\uAC00-\uD7A3]/g, "")
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;

  const KOREAN_CHARS_PER_MINUTE = 400;
  const ENGLISH_WORDS_PER_MINUTE = 200;

  const koreanMinutes = koreanChars / KOREAN_CHARS_PER_MINUTE;
  const englishMinutes = englishWords / ENGLISH_WORDS_PER_MINUTE;
  const totalMinutes = Math.ceil(koreanMinutes + englishMinutes);
  const readingMinutes = Math.max(1, totalMinutes);

  return `${readingMinutes}분 읽기`;
};

// Test cases
console.log("=== Reading Time Tests ===\n");
console.log("Test 1 - Empty content:", calculateReadingTime(""));
console.log("Test 2 - Short Korean:", calculateReadingTime("안녕하세요"));
console.log("Test 3 - Short English:", calculateReadingTime("Hello world"));
console.log("Test 4 - Mixed content:", calculateReadingTime("안녕하세요 Hello world 테스트"));
console.log("Test 5 - Code block:", calculateReadingTime("Some text ```js\nconst a = 1;\n``` more text"));
console.log("Test 6 - Link:", calculateReadingTime("[Click here](https://example.com) to visit"));
console.log("Test 7 - Image:", calculateReadingTime("![alt text](https://example.com/image.png)"));
console.log("Test 8 - Headers:", calculateReadingTime("# Header\n## Subheader\nSome text"));
console.log("Test 9 - Bold/Italic:", calculateReadingTime("**bold** and *italic* text"));
console.log("Test 10 - Large Korean text:", calculateReadingTime("가".repeat(400)));
console.log("Test 11 - Large English text:", calculateReadingTime("word ".repeat(200)));
console.log("Test 12 - Mixed large:", calculateReadingTime("한글 ".repeat(200) + "word ".repeat(100)));
console.log("Test 13 - Multiple newlines:", calculateReadingTime("Line 1\n\n\nLine 2\n\nLine 3"));
console.log("Test 14 - Inline code:", calculateReadingTime("Use `const` keyword in JavaScript"));
console.log(
  "Test 15 - Complex markdown:",
  calculateReadingTime(`
# Title
This is a paragraph with **bold** and *italic*.

\`\`\`javascript
function test() {
  console.log("code");
}
\`\`\`

Another paragraph with [link](https://example.com).
![image](image.png)
`)
);

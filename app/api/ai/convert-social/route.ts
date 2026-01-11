import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { openai } from "@ai-sdk/openai";
import { ApiError, handleApiError } from "@/lib/api/errors";
import { getAuthUser } from "@/lib/auth";
import { checkRateLimit } from "@/lib/rate-limit";
import { prisma } from "@/lib/prisma";

const LINKEDIN_CHAR_LIMIT = 3000;
const THREADS_CHAR_LIMIT = 500;

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      throw ApiError.unauthorized();
    }

    const rateLimit = checkRateLimit(`ai:convert:${user.id}`, 20);
    if (!rateLimit.allowed) {
      const retryAfter = Math.ceil((rateLimit.resetTime - Date.now()) / 1000);
      return NextResponse.json(
        {
          error: "너무 많은 요청입니다. 잠시 후 다시 시도해주세요.",
          code: "RATE_LIMIT_EXCEEDED",
          retryAfter,
        },
        {
          status: 429,
          headers: {
            "Retry-After": retryAfter.toString(),
          },
        }
      );
    }

    const { content, title, platform, presetId } = await request.json();

    if (!content || !title) {
      throw ApiError.validationError("제목과 내용이 필요합니다.");
    }

    if (platform !== "linkedin" && platform !== "threads") {
      throw ApiError.validationError("유효하지 않은 플랫폼입니다.");
    }

    if (!presetId) {
      throw ApiError.validationError("사전 지식을 선택해주세요.");
    }

    const preset = await prisma.aIKnowledgePreset.findUnique({
      where: { id: presetId },
      include: { references: true },
    });

    if (!preset) {
      throw ApiError.notFound("사전 지식");
    }

    await prisma.aIKnowledgePreset.update({
      where: { id: presetId },
      data: { lastUsedAt: new Date() },
    });

    const referenceContext =
      preset.references.length > 0
        ? `\n\n## 참고 자료\n${preset.references.map((ref) => `[${ref.title}]\n${ref.content}`).join("\n\n---\n\n")}`
        : "";

    const baseLinkedInRules = `
- 최대 ${LINKEDIN_CHAR_LIMIT}자 이내
- 전문적이고 인사이트 있는 톤
- 핵심 내용을 3-5개 포인트로 요약
- 적절한 해시태그 3-5개 추가 (마지막에 배치)
- 이모지를 적절히 사용하여 가독성 향상
- 원문의 핵심 메시지를 유지하되 더 임팩트 있게 작성`;

    const baseThreadsRules = `
- 각 포스트는 최대 ${THREADS_CHAR_LIMIT}자
- 여러 포스트로 자연스럽게 분할 (스레드 형식)
- 캐주얼하고 친근한 톤
- 각 포스트는 자연스러운 문단으로 끝내기
- 이모지를 적극 활용
- 첫 포스트에 전체 주제 소개, 마지막 포스트에 요약/CTA
- 각 포스트를 "---" 구분자로 분리하여 출력`;

    if (platform === "linkedin") {
      const systemPrompt = `${preset.instruction}

기본 규칙:${baseLinkedInRules}${referenceContext}`;

      const result = await generateText({
        model: openai("gpt-4o-mini"),
        system: systemPrompt,
        prompt: `다음 블로그 글을 LinkedIn 포스트로 변환해주세요.

제목: ${title}

내용:
${content}`,
        maxOutputTokens: 1000,
        temperature: 0.7,
      });

      return NextResponse.json({
        success: true,
        data: {
          linkedin: result.text.substring(0, LINKEDIN_CHAR_LIMIT),
        },
      });
    } else {
      const systemPrompt = `${preset.instruction}

기본 규칙:${baseThreadsRules}${referenceContext}`;

      const result = await generateText({
        model: openai("gpt-4o-mini"),
        system: systemPrompt,
        prompt: `다음 블로그 글을 Threads 스레드(여러 포스트)로 변환해주세요.

제목: ${title}

내용:
${content}

각 포스트를 "---"로 구분하여 출력하세요.`,
        maxOutputTokens: 1500,
        temperature: 0.7,
      });

      const threadsArray = result.text
        .split("---")
        .map((post) => post.trim())
        .filter((post) => post.length > 0)
        .map((post) => post.substring(0, THREADS_CHAR_LIMIT));

      return NextResponse.json({
        success: true,
        data: {
          threads: threadsArray,
        },
      });
    }
  } catch (error) {
    return handleApiError(error, "AI 변환에 실패했습니다.");
  }
}

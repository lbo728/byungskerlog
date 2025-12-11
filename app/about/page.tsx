import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">About</h1>

        <Card>
          <CardContent className="pt-6 space-y-6">
            <section>
              <h2 className="text-2xl font-semibold mb-4">안녕하세요, 병스커입니다.</h2>
              <p className="text-muted-foreground leading-relaxed">
                제품 주도 개발을 지향하는 개발자입니다.
                사용자에게 가치를 전달하는 것을 최우선으로 생각하며,
                기술은 그것을 실현하기 위한 도구라고 믿습니다.
              </p>
            </section>

            <Separator />

            <section>
              <h3 className="text-xl font-semibold mb-3">관심사</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>제품 개발과 사용자 경험</li>
                <li>웹 기술과 프론트엔드 아키텍처</li>
                <li>개발자 도구와 생산성</li>
                <li>지속 가능한 코드와 팀 문화</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h3 className="text-xl font-semibold mb-3">기술 스택</h3>
              <div className="flex flex-wrap gap-2">
                {["TypeScript", "React", "Next.js", "Node.js", "Prisma", "PostgreSQL", "Tailwind CSS"].map(
                  (tech) => (
                    <span key={tech} className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm">
                      {tech}
                    </span>
                  )
                )}
              </div>
            </section>

            <Separator />

            <section>
              <h3 className="text-xl font-semibold mb-3">연락</h3>
              <p className="text-muted-foreground">
                이 블로그의 글이나 프로젝트에 대해 이야기하고 싶으시다면 언제든 연락 주세요.
              </p>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

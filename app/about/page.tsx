import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

export default function AboutPage() {
  return (
    <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold mb-8">About</h1>

        <Card>
          <CardContent className="pt-6 space-y-6">
            <section className="space-y-4">
              <p className="text-muted-foreground leading-relaxed">
                프로덕트 디자이너로 커리어를 시작하여 현재는 프론트엔드 개발을 하고 있습니다.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                제품 중심 개발을 지향하고, 매일 꾸준 글쓰기를 하고 있습니다.
              </p>
              <p className="text-muted-foreground leading-relaxed">
                개발과 디자인, 비즈니스, 글쓰기에 대한 글을 쓰고 있어요.
              </p>
            </section>

            <Separator />

            <section>
              <h3 className="text-xl font-semibold mb-3">활동</h3>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li>TeoConf3 - 주니어 개발자의, 200일간 혼자만의 짧은 글쓰기로 성장하기</li>
              </ul>
            </section>

            <Separator />

            <section>
              <h3 className="text-xl font-semibold mb-3">Contact</h3>
              <div className="flex gap-3">
                <a
                  href="https://www.linkedin.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  링크드인
                </a>
                <span className="text-muted-foreground">|</span>
                <a
                  href="https://www.threads.net"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  스레드
                </a>
                <span className="text-muted-foreground">|</span>
                <a
                  href="https://x.com"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  X
                </a>
              </div>
            </section>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

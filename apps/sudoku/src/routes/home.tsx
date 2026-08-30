import { createRoute } from "@tanstack/react-router";

import { LocalOnlyBanner } from "@/components/local-only-banner";
import { Masthead } from "@/components/masthead";
import { rootRoute } from "@/routes/root";

function Home() {
  return (
    <div className="sd-shell mx-auto flex min-h-dvh max-w-3xl flex-col">
      <LocalOnlyBanner text="이 앱의 데이터는 이 기기에만 저장됩니다. 서버로 보내지 않습니다." />
      <Masthead sub="원목 보드와 세라믹 타일" title="스도쿠 3D" />
    </div>
  );
}

export const homeRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Home,
});

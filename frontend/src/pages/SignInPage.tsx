import SignInLeftPanel from "../modules/authPage/components/SignInLeftPanel"
import SignInFormSection from "../modules/authPage/components/SignInFormSection"
import SignUpFormSection from "../modules/authPage/components/SignUpFormSection";
import { useSearchParams } from "react-router";
import QueryParamRedirect from "../components/common/QueryParamRedirect";

export default function SignInPage() {
  const [searchParams] = useSearchParams();
  const authType = searchParams.get("type") || "signin";

  return (
    <QueryParamRedirect paramName="type" defaultValue="signin">
      <main className="flex min-h-screen">
        <SignInLeftPanel/>

        {authType === "signin" && <SignInFormSection />}
        {authType === "signup" && <SignUpFormSection />}

      </main>
    </QueryParamRedirect>
  )
}

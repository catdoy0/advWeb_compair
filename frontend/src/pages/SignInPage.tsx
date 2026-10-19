import SignInLeftPanel from "../modules/authPage/components/SignInLeftPanel"
import SignInFormSection from "../modules/authPage/components/SignInFormSection"
import SignUpFormSection from "../modules/authPage/components/SignUpFormSection";
import { useSearchParams } from "react-router";
import QueryParamRedirect from "../components/common/QueryParamRedirect";
import { useTitle } from "../hooks/useTitle";
import ForgetPassword from "../modules/authPage/components/ForgetPassword";
import EnterResetCode from "../modules/authPage/components/EnterResetCode";

export default function SignInPage() {
  const [searchParams] = useSearchParams();
  const authType = searchParams.get("type") || "signin";

  useTitle("Sign in")

  return (
    <QueryParamRedirect paramName="type" defaultValue="signin">
      <main className="flex min-h-screen">
        <SignInLeftPanel/>

        {authType === "signin" && <SignInFormSection />}
        {authType === "signup" && <SignUpFormSection />}
        {authType === "forget-password" && <ForgetPassword />}
        {authType === "enter-reset" && <EnterResetCode />}

      </main>
    </QueryParamRedirect>
  )
}

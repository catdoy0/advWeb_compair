import { useEffect } from "react";
import { useSearchParams } from "react-router";

interface QueryParamRedirectProps {
  paramName: string;
  defaultValue: string;
  children: React.ReactNode;
}

export default function QueryParamRedirect({ 
  paramName, 
  defaultValue, 
  children 
}: QueryParamRedirectProps) {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentParamValue = searchParams.get(paramName);

  useEffect(() => {
    if (!currentParamValue) {
      setSearchParams(
        (prev) => {
          prev.set(paramName, defaultValue);
          return prev;
        }, 
        { replace: true }
      );
    }
  }, [currentParamValue, paramName, defaultValue, setSearchParams]);

  return <>{children}</>;
}

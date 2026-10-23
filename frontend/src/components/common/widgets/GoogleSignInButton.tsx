import { useEffect, useRef } from "react";

interface GoogleCredentialResponse {
  credential: string;
}

interface GoogleIdentityServices {
  accounts: {
    id: {
      initialize: (options: {
        client_id: string;
        callback: (response: GoogleCredentialResponse) => void;
      }) => void;
      renderButton: (
        parent: HTMLElement,
        options: {
          theme: "outline";
          size: "large";
          text: "signin_with" | "signup_with";
          shape: "rectangular";
          width: number;
        },
      ) => void;
    };
  };
}

declare global {
  interface Window {
    google?: GoogleIdentityServices;
  }
}

const GOOGLE_SCRIPT = "https://accounts.google.com/gsi/client";
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
let scriptLoad: Promise<void> | null = null;

function loadGoogleIdentityServices(): Promise<void> {
  if (window.google?.accounts.id) return Promise.resolve();
  if (!scriptLoad) {
    scriptLoad = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = GOOGLE_SCRIPT;
      script.async = true;
      script.defer = true;
      script.onload = () => resolve();
      script.onerror = () => {
        scriptLoad = null;
        reject(new Error("Unable to load Google sign-in."));
      };
      document.head.appendChild(script);
    });
  }
  return scriptLoad;
}

export default function GoogleSignInButton({
  onCredential,
  onError,
  text = "signin_with",
}: {
  onCredential: (credential: string) => void;
  onError: (message: string) => void;
  text?: "signin_with" | "signup_with";
}) {
  const buttonRef = useRef<HTMLDivElement>(null);
  const onCredentialRef = useRef(onCredential);
  const onErrorRef = useRef(onError);
  onCredentialRef.current = onCredential;
  onErrorRef.current = onError;

  useEffect(() => {
    let mounted = true;
    if (!GOOGLE_CLIENT_ID) {
      onErrorRef.current("Google sign-in is not configured.");
      return () => { mounted = false; };
    }

    loadGoogleIdentityServices()
      .then(() => {
        if (!mounted || !buttonRef.current) return;
        if (!window.google) {
          onErrorRef.current("Google sign-in did not initialize. Please try again.");
          return;
        }
        window.google.accounts.id.initialize({
          client_id: GOOGLE_CLIENT_ID,
          callback: ({ credential }) => onCredentialRef.current(credential),
        });
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: "outline",
          size: "large",
          text,
          shape: "rectangular",
          width: 320,
        });
      })
      .catch(() => {
        if (mounted) onErrorRef.current("Unable to load Google sign-in. Please try again.");
      });

    return () => {
      mounted = false;
      if (buttonRef.current) buttonRef.current.replaceChildren();
    };
  }, [text]);

  return <div ref={buttonRef} className="flex min-h-10 justify-center" />;
}

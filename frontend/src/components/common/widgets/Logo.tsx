import { useNavigate } from "react-router";
import logo from "../../../assets/logo.png";
import { ROUTES } from "../../../routes";

interface LogoProps {
  size?: number;
  className?: string;
  variant?: "default" | "title" | "darkTitle"
}

export default function Logo({ size = 112, className = "" ,variant = "default"}: LogoProps) {
  const navigate = useNavigate();
  return (
    <div className="flex items-center gap-2 " >
      <img
        src={ logo }
        alt="Compair Logo"
        style={{ width: size, height: size }}
        className={`rounded-full object-cover hover:cursor-pointer shadow-lg${className}`}
        onClick={() => navigate(ROUTES.LANDINGPAGE)}
      />

      {variant !== "default" && (
        <div>
          <p className={`text-sm font-bold tracking-widest ${variant === "title" ? "text-white" : "dark:text-white"}`}
          >
            COMPAIR
          </p>
          <p className="text-2xs text-slate-400">Computer & laptop repair</p>
        </div>
      )}
    </div>
  );
}

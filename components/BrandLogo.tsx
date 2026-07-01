import Image from "next/image";

const LOGO_WIDTH = 887;
const LOGO_HEIGHT = 224;

type BrandLogoProps = {
  priority?: boolean;
  variant?: "default" | "light";
  className?: string;
};

export function BrandLogo({
  priority = false,
  variant = "default",
  className = "h-9 w-auto sm:h-10 md:h-11 lg:h-12",
}: BrandLogoProps) {
  if (variant === "light") {
    return (
      <span
        className={
          "inline-block font-black tracking-tight text-white text-2xl sm:text-[1.65rem] " +
          (className ?? "")
        }
        aria-label="mybeststore.pk"
      >
        mybeststore<span className="text-brand-accent">.pk</span>
      </span>
    );
  }

  return (
    <Image
      src="/logo.png"
      alt="mybeststore.pk"
      width={LOGO_WIDTH}
      height={LOGO_HEIGHT}
      priority={priority}
      className={className}
    />
  );
}

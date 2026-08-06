import logoAsset from "@/assets/assan-khata-logo.png.asset.json";
import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  alt?: string;
};

/** App brand mark (dark navy book with lime "assan khata"). */
export function Logo({ className, alt = "Assan Khata" }: Props) {
  return (
    <img
      src={logoAsset.url}
      alt={alt}
      width={512}
      height={512}
      className={cn("select-none object-contain", className)}
      draggable={false}
    />
  );
}

export const LOGO_URL = logoAsset.url;

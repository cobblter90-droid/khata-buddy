import { cn } from "@/lib/utils";

type Props = {
  className?: string;
  alt?: string;
};

/**
 * Brand mark drawn inline as an SVG data URL.
 *
 * It must never come from the network: the APK runs fully offline, and remote
 * images also taint the canvas used by the image export.
 */
const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <rect width="512" height="512" rx="108" fill="#22262E"/>
  <path d="M256 168c-30-22-70-30-108-30-14 0-26 2-36 5v190c10-3 22-5 36-5 38 0 78 8 108 30 30-22 70-30 108-30 14 0 26 2 36 5V143c-10-3-22-5-36-5-38 0-78 8-108 30z" fill="none" stroke="#C6F24E" stroke-width="20" stroke-linejoin="round"/>
  <path d="M256 168v190" stroke="#C6F24E" stroke-width="20" stroke-linecap="round"/>
  <path d="M300 118h48v96l-24-20-24 20z" fill="#C6F24E"/>
  <text x="256" y="418" text-anchor="middle" font-family="Verdana,DejaVu Sans,sans-serif" font-size="60" font-weight="bold" fill="#FFFFFF">assan</text>
  <text x="256" y="474" text-anchor="middle" font-family="Verdana,DejaVu Sans,sans-serif" font-size="60" font-weight="bold" fill="#C6F24E">khata</text>
</svg>`;

export const LOGO_URL = `data:image/svg+xml;utf8,${encodeURIComponent(SVG)}`;

/** App brand mark (dark navy book with lime "assan khata"). */
export function Logo({ className, alt = "Assan Khata" }: Props) {
  return (
    <img
      src={LOGO_URL}
      alt={alt}
      width={512}
      height={512}
      className={cn("select-none object-contain", className)}
      draggable={false}
    />
  );
}

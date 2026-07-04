import {
  ChevronLeft,
  ChevronRight,
  CircleGauge,
  ExternalLink,
  MoveHorizontal,
  Scale,
  X,
} from "lucide-react";
import * as React from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { AutmogProduct } from "@/lib/autmog-data";
import {
  type CurrencyCode,
  type CurrencyRates,
  type DimensionUnit,
  formatDate,
  formatDiameter,
  formatLength,
  formatPrice,
  formatWeight,
  type WeightUnit,
} from "@/lib/autmog-formatters";
import { cn } from "@/lib/utils";

type ProductLightboxProps = {
  currency: CurrencyCode;
  imageIndex: number;
  onClose: () => void;
  onImageChange: (nextIndex: number) => void;
  product: AutmogProduct | null;
  rates: CurrencyRates;
  units: DimensionUnit;
  weight: WeightUnit;
};

export function ProductLightbox({
  currency,
  imageIndex,
  onClose,
  onImageChange,
  product,
  rates,
  units,
  weight,
}: ProductLightboxProps) {
  const [touchStart, setTouchStart] = React.useState<{
    x: number;
    y: number;
  } | null>(null);
  const images = product?.images_local.length
    ? product.images_local
    : product
      ? [product.image]
      : [];
  const image = images[imageIndex] ?? images[0] ?? "";

  // Keep the latest values in a ref so the keyboard listener can subscribe
  // once per open. Re-subscribing on every index change would re-run the
  // scroll-lock effect and leak the locked body overflow when closing.
  const stateRef = React.useRef({
    imageIndex,
    length: images.length,
    onClose,
    onImageChange,
  });
  stateRef.current = {
    imageIndex,
    length: images.length,
    onClose,
    onImageChange,
  };

  React.useEffect(() => {
    if (!product) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const onKeyDown = (event: KeyboardEvent) => {
      const s = stateRef.current;
      if (event.key === "Escape") s.onClose();
      if (event.key === "ArrowLeft") {
        s.onImageChange(wrapIndex(s.imageIndex - 1, s.length));
      }
      if (event.key === "ArrowRight") {
        s.onImageChange(wrapIndex(s.imageIndex + 1, s.length));
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [product]);

  if (!product) return null;

  const specs = [
    {
      label: "Price",
      value: formatPrice(product.price_min, product.price_max, currency, rates),
    },
    {
      label: "Model",
      value: product.sizes.length > 0 ? product.sizes.join(" / ") : null,
    },
    { icon: Scale, label: "Weight", value: formatWeight(product, weight) },
    {
      icon: CircleGauge,
      label: "Diameter",
      value: formatDiameter(product, units),
    },
    {
      icon: MoveHorizontal,
      label: "Length",
      value: formatLength(product, units),
    },
  ].filter(
    (spec): spec is { icon?: typeof Scale; label: string; value: string } =>
      Boolean(spec.value),
  );

  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-black/85 p-3 backdrop-blur-md min-[881px]:items-stretch min-[881px]:p-10"
      role="dialog"
    >
      <button
        aria-label="Close product details"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        type="button"
      />
      <Button
        className="fixed top-3 right-3 z-[110] rounded-full bg-card/90 backdrop-blur"
        onClick={onClose}
        type="button"
        variant="outline"
      >
        <X />
        Close
      </Button>
      <div className="relative z-[101] grid w-full max-w-[1280px] overflow-hidden rounded-xl border border-border bg-card text-card-foreground shadow-2xl min-[881px]:grid-cols-[1.1fr_1fr]">
        <div
          className="relative flex aspect-4/3 min-h-0 items-start justify-center bg-muted min-[881px]:aspect-auto min-[881px]:min-h-[320px]"
          onTouchEnd={(event) => {
            if (!touchStart) return;
            const touch = event.changedTouches[0];
            if (!touch) return;
            const dx = touch.clientX - touchStart.x;
            const dy = touch.clientY - touchStart.y;

            if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy) * 1.5) {
              onImageChange(
                wrapIndex(imageIndex + (dx > 0 ? -1 : 1), images.length),
              );
            }
            setTouchStart(null);
          }}
          onTouchStart={(event) => {
            const touch = event.touches[0];
            if (!touch) return;
            setTouchStart({ x: touch.clientX, y: touch.clientY });
          }}
        >
          <img
            alt={product.title}
            className="h-full max-h-[60vh] w-full object-contain min-[881px]:max-h-none"
            src={image}
          />
          {product.published_at ? (
            <span className="absolute top-3 left-3 rounded-sm bg-card/85 px-2.5 py-1 text-xs font-bold backdrop-blur">
              '{product.published_at.slice(2, 4)}
            </span>
          ) : null}
          {images.length > 1 ? (
            <>
              <Button
                aria-label="Previous image"
                className="absolute top-1/2 left-3 rounded-full bg-card/75 backdrop-blur"
                onClick={() =>
                  onImageChange(wrapIndex(imageIndex - 1, images.length))
                }
                size="icon"
                type="button"
                variant="outline"
              >
                <ChevronLeft />
              </Button>
              <Button
                aria-label="Next image"
                className="absolute top-1/2 right-3 rounded-full bg-card/75 backdrop-blur"
                onClick={() =>
                  onImageChange(wrapIndex(imageIndex + 1, images.length))
                }
                size="icon"
                type="button"
                variant="outline"
              >
                <ChevronRight />
              </Button>
              <span className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-card/75 px-2.5 py-1 text-[11px] text-muted-foreground backdrop-blur">
                {imageIndex + 1} / {images.length}
              </span>
            </>
          ) : null}
        </div>

        <div className="flex min-w-0 flex-col gap-4 overflow-y-auto p-5 min-[601px]:p-8">
          <div className="text-[11px] tracking-[1px] text-muted-foreground uppercase">
            Released · {formatDate(product.published_at)}
          </div>
          <h2 className="text-[22px] leading-[1.15] font-bold min-[601px]:text-[28px]">
            {product.title}
          </h2>
          {product.archived ? (
            <Badge className="w-fit rounded-full bg-accent text-accent-foreground">
              Archived - no longer listed
            </Badge>
          ) : null}

          <div className="grid grid-cols-[repeat(auto-fit,minmax(120px,1fr))] gap-3 rounded-lg border border-border bg-secondary p-4">
            {specs.map(({ icon: Icon, label, value }) => (
              <div className="flex flex-col gap-1" key={label}>
                <span className="text-[10px] tracking-[0.8px] text-muted-foreground uppercase">
                  {label}
                </span>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold">
                  {Icon ? <Icon className="size-3.5" /> : null}
                  {value}
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-wrap gap-1.5">
            {[
              ...product.materials.map((tag) => [tag, "material"] as const),
              ...product.refills.map((tag) => [tag, "refill"] as const),
              ...product.noses.map((tag) => [tag, "nose"] as const),
              ...product.mechanisms.map((tag) => [tag, "default"] as const),
              ...product.clips.map((tag) => [tag, "default"] as const),
              ...product.body_details.map((tag) => [tag, "default"] as const),
              ...product.finishes.map((tag) => [tag, "default"] as const),
            ].map(([tag, kind]) => (
              <span
                className={cn(
                  "rounded-full px-2.5 py-1 text-[11px] tracking-[0.3px]",
                  kind === "material" && "bg-chart-1/15 text-chart-1",
                  kind === "refill" && "bg-chart-3/15 text-chart-3",
                  kind === "nose" && "bg-chart-4/15 text-chart-4",
                  kind === "default" &&
                    "bg-secondary text-secondary-foreground",
                )}
                key={`${kind}-${tag}`}
              >
                {tag}
              </span>
            ))}
          </div>

          <p className="whitespace-pre-wrap text-[13.5px] leading-[1.6] text-muted-foreground italic">
            {product.body_text || "(no description on file)"}
          </p>

          <div className="border-t border-border pt-3">
            <Button asChild className="w-full">
              <a href={product.url} rel="noopener" target="_blank">
                Visit product page
                <ExternalLink />
              </a>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function wrapIndex(index: number, length: number) {
  if (length <= 0) return 0;
  return (index + length) % length;
}

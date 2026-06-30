export function PageFooter() {
  return (
    <footer className="mx-auto mt-9 mb-7 max-w-[720px] border-t border-border px-6 pt-4 text-center text-[12.5px] leading-7 text-muted-foreground">
      <div>
        A resource for{" "}
        <a
          className="text-primary underline underline-offset-2"
          href="https://www.reddit.com/r/machinedpens/"
          rel="noopener"
          target="_blank"
        >
          r/machinedpens
        </a>{" "}
        and the Machined Pens Discord.
      </div>
      <div>
        Suggestions or contact:{" "}
        <a
          className="text-primary underline underline-offset-2"
          href="https://www.reddit.com/user/BVG_Digital/"
          rel="noopener"
          target="_blank"
        >
          u/BVG_Digital
        </a>
      </div>
      <div className="mx-auto mt-3 max-w-[640px] border-t border-border pt-3 text-[11.5px] leading-5 opacity-70">
        Product names, images, and descriptions remain the property of their
        respective owners. Made by a fan; not affiliated with any maker.
      </div>
    </footer>
  );
}

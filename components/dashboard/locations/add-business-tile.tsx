export function AddBusinessTile({ onClick }: { onClick: () => void }) {
  return (
    <li className="flex h-full min-h-[320px]">
      <button
        type="button"
        onClick={onClick}
        className="group flex h-full min-h-0 w-full flex-1 flex-col items-center justify-center rounded-lg border-2 border-dashed border-subdued bg-card text-muted-foreground transition-colors hover:border-primary hover:bg-accent/60"
        aria-label="Add a new business"
      >
        <span className="relative inline-flex">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            height="48px"
            viewBox="0 -960 960 960"
            width="48px"
            className="fill-subdued transition-colors group-hover:fill-primary"
          >
            <path d="M721-46v-121H601v-60h120v-120h60v120h120v60H781v121h-60ZM110-167v-245H60v-60l44-202h590l46 207v55h-49v155h-60v-155H426v245H110Zm60-60h196v-185H170v185Zm-66-507v-60h592v60H104Z" />
          </svg>
        </span>
      </button>
    </li>
  );
}

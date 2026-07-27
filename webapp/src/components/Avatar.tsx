function initialsFrom(name: string): string {
  const parts = name.trim().split(/\s+/);
  const initials = parts.slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "");
  return initials.join("") || "?";
}

export function Avatar({
  avatarUrl,
  name,
  size = 64,
}: {
  avatarUrl: string | null;
  name: string;
  size?: number;
}) {
  if (avatarUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return (
      <img
        src={avatarUrl}
        alt={name}
        width={size}
        height={size}
        className="rounded-full object-cover"
        style={{ width: size, height: size }}
      />
    );
  }

  return (
    <div
      className="flex items-center justify-center rounded-full bg-accent font-semibold text-white"
      style={{ width: size, height: size, fontSize: size * 0.4 }}
    >
      {initialsFrom(name)}
    </div>
  );
}

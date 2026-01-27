import type { ReactNode } from "react";
import { UserCog } from "lucide-react";

export type ProfileMetaItem = {
  icon: ReactNode;
  value: ReactNode;
  span?: "full" | "half";
  nowrap?: boolean;
};

type AvatarConfig = {
  fallback?: string;
  archived?: boolean;
};

type ProfileHeaderProps = {
  back?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  avatar?: AvatarConfig;
  meta?: ProfileMetaItem[];
  actions?: ReactNode;
};

export const ProfileHeader = ({
  back,
  title,
  subtitle,
  avatar,
  meta,
  actions,
}: ProfileHeaderProps) => {
  const isArchived = avatar?.archived;

  return (
    <div className="bg-white p-8 rounded-2xl border border-gray-100 shadow-sm relative overflow-hidden">
      <div
        className={`absolute top-0 left-0 right-0 h-1 ${
          isArchived ? "bg-amber-400" : "bg-indigo-600"
        }`}
      />

      <div className="flex flex-col md:flex-row gap-8 items-start">
        {/* Avatar */}
        <div
          className={`h-24 w-24 flex-shrink-0 rounded-2xl flex items-center justify-center text-white text-3xl font-bold shadow-lg ${
            isArchived ? "bg-gray-400" : "bg-indigo-600"
          }`}
        >
          {avatar?.fallback ?? <UserCog size={32} />}
        </div>

        {/* Main */}
        <div className="flex-1 min-w-0 space-y-3">
          {back}

          <div className="space-y-1">
            <h1 className="text-3xl font-bold text-gray-900">{title}</h1>
            {subtitle}
          </div>

          {meta && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6">
              {meta.map((item, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 text-gray-600 min-w-0 ${
                    item.span === "full" ? "md:col-span-2" : ""
                  }`}
                >
                  <span className="mt-0.5 text-gray-400 flex-shrink-0">
                    {item.icon}
                  </span>
                  <span
                    className={`text-sm leading-snug ${
                      item.nowrap ? "truncate whitespace-nowrap" : "break-words"
                    }`}
                  >
                    {item.value}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Actions */}
        {actions && <div className="flex flex-wrap gap-3">{actions}</div>}
      </div>
    </div>
  );
};

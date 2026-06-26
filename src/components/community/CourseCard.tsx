import { format } from "date-fns";
import { it } from "date-fns/locale";
import { MapPin, Calendar, Users, GraduationCap, Mail, BadgeCheck } from "lucide-react";
import type { CourseWithDetails } from "@/hooks/useCourses";
import { t } from "@/lib/i18n";

const courseTypeLabels: Record<string, string> = {
  beginner: "Base",
  advanced: "Avanzato",
  instructor: "Istruttore",
  specialty: "Specialità",
};

interface CourseCardProps {
  course: CourseWithDetails;
  onClick: () => void;
}

export const CourseCard = ({ course, onClick }: CourseCardProps) => {
  const formatDateRange = () => {
    const start = new Date(course.start_date);
    const end = new Date(course.end_date);
    return `${format(start, "d", { locale: it })}–${format(end, "d MMM yyyy", { locale: it })}`;
  };

  const hasCover = !!course.cover_image_url;
  const chipClass = hasCover ? "chip-solid" : "chip-session";
  const typeChipClass = hasCover
    ? "chip-solid-accent bg-emerald-600"
    : "inline-flex items-center gap-1 text-xs py-1 px-2.5 rounded-full bg-emerald-500/20 text-emerald-300";
  const softText = hasCover ? "text-white/90 cover-text-shadow" : "text-[hsl(var(--card-soft))]";
  const titleText = hasCover ? "text-white cover-text-shadow" : "text-card-foreground";

  return (
    <button
      onClick={onClick}
      className={`card-session min-w-[280px] max-w-[280px] text-left ${hasCover ? "has-cover min-h-[210px]" : ""}`}
    >
      {hasCover && (
        <>
          <div
            aria-hidden
            className="absolute inset-0 z-0 bg-cover bg-center pointer-events-none brightness-[0.85] saturate-[0.9]"
            style={{ backgroundImage: `url(${course.cover_image_url})` }}
          />
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-[40%] z-0 bg-gradient-to-b from-black/55 via-black/15 to-transparent pointer-events-none"
          />
          <div
            aria-hidden
            className="absolute inset-x-0 bottom-0 h-[70%] z-0 bg-gradient-to-t from-black/85 via-black/55 to-transparent pointer-events-none"
          />
        </>
      )}
      {/* Type badge + location */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={typeChipClass}>
          <GraduationCap className="w-3 h-3" />
          {courseTypeLabels[course.course_type] || course.course_type}
        </span>
        {course.location && (
          <span className={`${chipClass} flex items-center gap-1`}>
            <MapPin className="w-3 h-3" />
            {course.location.length > 20 ? course.location.slice(0, 20) + "…" : course.location}
          </span>
        )}
      </div>

      {/* Date range */}
      <div className={`flex items-center gap-1.5 text-xs ${softText}`}>
        <Calendar className="w-3 h-3" />
        {formatDateRange()}
      </div>

      {/* Title */}
      <h3 className={`font-semibold text-sm leading-tight line-clamp-2 ${titleText}`}>
        {hasCover ? (
          <span className="bg-black/55 box-decoration-clone px-1.5 py-0.5 rounded-md">{course.title}</span>
        ) : course.title}
      </h3>

      {/* Info chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {course.max_participants > 0 && (
          (() => {
            const left = course.max_participants - course.participant_count;
            const isFull = left <= 0;
            return (
              <span className={`${chipClass} flex items-center gap-1 ${isFull ? "!bg-destructive !text-destructive-foreground" : ""}`}>
                <Users className="w-3 h-3" />
                {isFull ? t("fullShort") : `${left} ${t("spots")}`}
              </span>
            );
          })()
        )}
        {course.contact_email && (
          <span className={`${chipClass} flex items-center gap-1`}>
            <Mail className="w-3 h-3" />
            Contatto
          </span>
        )}
        {course.is_paid && (
          <span className={chipClass}>💰</span>
        )}
      </div>

      {/* Creator */}
      <div className="flex items-center justify-between mt-auto pt-1">
        <div className="flex items-center gap-2">
          {course.group_name ? (
            <>
              <div className={`avatar-creator overflow-hidden ${hasCover ? "ring-2 ring-white/80 shadow-md" : ""}`}>
                {course.group_avatar ? (
                  <img src={course.group_avatar} className="w-full h-full rounded-full object-cover" alt="" />
                ) : (
                  course.group_name.charAt(0).toUpperCase()
                )}
              </div>
              <span className={`text-xs flex items-center gap-1 ${softText}`}>
                {course.group_name}
                {course.group_verified && <BadgeCheck className="w-3 h-3 text-primary" />}
              </span>
            </>
          ) : (
            <>
              <div className={`avatar-creator ${hasCover ? "ring-2 ring-white/80 shadow-md" : ""}`}>
                {course.creator_avatar ? (
                  <img src={course.creator_avatar} className="w-full h-full rounded-full object-cover" alt="" />
                ) : (
                  course.creator_name.charAt(0).toUpperCase()
                )}
              </div>
              <span className={`text-xs ${softText}`}>
                {course.creator_name}
                {course.creator_is_instructor && ` · ${t("roleInstructor")}`}
              </span>
            </>
          )}
        </div>
        <span className={hasCover ? "chip-solid text-[11px]" : "text-xs text-[hsl(var(--card-soft))] underline"}>Dettagli</span>
      </div>
    </button>
  );
};

import { format } from "date-fns";
import { it } from "date-fns/locale";
import { MapPin, Calendar, Users, GraduationCap, Mail } from "lucide-react";
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

  return (
    <button
      onClick={onClick}
      className="card-session min-w-[280px] max-w-[280px] text-left"
    >
      {/* Type badge + location */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className="inline-flex items-center gap-1 text-xs py-1 px-2.5 rounded-full bg-emerald-500/20 text-emerald-300">
          <GraduationCap className="w-3 h-3" />
          {courseTypeLabels[course.course_type] || course.course_type}
        </span>
        {course.location && (
          <span className="chip-session flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {course.location.length > 20 ? course.location.slice(0, 20) + "…" : course.location}
          </span>
        )}
      </div>

      {/* Date range */}
      <div className="flex items-center gap-1.5 text-xs text-[hsl(var(--card-soft))]">
        <Calendar className="w-3 h-3" />
        {formatDateRange()}
      </div>

      {/* Title */}
      <h3 className="font-semibold text-card-foreground text-sm leading-tight line-clamp-2">
        {course.title}
      </h3>

      {/* Info chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {course.max_participants > 0 && (
          (() => {
            const left = course.max_participants - course.participant_count;
            const isFull = left <= 0;
            return (
              <span className={`chip-session flex items-center gap-1 ${isFull ? "!bg-destructive/15 !text-destructive" : ""}`}>
                <Users className="w-3 h-3" />
                {isFull ? t("fullShort") : `${left} ${t("spots")}`}
              </span>
            );
          })()
        )}
        {course.contact_email && (
          <span className="chip-session flex items-center gap-1">
            <Mail className="w-3 h-3" />
            Contatto
          </span>
        )}
        {course.is_paid && (
          <span className="chip-session">💰</span>
        )}
      </div>

      {/* Creator */}
      <div className="flex items-center justify-between mt-auto pt-1">
        <div className="flex items-center gap-2">
          <div className="avatar-creator">
            {course.creator_avatar ? (
              <img src={course.creator_avatar} className="w-full h-full rounded-full object-cover" alt="" />
            ) : (
              course.creator_name.charAt(0).toUpperCase()
            )}
          </div>
          <span className="text-xs text-[hsl(var(--card-soft))]">
            {course.creator_name}
            {course.creator_is_instructor && ` · ${t("roleInstructor")}`}
          </span>
        </div>
        <span className="text-xs text-[hsl(var(--card-soft))] underline">Dettagli</span>
      </div>
    </button>
  );
};

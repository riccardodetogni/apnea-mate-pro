import { Mail, Phone, ExternalLink } from "lucide-react";

interface ContactInfoProps {
  email?: string | null;
  phone?: string | null;
  url?: string | null;
}

export const ContactInfo = ({ email, phone, url }: ContactInfoProps) => {
  if (!email && !phone && !url) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {email && (
        <a
          href={`mailto:${email}`}
          className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
        >
          <Mail className="w-3.5 h-3.5" />
          {email}
        </a>
      )}
      {phone && (
        <a
          href={`tel:${phone}`}
          className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
        >
          <Phone className="w-3.5 h-3.5" />
          {phone}
        </a>
      )}
      {url && (
        <a
          href={url.startsWith("http") ? url : `https://${url}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-full bg-primary/10 text-primary hover:bg-primary/20 transition-colors"
        >
          <ExternalLink className="w-3.5 h-3.5" />
          Info
        </a>
      )}
    </div>
  );
};

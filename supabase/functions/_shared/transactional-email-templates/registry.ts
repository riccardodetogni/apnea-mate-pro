/// <reference types="npm:@types/react@18.3.1" />
import * as React from 'npm:react@18.3.1'

export interface TemplateEntry {
  component: React.ComponentType<any>
  subject: string | ((data: Record<string, any>) => string)
  to?: string
  displayName?: string
  previewData?: Record<string, any>
}

import { template as waitlistConfirmation } from './waitlist-confirmation.tsx'
import { template as waitlistConfirmationEn } from './waitlist-confirmation-en.tsx'
import { template as launchAnnouncementIt } from './launch-announcement-it.tsx'
import { template as launchAnnouncementEn } from './launch-announcement-en.tsx'
import { template as sessionJoinRequest } from './session-join-request.tsx'
import { template as sessionRequestApproved } from './session-request-approved.tsx'
import { template as sessionRequestRejected } from './session-request-rejected.tsx'
import { template as certificationApproved } from './certification-approved.tsx'
import { template as certificationRejected } from './certification-rejected.tsx'
import { template as groupRequestReceived } from './group-request-received.tsx'
import { template as groupRequestApproved } from './group-request-approved.tsx'
import { template as groupRequestRejected } from './group-request-rejected.tsx'
import { template as courseJoinRequest } from './course-join-request.tsx'
import { template as courseRequestApproved } from './course-request-approved.tsx'
import { template as courseRequestRejected } from './course-request-rejected.tsx'
import { template as eventJoinRequest } from './event-join-request.tsx'
import { template as eventRequestApproved } from './event-request-approved.tsx'
import { template as eventRequestRejected } from './event-request-rejected.tsx'

export const TEMPLATES: Record<string, TemplateEntry> = {
  'waitlist-confirmation': waitlistConfirmation,
  'waitlist-confirmation-it': waitlistConfirmation,
  'waitlist-confirmation-en': waitlistConfirmationEn,
  'launch-announcement-it': launchAnnouncementIt,
  'launch-announcement-en': launchAnnouncementEn,
  'session-join-request': sessionJoinRequest,
  'session-request-approved': sessionRequestApproved,
  'session-request-rejected': sessionRequestRejected,
  'certification-approved': certificationApproved,
  'certification-rejected': certificationRejected,
  'group-request-received': groupRequestReceived,
  'group-request-approved': groupRequestApproved,
  'group-request-rejected': groupRequestRejected,
  'course-join-request': courseJoinRequest,
  'course-request-approved': courseRequestApproved,
  'course-request-rejected': courseRequestRejected,
  'event-join-request': eventJoinRequest,
  'event-request-approved': eventRequestApproved,
  'event-request-rejected': eventRequestRejected,
}
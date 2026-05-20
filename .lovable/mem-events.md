---
name: Events and Courses
description: Creation rules, group attachment, and chat behavior for Events and Courses
type: feature
---
The application supports 'Eventi' (multi-day activities like stages, competitions, or trips) and 'Corsi' (specialized training courses). Creation is restricted to users with role `instructor` or `admin`. Attaching a group is **optional**: the picker only appears if the creator owns/admins at least one group, and includes a "none" choice. RLS allows `group_id` NULL or any group the creator owns (verification is no longer required). Both features support multi-day date ranges, rich descriptions, and contact fields (email, phone, URL). Events include a dedicated group chat (only when a group is attached) and an optional day-by-day schedule, while Course chats are explicitly excluded. Showcased in the Community feed and Group pages via specialized cards with distinct color-coding.

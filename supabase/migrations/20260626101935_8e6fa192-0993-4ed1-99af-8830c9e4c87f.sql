REVOKE EXECUTE ON FUNCTION public.rejoin_session(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.rejoin_event(uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.rejoin_course(uuid) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.rejoin_session(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rejoin_event(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.rejoin_course(uuid) TO authenticated;
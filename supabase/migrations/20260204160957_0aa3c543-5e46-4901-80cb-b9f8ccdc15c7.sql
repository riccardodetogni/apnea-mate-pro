-- Create spot_favorites table for users to save favorite spots
CREATE TABLE public.spot_favorites (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  spot_id UUID NOT NULL REFERENCES public.spots(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, spot_id)
);

-- Enable RLS
ALTER TABLE public.spot_favorites ENABLE ROW LEVEL SECURITY;

-- Users can view their own favorites
CREATE POLICY "Users can view their own spot favorites"
ON public.spot_favorites
FOR SELECT
USING (auth.uid() = user_id);

-- Users can add their own favorites
CREATE POLICY "Users can add spot favorites"
ON public.spot_favorites
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can remove their own favorites
CREATE POLICY "Users can delete their own spot favorites"
ON public.spot_favorites
FOR DELETE
USING (auth.uid() = user_id);
-- Create table for bus configurations
CREATE TABLE public.bus_configurations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID,
  bus_name TEXT NOT NULL,
  license_plates TEXT NOT NULL,
  main_deck_rows INTEGER NOT NULL DEFAULT 12,
  upper_deck_rows INTEGER NOT NULL DEFAULT 3,
  has_upper_deck BOOLEAN NOT NULL DEFAULT false,
  last_row_seats INTEGER NOT NULL DEFAULT 5 CHECK (last_row_seats IN (4, 5)),
  tour_guide_seats TEXT[] DEFAULT ARRAY[]::TEXT[],
  empty_spaces TEXT[] DEFAULT ARRAY[]::TEXT[],
  seat_numbers JSONB DEFAULT '{}'::jsonb,
  people JSONB DEFAULT '[]'::jsonb,
  config_data JSONB NOT NULL,
  share_token TEXT UNIQUE DEFAULT gen_random_uuid()::text,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.bus_configurations ENABLE ROW LEVEL SECURITY;

-- Create policies for user access
CREATE POLICY "Users can view their own bus configurations" 
ON public.bus_configurations 
FOR SELECT 
USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can create their own bus configurations" 
ON public.bus_configurations 
FOR INSERT 
WITH CHECK (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can update their own bus configurations" 
ON public.bus_configurations 
FOR UPDATE 
USING (user_id = auth.uid() OR user_id IS NULL);

CREATE POLICY "Users can delete their own bus configurations" 
ON public.bus_configurations 
FOR DELETE 
USING (user_id = auth.uid() OR user_id IS NULL);

-- Create policy for public sharing (by share token)
CREATE POLICY "Public can view shared bus configurations" 
ON public.bus_configurations 
FOR SELECT 
USING (share_token IS NOT NULL);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
NEW.updated_at = now();
RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_bus_configurations_updated_at
BEFORE UPDATE ON public.bus_configurations
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create index for better performance
CREATE INDEX idx_bus_configurations_user_id ON public.bus_configurations(user_id);
CREATE INDEX idx_bus_configurations_share_token ON public.bus_configurations(share_token);